package com.CryptoPasta.CryptoPasta.Services;

import com.CryptoPasta.CryptoPasta.Model.TwoFactorOtp;
import com.CryptoPasta.CryptoPasta.Model.User;

public interface TwoFactorOtpService {

    TwoFactorOtp createTwoFactorOtp(User user, String otp, String jwt);

    TwoFactorOtp findByUser(long userId);

    TwoFactorOtp findById(String id);

    boolean verifyTwoFactorOtp(TwoFactorOtp twoFactorOtp, String otp);

    void deleteTwoFactorOtp(TwoFactorOtp twoFactorOtp);

}
