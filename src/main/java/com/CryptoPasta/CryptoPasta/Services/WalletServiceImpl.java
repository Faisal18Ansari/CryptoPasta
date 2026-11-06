package com.CryptoPasta.CryptoPasta.Services;

import com.CryptoPasta.CryptoPasta.Domain.OrderType;
import com.CryptoPasta.CryptoPasta.Model.Order;
import com.CryptoPasta.CryptoPasta.Model.User;
import com.CryptoPasta.CryptoPasta.Model.Wallet;
import com.CryptoPasta.CryptoPasta.Repository.WalletRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.text.Bidi;
import java.util.Optional;

@Service
public class WalletServiceImpl implements WalletService {

    @Autowired
    private WalletRepository walletRepository;

    @Override
    public Wallet createWallet(User user) {
        Wallet existing = walletRepository.findByUserId(user.getId());
        if (existing != null) {
            return existing;
        }
        Wallet wallet = new Wallet();
        wallet.setUser(user);
        return walletRepository.save(wallet);
    }

    @Override
    public Wallet getUserWallet(User user) {
        Wallet wallet = walletRepository.findByUserId(user.getId());
        if (wallet != null) {
            return wallet;
        }
        try {
            return createWallet(user);
        } catch (DataIntegrityViolationException e) {
            // A parallel request inserted it first. Read the winner's row instead of failing.
            Wallet winner = walletRepository.findByUserId(user.getId());
            if (winner == null) {
                throw e;
            }
            return winner;
        }
    }

    @Override
    public Wallet addBalance(Wallet wallet, Long money) {
        BigDecimal balance = wallet.getBalance();
        BigDecimal newBalance = balance.add(BigDecimal.valueOf(money));
        wallet.setBalance(newBalance);
        return walletRepository.save(wallet);
    }

    @Override
    public Wallet findByWalletId(Long id) throws Exception {
        Optional<Wallet> wallet = walletRepository.findById(id);
        if (wallet.isPresent()) {
            return wallet.get();
        }
        throw new Exception("Wallet not found!");
    }

    @Override
    public Wallet walletToWalletTransfer(User sender, Wallet receiver, Long money) throws Exception {
        Wallet senderWallet = getUserWallet(sender);
        if (senderWallet.getBalance().compareTo(BigDecimal.valueOf(money)) < 0) {
            throw new Exception("Insufficient Balance!");
        }
        BigDecimal senderBalance = senderWallet.getBalance().subtract(BigDecimal.valueOf(money));
        senderWallet.setBalance(senderBalance);
        walletRepository.save(senderWallet);

        BigDecimal receiverBalance = receiver.getBalance().add(BigDecimal.valueOf(money));
        receiver.setBalance(receiverBalance);
        walletRepository.save(receiver);

        return senderWallet;
    }

    @Override
    public Wallet payOrderAmount(Order order, User user) throws Exception {
        Wallet wallet = getUserWallet(user);
        if (order.getOrderType().equals(OrderType.BUY)) {
            BigDecimal newBalance = wallet.getBalance().subtract(order.getPrice());
            if (newBalance.compareTo(order.getPrice()) < 0) {
                throw new Exception("Insufficient balance for this transaction!");
            }
            wallet.setBalance(newBalance);
        } else {
            BigDecimal newBalance = wallet.getBalance().add(order.getPrice());
            wallet.setBalance(newBalance);
        }
        walletRepository.save(wallet);
        return wallet;
    }
}
