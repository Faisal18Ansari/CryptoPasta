package com.CryptoPasta.CryptoPasta.Controller;

import com.CryptoPasta.CryptoPasta.Domain.OrderType;
import com.CryptoPasta.CryptoPasta.Model.Coin;
import com.CryptoPasta.CryptoPasta.Model.Order;
import com.CryptoPasta.CryptoPasta.Model.User;
import com.CryptoPasta.CryptoPasta.Request.CreateOrderRequest;
import com.CryptoPasta.CryptoPasta.Services.CoinService;
import com.CryptoPasta.CryptoPasta.Services.OrderService;
import com.CryptoPasta.CryptoPasta.Services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    @Autowired
    private OrderService orderService;
    @Autowired
    private UserService userService;
    @Autowired
    private CoinService coinService;

    @PostMapping("/pay")
    public ResponseEntity<Order> payOrderAmount(
            @RequestHeader("Authorization") String jwt,
            @RequestBody CreateOrderRequest req
    ) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        Coin coin = coinService.findById(req.getCoinId());
        Order order = orderService.processOrder(coin, req.getQuantity(), req.getOrderType(), user);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<Order> getOrderById(
            @RequestHeader("Authorization") String jwtToken,
            @PathVariable long orderId
    ) throws Exception {
        User user = userService.findUserProfileByJwt(jwtToken);
        Order order = orderService.getOrderById(orderId);

        if (order.getUser().getId() == user.getId()) {
            return ResponseEntity.ok(order);
        } else {
            throw new Exception("You dont have access!");
        }
    }

    @GetMapping()
    public ResponseEntity<List<Order>> getAllOrdersOfUser(
            @RequestHeader("Authorization") String jwt,
            @RequestParam(required = false) OrderType orderType,
            @RequestParam(required = false) String assetSymbol
    )
            throws Exception {
        Long userId = userService.findUserProfileByJwt(jwt).getId();
        List<Order> userOrders = orderService.getAllOrdersOfUser(userId, orderType, assetSymbol);
        return ResponseEntity.ok(userOrders);
    }
}
