package com.CryptoPasta.CryptoPasta.Services;

import com.CryptoPasta.CryptoPasta.Domain.TwoFactorOperation;
import com.CryptoPasta.CryptoPasta.Domain.VerificationType;
import com.CryptoPasta.CryptoPasta.Model.User;
import com.CryptoPasta.CryptoPasta.Model.VerificationCode;

public interface VerificationCodeService {

    VerificationCode sendVerificationCode(
            User user,
            VerificationType verificationType,
            TwoFactorOperation operation,
            String otp);

    OtpVerificationResult verifyVerificationCode(
            Long id,
            Long userId,
            TwoFactorOperation operation,
            String otp);

    void deleteVerificationCodeById(Long id);
    
}
