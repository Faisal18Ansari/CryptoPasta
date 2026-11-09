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
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import java.math.BigDecimal;

@RestController
@Validated
//@RequestMapping("/api")
public class PaymentController {
    @Autowired
    private PaymentService paymentService;
    @Autowired
    private UserService userService;

    @PostMapping("/api/payment/{paymentMethod}/amount/{amount}")
    public ResponseEntity<PaymentResponse> paymentHandler(
            @PathVariable PaymentMethod paymentMethod,
            @PathVariable
            @DecimalMin(value = "0.01", message = "Top-up amount must be at least one paisa.")
            @Digits(integer = 17, fraction = 2, message = "Top-up amount supports up to two decimal places.")
            BigDecimal amount,
            @RequestHeader("Authorization") String jwt) throws Exception, RazorpayException {

        if (paymentMethod != PaymentMethod.RAZORPAY) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Stripe top-ups are temporarily disabled."
            );
        }

        try {
            amount.movePointRight(2).longValueExact();
        } catch (ArithmeticException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Top-up amount is too large or cannot be represented in paise."
            );
        }

        User user = userService.findUserProfileByJwt(jwt);

        PaymentOrder order = paymentService.createOrder(user, amount, paymentMethod);
        PaymentResponse paymentResponse =
                paymentService.createRazorpayPaymentLink(order);
        return new ResponseEntity<>(paymentResponse, HttpStatus.CREATED);
    }


}
