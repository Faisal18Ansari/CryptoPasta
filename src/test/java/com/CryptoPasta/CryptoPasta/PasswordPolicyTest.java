package com.CryptoPasta.CryptoPasta;

import com.CryptoPasta.CryptoPasta.Config.AppConfig;
import com.CryptoPasta.CryptoPasta.Utilities.PasswordPolicy;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PasswordPolicyTest {

    @Test
    void configuredEncoderHashesAndVerifiesPasswords() {
        PasswordEncoder passwordEncoder = new AppConfig().passwordEncoder();
        String rawPassword = "Demo-Password-123!";
        String encodedPassword = passwordEncoder.encode(rawPassword);

        assertNotEquals(rawPassword, encodedPassword);
        assertTrue(encodedPassword.startsWith("$2a$12$"));
        assertTrue(passwordEncoder.matches(rawPassword, encodedPassword));
        assertFalse(passwordEncoder.matches("Wrong-Password-123!", encodedPassword));
    }

    @Test
    void acceptsPasswordsWithinBcryptByteLimit() {
        assertTrue(PasswordPolicy.isBcryptCompatible("A".repeat(72)));
        assertTrue(PasswordPolicy.isBcryptCompatible("é".repeat(36)));
    }

    @Test
    void rejectsPasswordsOverBcryptByteLimit() {
        assertFalse(PasswordPolicy.isBcryptCompatible("A".repeat(73)));
        assertFalse(PasswordPolicy.isBcryptCompatible("é".repeat(37)));
    }

    @Test
    void rejectsMissingPasswordWhenEncoding() {
        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> PasswordPolicy.validateBcryptPassword("")
        );

        assertEquals(400, exception.getStatusCode().value());
    }

    @Test
    void rejectsPasswordOverBcryptByteLimitWhenEncoding() {
        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> PasswordPolicy.validateBcryptPassword("A".repeat(73))
        );

        assertEquals(400, exception.getStatusCode().value());
    }
}
