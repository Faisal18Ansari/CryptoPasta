package com.CryptoPasta.CryptoPasta.Services;

import com.CryptoPasta.CryptoPasta.Model.Order;
import com.CryptoPasta.CryptoPasta.Model.User;
import com.CryptoPasta.CryptoPasta.Model.Wallet;

public interface WalletService {

    Wallet createWallet(User user);

    Wallet getUserWallet(User user);

    Wallet addBalance(Wallet wallet, Long money);

    Wallet findByWalletId(Long id) throws Exception;

    Wallet walletToWalletTransfer(User sender, Long receiverWalletId, Long money) throws Exception;

    Wallet payOrderAmount(Order order, User user) throws Exception;

}
