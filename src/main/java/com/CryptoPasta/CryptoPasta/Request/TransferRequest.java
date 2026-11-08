package com.CryptoPasta.CryptoPasta.Request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TransferRequest {

    @NotNull(message = "Transfer amount is required.")
    @Positive(message = "Transfer amount must be greater than zero.")
    private Long amount;

    @Size(max = 200, message = "Purpose must be 200 characters or fewer.")
    private String purpose;
}