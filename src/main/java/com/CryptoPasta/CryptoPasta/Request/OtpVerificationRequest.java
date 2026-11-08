package com.CryptoPasta.CryptoPasta.Request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class OtpVerificationRequest {

    @NotBlank(message = "Verification session is required.")
    private String sessionId;

    @NotBlank(message = "OTP is required.")
    @Pattern(regexp = "\\d{6}", message = "OTP must contain exactly six digits.")
    private String otp;
}
