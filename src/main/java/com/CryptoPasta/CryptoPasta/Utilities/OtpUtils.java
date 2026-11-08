package com.CryptoPasta.CryptoPasta.Utilities;

import java.security.SecureRandom;
import java.util.Locale;

public class OtpUtils {

    private static final SecureRandom RANDOM = new SecureRandom();

    public static String generateOtp() {
        return String.format(Locale.ROOT, "%06d", RANDOM.nextInt(1_000_000));
    }
}
