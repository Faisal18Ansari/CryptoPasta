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
            @RequestHeader("Authorization") String jwt) throws
            Exception,
            RazorpayException,
            StripeException {

        User user = userService.findUserProfileByJwt(jwt);

        PaymentResponse paymentResponse;

        PaymentOrder order = paymentService.createOrder(user, amount, paymentMethod);

        if (paymentMethod.equals(PaymentMethod.RAZORPAY)) {
            paymentResponse = paymentService.createRazorpayPaymentLink(user, amount, order.getId());
        } else {
            paymentResponse = paymentService.createStripePaymentLink(user, amount, order.getId());
        }
        return new ResponseEntity<>(paymentResponse, HttpStatus.CREATED);
    }


}
