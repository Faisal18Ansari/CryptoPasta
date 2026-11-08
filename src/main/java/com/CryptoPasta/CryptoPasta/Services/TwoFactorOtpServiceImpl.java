package com.CryptoPasta.CryptoPasta.Services;

import com.CryptoPasta.CryptoPasta.Model.TwoFactorOtp;
import com.CryptoPasta.CryptoPasta.Model.User;
import com.CryptoPasta.CryptoPasta.Repository.TwoFactorOtpRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class TwoFactorOtpServiceImpl implements TwoFactorOtpService {

    private static final int OTP_TTL_MINUTES = 5;
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int RESEND_COOLDOWN_SECONDS = 60;

    @Autowired
    private TwoFactorOtpRepository twoFactorOtpRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public TwoFactorOtp createTwoFactorOtp(User user, String otp) {
        Instant now = Instant.now();
        twoFactorOtpRepository.findByUserIdForUpdate(user.getId()).ifPresent(existing -> {
            Instant createdAt = existing.getCreatedAt();
            if (createdAt != null
                    && now.isBefore(createdAt.plusSeconds(RESEND_COOLDOWN_SECONDS))) {
                throw new ResponseStatusException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "Wait before requesting another verification code."
                );
            }
            twoFactorOtpRepository.delete(existing);
            twoFactorOtpRepository.flush();
        });

        TwoFactorOtp twoFactorOtp = new TwoFactorOtp();
        twoFactorOtp.setOtpHash(passwordEncoder.encode(otp));
        twoFactorOtp.setCreatedAt(now);
        twoFactorOtp.setExpiresAt(now.plus(OTP_TTL_MINUTES, ChronoUnit.MINUTES));
        twoFactorOtp.setFailedAttempts(0);
        twoFactorOtp.setId(UUID.randomUUID().toString());
        twoFactorOtp.setUser(user);
        return twoFactorOtpRepository.save(twoFactorOtp);
    }

    @Override
    @Transactional
    public OtpVerificationResult verifyTwoFactorOtp(String id, String otp) {
        TwoFactorOtp challenge = twoFactorOtpRepository.findByIdForUpdate(id).orElse(null);
        if (challenge == null) {
            return OtpVerificationResult.failure(OtpVerificationResult.Status.NOT_FOUND);
        }

        Instant expiresAt = challenge.getExpiresAt();
        if (expiresAt == null || !Instant.now().isBefore(expiresAt)) {
            twoFactorOtpRepository.delete(challenge);
            return OtpVerificationResult.failure(OtpVerificationResult.Status.EXPIRED);
        }

        if (!passwordEncoder.matches(otp, challenge.getOtpHash())) {
            challenge.setFailedAttempts(challenge.getFailedAttempts() + 1);
            if (challenge.getFailedAttempts() >= MAX_FAILED_ATTEMPTS) {
                twoFactorOtpRepository.delete(challenge);
                return OtpVerificationResult.failure(OtpVerificationResult.Status.LOCKED);
            }
            twoFactorOtpRepository.save(challenge);
            return OtpVerificationResult.failure(OtpVerificationResult.Status.INVALID);
        }

        User user = challenge.getUser();
        twoFactorOtpRepository.delete(challenge);
        return OtpVerificationResult.success(user);
    }

    @Override
    @Transactional
    public void deleteTwoFactorOtp(String id) {
        twoFactorOtpRepository.deleteById(id);
    }
}
