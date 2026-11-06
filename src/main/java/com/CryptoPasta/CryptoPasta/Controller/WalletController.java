package com.CryptoPasta.CryptoPasta.Controller;

import com.CryptoPasta.CryptoPasta.Domain.WalletTransactionType;
import com.CryptoPasta.CryptoPasta.Model.*;
import com.CryptoPasta.CryptoPasta.Response.PaymentResponse;
import com.CryptoPasta.CryptoPasta.Services.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

@RestController
//@RequestMapping("/api/wallet")
public class WalletController {

    @Autowired
    private WalletService walletService;
    @Autowired
    private UserService userService;
    @Autowired
    private OrderService orderService;
    @Autowired
    private PaymentService paymentService;
    @Autowired
    private TransactionService transactionService;

    @GetMapping("/api/wallet")
    public ResponseEntity<Wallet> getUserWallet(@RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        Wallet wallet = walletService.getUserWallet(user);

        return new ResponseEntity<>(wallet, HttpStatus.ACCEPTED);
    }

    @PutMapping("/api/wallet/{walletId}/transfer")
    public ResponseEntity<Wallet> walletToWalletTransfer(@RequestHeader("authorization") String jwt, @PathVariable Long walletId, @RequestBody WalletTransaction req) throws Exception {
        User senderUser = userService.findUserProfileByJwt(jwt);
        Wallet receiverWallet = walletService.findByWalletId(walletId);
        Wallet wallet = walletService.walletToWalletTransfer(senderUser, receiverWallet, req.getAmount());
        transactionService.createTransaction(
                wallet,
                WalletTransactionType.WALLET_TRANSFER,
                String.valueOf(receiverWallet.getId()),
                "Transfer sent to wallet #" + receiverWallet.getId(),
                -req.getAmount()
        );
        transactionService.createTransaction(
                receiverWallet,
                WalletTransactionType.WALLET_TRANSFER,
                String.valueOf(wallet.getId()),
                "Transfer received from wallet #" + wallet.getId(),
                req.getAmount()
        );
        return new ResponseEntity<>(wallet, HttpStatus.ACCEPTED);
    }

    @PutMapping("/api/wallet/order/{orderID}/pay")
    public ResponseEntity<Wallet> payOrderPayment(@RequestHeader("authorization") String jwt, @PathVariable Long orderId) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        Order order = orderService.getOrderById(orderId);
        Wallet wallet = walletService.payOrderAmount(order, user);
        return new ResponseEntity<>(wallet, HttpStatus.ACCEPTED);
    }

    @Transactional
    @PutMapping("/api/wallet/deposit")
    public ResponseEntity<Wallet> addBalanceToWallet(
            @RequestHeader("authorization") String jwt,
            @RequestParam(name = "order_id") Long orderId,
            @RequestParam(name = "payment_id") String paymentId) throws Exception {

        User user = userService.findUserProfileByJwt(jwt);
        PaymentOrder paymentOrder = paymentService.getPaymentOrderByIdForUpdate(orderId);

        if (paymentOrder.getUser().getId() != user.getId()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Payment order does not belong to this user"
            );
        }

        Wallet wallet = walletService.getUserWallet(user);
        if (wallet.getBalance() == null) {
            wallet.setBalance(BigDecimal.ZERO);
        }

        if (paymentService.proceedPaymentOrder(paymentOrder, paymentId)) {
            wallet = walletService.addBalance(wallet, paymentOrder.getAmount());
            transactionService.createTransaction(
                    wallet,
                    WalletTransactionType.ADD_MONEY,
                    paymentId,
                    "Deposit via " + paymentOrder.getPaymentMethod(),
                    paymentOrder.getAmount()
            );
        }

        return new ResponseEntity<>(wallet, HttpStatus.ACCEPTED);
    }
}
