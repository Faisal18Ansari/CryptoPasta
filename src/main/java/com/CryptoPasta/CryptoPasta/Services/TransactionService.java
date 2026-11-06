package com.CryptoPasta.CryptoPasta.Services;

import com.CryptoPasta.CryptoPasta.Domain.WalletTransactionType;
import com.CryptoPasta.CryptoPasta.Model.Wallet;
import com.CryptoPasta.CryptoPasta.Model.WalletTransaction;

import java.util.List;

public interface TransactionService {

    WalletTransaction createTransaction(Wallet wallet, WalletTransactionType type,
                                        String transferId, String purpose, Long amount);

    List<WalletTransaction> getTransactionByWallet(Wallet wallet);
}