package com.CryptoPasta.CryptoPasta.Controller;

import com.CryptoPasta.CryptoPasta.Model.User;
import com.CryptoPasta.CryptoPasta.Model.Wallet;
import com.CryptoPasta.CryptoPasta.Model.WalletTransaction;
import com.CryptoPasta.CryptoPasta.Services.TransactionService;
import com.CryptoPasta.CryptoPasta.Services.UserService;
import com.CryptoPasta.CryptoPasta.Services.WalletService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class TransactionController {
    @Autowired
    private WalletService walletService;
    @Autowired
    private UserService userService;
    @Autowired
    private TransactionService transactionService;

    @GetMapping("/api/transactions")
    public ResponseEntity<List<WalletTransaction>> getUserWallet(@RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        Wallet wallet = walletService.getUserWallet(user);
        List<WalletTransaction> transactionList = transactionService.getTransactionByWallet(wallet);

        return new ResponseEntity<>(transactionList, HttpStatus.ACCEPTED);
    }
}
