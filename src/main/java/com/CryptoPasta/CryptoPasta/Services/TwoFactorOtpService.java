package com.CryptoPasta.CryptoPasta.Services;

import com.CryptoPasta.CryptoPasta.Model.TwoFactorOtp;
import com.CryptoPasta.CryptoPasta.Model.User;

public interface TwoFactorOtpService {

    TwoFactorOtp createTwoFactorOtp(User user, String otp);

    OtpVerificationResult verifyTwoFactorOtp(String id, String otp);

    void deleteTwoFactorOtp(String id);

}
