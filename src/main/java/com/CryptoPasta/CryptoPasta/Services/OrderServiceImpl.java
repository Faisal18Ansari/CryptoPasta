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

    private static final double MAX_PRICE_DEVIATION_RATIO = 0.02;

    @Override
    public Order createOrder(User user, OrderItem orderItem, OrderType orderType, double executionPrice) {
        double totalPrice = executionPrice * orderItem.getQuantity();

        Order order = new Order();
        order.setUser(user);
        order.setOrderItem(orderItem);
        order.setOrderType(orderType);
        order.setPrice(BigDecimal.valueOf(totalPrice));
        order.setTimeStamp(LocalDateTime.now());
        order.setOrderStatus(OrderStatus.PENDING);

        return orderRepository.save(order);
    }

    @Override
    public Order getOrderById(Long orderId) throws Exception {
        return orderRepository.findById(orderId).orElseThrow(() -> new Exception("Order not Found!"));
    }

    @Override
    public List<Order> getAllOrdersOfUser(Long userId, OrderType orderType, String assetSymbol) {
        return orderRepository.findByUserId(userId);
    }

    private OrderItem createOrderItem(Coin coin, double quantity, double buyPrice, double sellPrice) {
        OrderItem orderItem = new OrderItem();
        orderItem.setCoin(coin);
        orderItem.setQuantity(quantity);
        orderItem.setBuyPrice(buyPrice);
        orderItem.setSellPrice(sellPrice);
        return orderItemRepository.save(orderItem);
    }

    @Transactional(rollbackFor = Exception.class)
    public Order buyAsset(Coin coin, double quantity, User user, double executionPrice) throws Exception {
        if (!Double.isFinite(quantity) || quantity <= 0) {
            throw new Exception("Quantity should be minimum 1!");
        }

        double buyPrice = executionPrice;
        OrderItem orderItem = createOrderItem(coin, quantity, buyPrice, 0);
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
                order.getPrice().longValue()
        );

        // CREATE ASSET
        Asset oldAsset = assetService.findAssetByUserIdAndCoinIdForUpdate(
                order.getUser().getId(),
                order.getOrderItem().getCoin().getId()
        );
        if (oldAsset == null) {
            Asset newAsset = assetService.createAsset(user, orderItem.getCoin(), orderItem.getQuantity());
            newAsset.setBuyPrice(executionPrice);
        } else {
            assetService.updateAsset(oldAsset.getId(), quantity);
        }
        return saveOrder;
    }

    @Transactional(rollbackFor = Exception.class)
    public Order sellAsset(Coin coin, double quantity, User user, double executionPrice) throws Exception {
        if (quantity <= 0) {
            throw new Exception("Quantity should be minimum 1!");
        }
        Asset assetToSell = assetService.findAssetByUserIdAndCoinIdForUpdate(
                user.getId(),
                coin.getId()
        );
        if (assetToSell == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Asset not found.");
        }

        double buyPrice = assetToSell.getBuyPrice();
        double sellPrice = executionPrice;

        if (assetToSell.getQuantity() < quantity) {
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
                order.getPrice().longValue()
        );
        Asset updatedAsset = assetService.updateAsset(assetToSell.getId(), -quantity);
        if (updatedAsset.getQuantity() * executionPrice <= 1) {
            assetService.deleteAsset(updatedAsset.getId());
        }
        return saveOrder;
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public Order processOrder(
            Coin coin,
            double quantity,
            OrderType orderType,
            User user,
            double clientPrice,
            double executionPrice) throws Exception {
        if (!Double.isFinite(quantity) || quantity <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be greater than zero.");
        }
        if (!Double.isFinite(clientPrice) || clientPrice <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Displayed price is invalid.");
        }
        if (!Double.isFinite(executionPrice) || executionPrice <= 0
                || !Double.isFinite(executionPrice * quantity)) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Fresh market price is invalid.");
        }
        if (orderType == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order type is required.");
        }

        double deviation = Math.abs(executionPrice - clientPrice) / clientPrice;
        if (deviation > MAX_PRICE_DEVIATION_RATIO) {
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
}