package com.CryptoPasta.CryptoPasta.Controller;

import com.CryptoPasta.CryptoPasta.Model.PaymentDetails;
import com.CryptoPasta.CryptoPasta.Model.User;
import com.CryptoPasta.CryptoPasta.Services.PaymentDetailsService;
import com.CryptoPasta.CryptoPasta.Services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class PaymentDetailsController {
    @Autowired
    private UserService userService;
    @Autowired
    private PaymentDetailsService paymentDetailsService;

    @PostMapping("/payment-details")
    public ResponseEntity<PaymentDetails> addPaymentDetails(@RequestBody PaymentDetails paymentDetailsRequest, @RequestHeader("Authorization") String jwt) throws Exception {

        User user = userService.findUserProfileByJwt(jwt);

        PaymentDetails paymentDetails = paymentDetailsService.addPaymentDetails(paymentDetailsRequest.getAccountNumber(), paymentDetailsRequest.getAccountHolderName(), paymentDetailsRequest.getIfscCode(), paymentDetailsRequest.getBankName(), user);

        return new ResponseEntity<>(paymentDetails, HttpStatus.CREATED);
    }

    @GetMapping("/payment-details")
    public ResponseEntity<PaymentDetails> getUsersPaymentDetails(@RequestHeader("Authorization") String jwt) throws Exception {

        User user = userService.findUserProfileByJwt(jwt);

        PaymentDetails paymentDetails = paymentDetailsService.getUserPaymentDetails(user);

        return new ResponseEntity<>(paymentDetails, HttpStatus.CREATED);
    }
}
