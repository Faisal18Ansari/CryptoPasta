package com.CryptoPasta.CryptoPasta.Utilities;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;

public final class PasswordPolicy {

    private static final int MAX_BCRYPT_PASSWORD_BYTES = 72;

    private PasswordPolicy() {
    }

    public static boolean isBcryptCompatible(String password) {
        return password != null
                && !password.isEmpty()
                && password.getBytes(StandardCharsets.UTF_8).length <= MAX_BCRYPT_PASSWORD_BYTES;
    }

    public static void validateBcryptPassword(String password) {
        if (password == null || password.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required.");
        }
        if (password.getBytes(StandardCharsets.UTF_8).length > MAX_BCRYPT_PASSWORD_BYTES) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Password must not exceed 72 UTF-8 bytes."
            );
        }
    }
}
