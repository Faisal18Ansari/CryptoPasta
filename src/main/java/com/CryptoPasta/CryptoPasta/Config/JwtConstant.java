package com.CryptoPasta.CryptoPasta.Config;

import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.util.Base64;

public class JwtConstant {

    public static final String JWT_HEADER = "Authorization";

    private static final SecretKey SECRET_KEY = loadSecretKey();

    private JwtConstant() {
    }

    public static SecretKey getSecretKey() {
        return SECRET_KEY;
    }

    private static SecretKey loadSecretKey() {
        String encodedSecret = System.getenv("JWT_SECRET");

        if (encodedSecret == null || encodedSecret.isBlank()) {
            throw new IllegalStateException(
                    "Required environment variable JWT_SECRET is not set."
            );
        }

        final byte[] keyBytes;
        try {
            keyBytes = Base64.getDecoder().decode(encodedSecret.trim());
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException(
                    "JWT_SECRET must be a Base64-encoded key.",
                    exception
            );
        }

        if (keyBytes.length < 32) {
            throw new IllegalStateException(
                    "JWT_SECRET must decode to at least 32 bytes."
            );
        }

        return Keys.hmacShaKeyFor(keyBytes);
    }
}
