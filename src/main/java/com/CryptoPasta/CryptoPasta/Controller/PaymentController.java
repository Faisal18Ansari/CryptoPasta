package com.CryptoPasta.CryptoPasta.Controller;

import com.CryptoPasta.CryptoPasta.Domain.PaymentMethod;
import com.CryptoPasta.CryptoPasta.Model.PaymentOrder;
import com.CryptoPasta.CryptoPasta.Model.User;
import com.CryptoPasta.CryptoPasta.Response.PaymentResponse;
import com.CryptoPasta.CryptoPasta.Services.PaymentService;
import com.CryptoPasta.CryptoPasta.Services.UserService;
import com.razorpay.RazorpayException;
import com.stripe.exception.StripeException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
//@RequestMapping("/api")
public class PaymentController {
    @Autowired
    private PaymentService paymentService;
    @Autowired
    private UserService userService;

    @PostMapping("/api/payment/{paymentMethod}/amount/{amount}")
    public ResponseEntity<PaymentResponse> paymentHandler(
            @PathVariable PaymentMethod paymentMethod,
            @PathVariable Long amount,
            @RequestHeader("Authorization") String jwt) throws Exception, RazorpayException {

        if (paymentMethod != PaymentMethod.RAZORPAY) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Stripe top-ups are temporarily disabled."
            );
        }

        if (amount == null || amount <= 0 || amount > Long.MAX_VALUE / 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Top-up amount must be a positive whole number of rupees."
            );
        }

        User user = userService.findUserProfileByJwt(jwt);

        PaymentOrder order = paymentService.createOrder(user, amount, paymentMethod);
        PaymentResponse paymentResponse =
                paymentService.createRazorpayPaymentLink(order);
        return new ResponseEntity<>(paymentResponse, HttpStatus.CREATED);
    }


}
