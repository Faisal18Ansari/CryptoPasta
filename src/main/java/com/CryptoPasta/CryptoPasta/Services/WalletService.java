package com.CryptoPasta.CryptoPasta.Services;

import com.CryptoPasta.CryptoPasta.Model.Order;
import com.CryptoPasta.CryptoPasta.Model.User;
import com.CryptoPasta.CryptoPasta.Model.Wallet;

import java.math.BigDecimal;

public interface WalletService {

    Wallet createWallet(User user);

    Wallet getUserWallet(User user);

    Wallet addBalance(Wallet wallet, BigDecimal money);

    Wallet findByWalletId(Long id) throws Exception;

    Wallet walletToWalletTransfer(User sender, Long receiverWalletId, BigDecimal money) throws Exception;

    Wallet payOrderAmount(Order order, User user) throws Exception;

    Wallet getUserWalletForUpdate(User user);

}
