package com.CryptoPasta.CryptoPasta.Services;

import com.CryptoPasta.CryptoPasta.Domain.OrderType;
import com.CryptoPasta.CryptoPasta.Model.Order;
import com.CryptoPasta.CryptoPasta.Model.User;
import com.CryptoPasta.CryptoPasta.Model.Wallet;
import com.CryptoPasta.CryptoPasta.Repository.WalletRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.dao.DataIntegrityViolationException;
import com.CryptoPasta.CryptoPasta.Domain.WalletTransactionType;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Optional;

@Service
public class WalletServiceImpl implements WalletService {

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private TransactionService transactionService;

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
    @Transactional(rollbackFor = Exception.class)
    public Wallet walletToWalletTransfer(User sender, Long receiverWalletId, Long money) throws Exception {
        if (money == null || money <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Transfer amount must be greater than zero."
            );
        }

        if (receiverWalletId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Receiver wallet ID is required."
            );
        }

        Wallet senderWallet = getUserWallet(sender);
        Long senderWalletId = senderWallet.getId();

        if (senderWalletId.equals(receiverWalletId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "You cannot transfer money to your own wallet."
            );
        }

        Long firstWalletId = Math.min(senderWalletId, receiverWalletId);
        Long secondWalletId = Math.max(senderWalletId, receiverWalletId);

        Wallet firstWallet = findWalletForUpdate(firstWalletId);
        Wallet secondWallet = findWalletForUpdate(secondWalletId);

        Wallet lockedSender = senderWalletId.equals(firstWalletId) ? firstWallet : secondWallet;
        Wallet lockedReceiver = receiverWalletId.equals(firstWalletId) ? firstWallet : secondWallet;

        if (lockedReceiver.getUser() != null
                && lockedReceiver.getUser().getId() == sender.getId()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "You cannot transfer money to your own wallet."
            );
        }

        if (lockedSender.getBalance() == null || lockedReceiver.getBalance() == null) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Wallet balance is not initialized."
            );
        }

        BigDecimal transferAmount = BigDecimal.valueOf(money);
        if (lockedSender.getBalance().compareTo(transferAmount) < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Insufficient balance."
            );
        }

        lockedSender.setBalance(lockedSender.getBalance().subtract(transferAmount));
        lockedReceiver.setBalance(lockedReceiver.getBalance().add(transferAmount));

        walletRepository.save(lockedSender);
        walletRepository.save(lockedReceiver);

        transactionService.createTransaction(
                lockedSender,
                WalletTransactionType.WALLET_TRANSFER,
                String.valueOf(lockedReceiver.getId()),
                "Transfer sent to wallet #" + lockedReceiver.getId(),
                -money
        );
        transactionService.createTransaction(
                lockedReceiver,
                WalletTransactionType.WALLET_TRANSFER,
                String.valueOf(lockedSender.getId()),
                "Transfer received from wallet #" + lockedSender.getId(),
                money
        );

        return lockedSender;
    }

    private Wallet findWalletForUpdate(Long walletId) {
        return walletRepository.findByIdForUpdate(walletId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Wallet not found."
                ));
    }

    @Override
    public Wallet payOrderAmount(Order order, User user) throws Exception {
        Wallet wallet = getUserWallet(user);
        if (order.getOrderType().equals(OrderType.BUY)) {
            BigDecimal balance = wallet.getBalance();
            BigDecimal orderPrice = order.getPrice();

            if (balance.compareTo(orderPrice) < 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Insufficient balance for this transaction."
                );
            }

            wallet.setBalance(balance.subtract(orderPrice));
        } else {
            BigDecimal newBalance = wallet.getBalance().add(order.getPrice());
            wallet.setBalance(newBalance);
        }
        walletRepository.save(wallet);
        return wallet;
    }
}
