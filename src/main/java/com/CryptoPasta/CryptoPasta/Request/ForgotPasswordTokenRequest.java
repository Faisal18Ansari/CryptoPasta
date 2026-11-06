package com.CryptoPasta.CryptoPasta.Request;

import com.CryptoPasta.CryptoPasta.Domain.VerificationType;
import lombok.Data;

@Data
public class ForgotPasswordTokenRequest {
    private String sendTo;
    private VerificationType verificationType;
}
