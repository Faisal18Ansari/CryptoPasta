package com.CryptoPasta.CryptoPasta.Model;

import com.CryptoPasta.CryptoPasta.Domain.VerificationType;
import com.CryptoPasta.CryptoPasta.Domain.TwoFactorOperation;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Entity
@Data
public class VerificationCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(name = "otp")
    private String otpHash;

    private Instant createdAt;
    private Instant expiresAt;

    private int failedAttempts;

    @OneToOne
    private User user;

    private String email;

    private String mobile;

    private VerificationType verificationType;

    @Enumerated(EnumType.STRING)
    private TwoFactorOperation operation;
}
