package com.CryptoPasta.CryptoPasta.Request;

import com.CryptoPasta.CryptoPasta.Domain.OrderType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateOrderRequest {

    @NotBlank(message = "Coin ID is required.")
    @Size(max = 100, message = "Coin ID must be 100 characters or fewer.")
    private String coinId;

    @NotNull(message = "Quantity is required.")
    @Positive(message = "Quantity must be greater than zero.")
    private Double quantity;

    @NotNull(message = "Order type is required.")
    private OrderType orderType;

    @NotNull(message = "Displayed price is required.")
    @Positive(message = "Displayed price must be greater than zero.")
    private Double clientPrice;
}