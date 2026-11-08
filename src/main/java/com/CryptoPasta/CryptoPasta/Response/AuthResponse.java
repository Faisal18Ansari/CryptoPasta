package com.CryptoPasta.CryptoPasta.Response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class AuthResponse {
    private String jwt;
    private boolean status;
    private String message;
    @JsonProperty("twoFactorAuthEnable")
    private boolean twoFactorAuthEnable;
    private String session;
}
