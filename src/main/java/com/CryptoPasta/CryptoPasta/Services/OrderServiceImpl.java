package com.CryptoPasta.CryptoPasta.Services;

import com.CryptoPasta.CryptoPasta.Domain.OrderStatus;
import com.CryptoPasta.CryptoPasta.Domain.OrderType;
import com.CryptoPasta.CryptoPasta.Domain.WalletTransactionType;
import com.CryptoPasta.CryptoPasta.Model.*;
import com.CryptoPasta.CryptoPasta.Repository.OrderItemRepository;
import com.CryptoPasta.CryptoPasta.Repository.OrderRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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

    @Override
    public Order createOrder(User user, OrderItem orderItem, OrderType orderType) {
        double price = orderItem.getCoin().getCurrentPrice() * orderItem.getQuantity();

        Order order = new Order();
        order.setUser(user);
        order.setOrderItem(orderItem);
        order.setOrderType(orderType);
        order.setPrice(BigDecimal.valueOf(price));
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
    public Order buyAsset(Coin coin, double quantity, User user) throws Exception {
        if (quantity <= 0) {
            throw new Exception("Quantity should be minimum 1!");
        }
        double buyPrice = coin.getCurrentPrice();
        OrderItem orderItem = createOrderItem(coin, quantity, buyPrice, 0);
        Order order = createOrder(user, orderItem, OrderType.BUY);
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
//        CREATE ASSET
        Asset oldAsset = assetService.findAssetByUserIdAndCoinIdForUpdate(
                order.getUser().getId(),
                order.getOrderItem().getCoin().getId()
        );
        if (oldAsset == null) {
            assetService.createAsset(user, orderItem.getCoin(), orderItem.getQuantity());
        } else {
            assetService.updateAsset(oldAsset.getId(), quantity);
        }
        return saveOrder;
    }

    @Transactional(rollbackFor = Exception.class)
    public Order sellAsset(Coin coin, double quantity, User user) throws Exception {
        if (quantity <= 0) {
            throw new Exception("Quantity should be minimum 1!");
        }
        double sellPrice = coin.getCurrentPrice();
        Asset assetToSell = assetService.findAssetByUserIdAndCoinIdForUpdate(
                user.getId(),
                coin.getId()
        );
        double buyPrice = assetToSell.getBuyPrice();
        if (assetToSell != null) {
            OrderItem orderItem = createOrderItem(coin, quantity, buyPrice, sellPrice);
            Order order = createOrder(user, orderItem, OrderType.SELL);
            orderItem.setOrder(order);

            if (assetToSell.getQuantity() >= quantity) {
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
                if (updatedAsset.getQuantity() * coin.getCurrentPrice() <= 1) {
                    assetService.deleteAsset(updatedAsset.getId());
                }
                return saveOrder;
            }
            throw new Exception("Insufficient quantity to sell!");
        }
        throw new Exception("Asset not found!");
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public Order processOrder(Coin coin, double quantity, OrderType orderType, User user) throws Exception {
        walletService.getUserWalletForUpdate(user);
        if (orderType.equals(OrderType.BUY)) {
            return buyAsset(coin, quantity, user);
        } else if (orderType.equals(OrderType.SELL)) {
            return sellAsset(coin, quantity, user);
        }
        throw new Exception("Invalid Order Type!");
    }
}
