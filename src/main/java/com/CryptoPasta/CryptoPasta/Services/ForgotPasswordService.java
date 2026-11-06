package com.CryptoPasta.CryptoPasta.Services;

import com.CryptoPasta.CryptoPasta.Domain.VerificationType;
import com.CryptoPasta.CryptoPasta.Model.ForgotPasswordToken;
import com.CryptoPasta.CryptoPasta.Model.User;

public interface ForgotPasswordService {
    ForgotPasswordToken createToken(User user, String id, String otp, VerificationType verificationType, String sendTo);

    ForgotPasswordToken findById(String id);

    ForgotPasswordToken findByUser(Long userId);

    void deleteToken(ForgotPasswordToken token);
}
