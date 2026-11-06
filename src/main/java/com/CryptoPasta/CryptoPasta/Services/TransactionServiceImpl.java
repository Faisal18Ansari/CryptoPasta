package com.CryptoPasta.CryptoPasta.Services;

import com.CryptoPasta.CryptoPasta.Domain.WalletTransactionType;
import com.CryptoPasta.CryptoPasta.Model.Wallet;
import com.CryptoPasta.CryptoPasta.Model.WalletTransaction;
import com.CryptoPasta.CryptoPasta.Repository.WalletTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class TransactionServiceImpl implements TransactionService {

    @Autowired
    private WalletTransactionRepository walletTransactionRepository;

    @Override
    public WalletTransaction createTransaction(Wallet wallet, WalletTransactionType type,
                                               String transferId, String purpose, Long amount) {
        WalletTransaction transaction = new WalletTransaction();
        transaction.setWallet(wallet);
        transaction.setType(type);
        transaction.setTransferId(transferId);
        transaction.setPurpose(purpose);
        transaction.setAmount(amount);
        transaction.setDate(LocalDate.now());

        return walletTransactionRepository.save(transaction);
    }

    @Override
    public List<WalletTransaction> getTransactionByWallet(Wallet wallet) {
        return walletTransactionRepository.findByWalletOrderByDateDesc(wallet);
    }
}