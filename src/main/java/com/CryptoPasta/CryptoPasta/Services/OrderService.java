package com.CryptoPasta.CryptoPasta.Services;

import com.CryptoPasta.CryptoPasta.Domain.OrderType;
import com.CryptoPasta.CryptoPasta.Model.Coin;
import com.CryptoPasta.CryptoPasta.Model.Order;
import com.CryptoPasta.CryptoPasta.Model.OrderItem;
import com.CryptoPasta.CryptoPasta.Model.User;

import java.util.List;

public interface OrderService {

    Order createOrder(User user, OrderItem orderItem, OrderType orderType, double executionPrice);

    Order getOrderById(Long orderId);

    List<Order> getAllOrdersOfUser(Long userId, OrderType orderType, String assetSymbol);

    Order processOrder(
            Coin coin,
            double quantity,
            OrderType orderType,
            User user,
            double clientPrice,
            double executionPrice) throws Exception;
}
