package com.CryptoPasta.CryptoPasta.Controller;

import com.CryptoPasta.CryptoPasta.Request.TransferRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.validation.annotation.Validated;
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
@Validated
// @RequestMapping("/api/wallet")
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
    public ResponseEntity<Wallet> walletToWalletTransfer(
            @RequestHeader("Authorization") String jwt,
            @PathVariable @Positive(message = "Receiver wallet ID must be greater than zero.") Long walletId,
            @Valid @RequestBody TransferRequest req) throws Exception {
        User senderUser = userService.findUserProfileByJwt(jwt);
        Wallet wallet = walletService.walletToWalletTransfer(
                senderUser,
                walletId,
                req.getAmount());

        return new ResponseEntity<>(wallet, HttpStatus.ACCEPTED);
    }

    @PutMapping("/api/wallet/order/{orderID}/pay")
    public ResponseEntity<Wallet> payOrderPayment(@RequestHeader("authorization") String jwt,
            @PathVariable Long orderId) throws Exception {
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
            @RequestParam(name = "razorpay_payment_id") String paymentId,
            @RequestParam(name = "razorpay_payment_link_id") String paymentLinkId,
            @RequestParam(name = "razorpay_payment_link_reference_id") String paymentLinkReferenceId,
            @RequestParam(name = "razorpay_payment_link_status") String paymentLinkStatus,
            @RequestParam(name = "razorpay_signature") String signature) throws Exception {

        User user = userService.findUserProfileByJwt(jwt);
        PaymentOrder paymentOrder = paymentService.getPaymentOrderByIdForUpdate(orderId);

        if (paymentOrder.getUser().getId() != user.getId()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Payment order does not belong to this user");
        }

        paymentService.proceedPaymentOrder(
                paymentOrder,
                paymentId,
                paymentLinkId,
                paymentLinkReferenceId,
                paymentLinkStatus,
                signature);

        Wallet wallet = walletService.getUserWalletForUpdate(user);
        if (wallet.getBalance() == null) {
            wallet.setBalance(BigDecimal.ZERO);
        }

        wallet = walletService.addBalance(wallet, paymentOrder.getAmount());
        transactionService.createTransaction(
                wallet,
                WalletTransactionType.ADD_MONEY,
                paymentId,
                "Deposit via " + paymentOrder.getPaymentMethod(),
                paymentOrder.getAmount());

        return new ResponseEntity<>(wallet, HttpStatus.ACCEPTED);
    }
}
