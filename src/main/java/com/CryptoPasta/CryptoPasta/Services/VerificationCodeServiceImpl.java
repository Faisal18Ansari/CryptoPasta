package com.CryptoPasta.CryptoPasta.Services;

import com.CryptoPasta.CryptoPasta.Domain.TwoFactorOperation;
import com.CryptoPasta.CryptoPasta.Domain.VerificationType;
import com.CryptoPasta.CryptoPasta.Model.User;
import com.CryptoPasta.CryptoPasta.Model.VerificationCode;
import com.CryptoPasta.CryptoPasta.Repository.VerificationCodeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class VerificationCodeServiceImpl implements VerificationCodeService {

    private static final int OTP_TTL_MINUTES = 5;
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int RESEND_COOLDOWN_SECONDS = 60;

    @Autowired
    private VerificationCodeRepository verificationCodeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public VerificationCode sendVerificationCode(
            User user,
            VerificationType verificationType,
            TwoFactorOperation operation,
            String otp) {
        Instant now = Instant.now();
        verificationCodeRepository.findByUserIdForUpdate(user.getId()).ifPresent(existing -> {
            Instant createdAt = existing.getCreatedAt();
            if (createdAt != null
                    && now.isBefore(createdAt.plusSeconds(RESEND_COOLDOWN_SECONDS))) {
                throw new ResponseStatusException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "Wait before requesting another verification code."
                );
            }
            verificationCodeRepository.delete(existing);
            verificationCodeRepository.flush();
        });

        VerificationCode verificationCode = new VerificationCode();
        verificationCode.setOtpHash(passwordEncoder.encode(otp));
        verificationCode.setVerificationType(verificationType);
        verificationCode.setUser(user);
        verificationCode.setEmail(user.getEmail());
        verificationCode.setOperation(operation);
        verificationCode.setCreatedAt(now);
        verificationCode.setExpiresAt(now.plus(OTP_TTL_MINUTES, ChronoUnit.MINUTES));
        verificationCode.setFailedAttempts(0);
        return verificationCodeRepository.save(verificationCode);
    }

    @Override
    @Transactional
    public OtpVerificationResult verifyVerificationCode(
            Long id,
            Long userId,
            TwoFactorOperation operation,
            String otp) {
        VerificationCode challenge = verificationCodeRepository
                .findByIdAndUserIdForUpdate(id, userId, operation)
                .orElse(null);
        if (challenge == null) {
            return OtpVerificationResult.failure(OtpVerificationResult.Status.NOT_FOUND);
        }

        Instant expiresAt = challenge.getExpiresAt();
        if (expiresAt == null || !Instant.now().isBefore(expiresAt)) {
            verificationCodeRepository.delete(challenge);
            return OtpVerificationResult.failure(OtpVerificationResult.Status.EXPIRED);
        }

        if (!passwordEncoder.matches(otp, challenge.getOtpHash())) {
            challenge.setFailedAttempts(challenge.getFailedAttempts() + 1);
            if (challenge.getFailedAttempts() >= MAX_FAILED_ATTEMPTS) {
                verificationCodeRepository.delete(challenge);
                return OtpVerificationResult.failure(OtpVerificationResult.Status.LOCKED);
            }
            verificationCodeRepository.save(challenge);
            return OtpVerificationResult.failure(OtpVerificationResult.Status.INVALID);
        }

        verificationCodeRepository.delete(challenge);
        return OtpVerificationResult.success(challenge.getUser());
    }

    @Override
    @Transactional
    public void deleteVerificationCodeById(Long id) {
        verificationCodeRepository.deleteById(id);
    }
}
