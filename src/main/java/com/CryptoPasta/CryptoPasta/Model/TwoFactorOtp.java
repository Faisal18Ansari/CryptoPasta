package com.CryptoPasta.CryptoPasta.Model;


import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToOne;
import java.time.Instant;
import lombok.Data;

@Data
@Entity
public class TwoFactorOtp {

    @Id
    private String id;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(name = "otp")
    private String otpHash;

    private Instant createdAt;
    private Instant expiresAt;
    private int failedAttempts;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @OneToOne
    private User user;

}
