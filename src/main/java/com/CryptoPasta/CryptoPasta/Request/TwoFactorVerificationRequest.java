package com.CryptoPasta.CryptoPasta.Request;

import com.CryptoPasta.CryptoPasta.Domain.TwoFactorOperation;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class TwoFactorVerificationRequest {

    @NotBlank(message = "Verification session is required.")
    private String sessionId;

    @NotBlank(message = "OTP is required.")
    @Pattern(regexp = "\\d{6}", message = "OTP must contain exactly six digits.")
    private String otp;

    @NotNull(message = "Two-factor operation is required.")
    private TwoFactorOperation operation;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;
}
