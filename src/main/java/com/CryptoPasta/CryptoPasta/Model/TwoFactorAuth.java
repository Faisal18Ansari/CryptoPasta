package com.CryptoPasta.CryptoPasta.Model;

import com.CryptoPasta.CryptoPasta.Domain.VerificationType;
import lombok.Data;

@Data
public class TwoFactorAuth {
    public boolean isEnabled = false;
    public VerificationType sendTo;
}
