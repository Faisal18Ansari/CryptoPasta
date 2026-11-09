package com.CryptoPasta.CryptoPasta.Request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import jakarta.validation.constraints.Digits;
import java.math.BigDecimal;

@Data
public class TransferRequest {

    @NotNull(message = "Transfer amount is required.")
    @Positive(message = "Transfer amount must be greater than zero.")
    @Digits(integer = 17, fraction = 2, message = "Transfer amount supports up to two decimal places.")
    private BigDecimal amount;

    @Size(max = 200, message = "Purpose must be 200 characters or fewer.")
    private String purpose;
}