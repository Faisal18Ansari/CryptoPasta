package com.CryptoPasta.CryptoPasta.Services;

import com.CryptoPasta.CryptoPasta.Domain.OrderStatus;
import com.CryptoPasta.CryptoPasta.Domain.OrderType;
import com.CryptoPasta.CryptoPasta.Domain.WalletTransactionType;
import com.CryptoPasta.CryptoPasta.Model.*;
import com.CryptoPasta.CryptoPasta.Repository.OrderItemRepository;
import com.CryptoPasta.CryptoPasta.Repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrderServiceImpl implements OrderService {
    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private WalletService walletService;
    @Autowired
    private OrderItemRepository orderItemRepository;
    @Autowired
    private AssetService assetService;
    @Autowired
    private TransactionService transactionService;

    private static final BigDecimal MAX_PRICE_DEVIATION_RATIO = new BigDecimal("0.02");
    private static final BigDecimal MAX_ORDER_TOTAL = new BigDecimal("99999999999999999.99");

    @Override
    public Order createOrder(User user, OrderItem orderItem, OrderType orderType, BigDecimal executionPrice) {
        BigDecimal totalPrice = calculateOrderTotal(executionPrice, orderItem.getQuantity());

        Order order = new Order();
        order.setUser(user);
        order.setOrderItem(orderItem);
        order.setOrderType(orderType);
        order.setPrice(totalPrice);
        order.setTimeStamp(LocalDateTime.now());
        order.setOrderStatus(OrderStatus.PENDING);

        return orderRepository.save(order);
    }

    @Override
    public Order getOrderById(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Order not found."));
    }

    @Override
    public List<Order> getAllOrdersOfUser(Long userId, OrderType orderType, String assetSymbol) {
        return orderRepository.findByUserId(userId);
    }

    private OrderItem createOrderItem(
            Coin coin,
            BigDecimal quantity,
            BigDecimal buyPrice,
            BigDecimal sellPrice) {
        OrderItem orderItem = new OrderItem();
        orderItem.setCoin(coin);
        orderItem.setQuantity(quantity);
        orderItem.setBuyPrice(buyPrice);
        orderItem.setSellPrice(sellPrice);
        return orderItemRepository.save(orderItem);
    }

    @Transactional(rollbackFor = Exception.class)
    public Order buyAsset(Coin coin, BigDecimal quantity, User user, BigDecimal executionPrice) throws Exception {
        if (quantity == null || quantity.signum() <= 0) {
            throw new Exception("Quantity should be minimum 1!");
        }

        BigDecimal buyPrice = executionPrice;
        OrderItem orderItem = createOrderItem(coin, quantity, buyPrice, BigDecimal.ZERO);
        Order order = createOrder(user, orderItem, OrderType.BUY, executionPrice);
        orderItem.setOrder(order);
        walletService.payOrderAmount(order, user);
        order.setOrderStatus(OrderStatus.SUCCESS);
        order.setOrderType(OrderType.BUY);
        Order saveOrder = orderRepository.save(order);
        // LOG THE TRANSACTION
        Wallet wallet = walletService.getUserWallet(user);
        transactionService.createTransaction(
                wallet,
                WalletTransactionType.BUY_ASSET,
                null,
                "Bought " + quantity + " " + coin.getSymbol().toUpperCase(),
                order.getPrice());

        // CREATE ASSET
        Asset oldAsset = assetService.findAssetByUserIdAndCoinIdForUpdate(
                order.getUser().getId(),
                order.getOrderItem().getCoin().getId());
        if (oldAsset == null) {
            assetService.createAsset(user, orderItem.getCoin(), orderItem.getQuantity(), executionPrice);
        } else {
            assetService.addToAsset(oldAsset.getId(), quantity, executionPrice);
        }
        return saveOrder;
    }

    @Transactional(rollbackFor = Exception.class)
    public Order sellAsset(Coin coin, BigDecimal quantity, User user, BigDecimal executionPrice) throws Exception {
        if (quantity == null || quantity.signum() <= 0) {
            throw new Exception("Quantity should be minimum 1!");
        }
        Asset assetToSell = assetService.findAssetByUserIdAndCoinIdForUpdate(
                user.getId(),
                coin.getId());
        if (assetToSell == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Asset not found.");
        }

        BigDecimal buyPrice = assetToSell.getBuyPrice();
        BigDecimal sellPrice = executionPrice;

        if (assetToSell.getQuantity().compareTo(quantity) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient quantity to sell.");
        }

        OrderItem orderItem = createOrderItem(coin, quantity, buyPrice, sellPrice);
        Order order = createOrder(user, orderItem, OrderType.SELL, executionPrice);
        orderItem.setOrder(order);
        order.setOrderStatus(OrderStatus.SUCCESS);
        order.setOrderType(OrderType.SELL);
        Order saveOrder = orderRepository.save(order);
        walletService.payOrderAmount(order, user);
        Wallet wallet = walletService.getUserWallet(user);
        transactionService.createTransaction(
                wallet,
                WalletTransactionType.SELL_ASSET,
                null,
                "Sold " + quantity + " " + coin.getSymbol().toUpperCase(),
                order.getPrice());
        Asset updatedAsset = assetService.subtractFromAsset(assetToSell.getId(), quantity);
        if (updatedAsset.getQuantity().signum() == 0) {
            assetService.deleteAsset(updatedAsset.getId());
        }
        return saveOrder;
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public Order processOrder(
            Coin coin,
            BigDecimal quantity,
            OrderType orderType,
            User user,
            BigDecimal clientPrice,
            BigDecimal executionPrice) throws Exception {
        if (quantity == null || quantity.signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be greater than zero.");
        }
        if (clientPrice == null || clientPrice.signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Displayed price is invalid.");
        }
        if (executionPrice == null || executionPrice.signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Fresh market price is invalid.");
        }
        if (orderType == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order type is required.");
        }
        calculateOrderTotal(executionPrice, quantity);

        BigDecimal deviation = executionPrice.subtract(clientPrice).abs();
        BigDecimal allowedDeviation = clientPrice.multiply(MAX_PRICE_DEVIATION_RATIO);
        if (deviation.compareTo(allowedDeviation) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Market price changed by more than 2%. Refresh the quote and try again.");
        }

        walletService.getUserWalletForUpdate(user);
        if (orderType == OrderType.BUY) {
            return buyAsset(coin, quantity, user, executionPrice);
        }
        if (orderType == OrderType.SELL) {
            return sellAsset(coin, quantity, user, executionPrice);
        }

        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid order type.");
    }

    private BigDecimal calculateOrderTotal(BigDecimal executionPrice, BigDecimal quantity) {
        BigDecimal total = executionPrice.multiply(quantity).setScale(2, RoundingMode.HALF_UP);
        if (total.compareTo(MAX_ORDER_TOTAL) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Order total exceeds the supported INR amount."
            );
        }
        return total;
    }
}