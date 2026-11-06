package com.CryptoPasta.CryptoPasta.Request;

import com.CryptoPasta.CryptoPasta.Domain.OrderType;
import com.CryptoPasta.CryptoPasta.Model.Order;
import lombok.Data;

@Data
public class CreateOrderRequest {
    private String coinId;
    private double quantity;
    private OrderType orderType;
}
