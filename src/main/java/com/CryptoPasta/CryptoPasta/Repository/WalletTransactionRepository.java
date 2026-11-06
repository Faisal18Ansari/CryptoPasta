package com.CryptoPasta.CryptoPasta.Repository;

import com.CryptoPasta.CryptoPasta.Model.Wallet;
import com.CryptoPasta.CryptoPasta.Model.WalletTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {

    List<WalletTransaction> findByWalletId(Long walletId);

    List<WalletTransaction> findByWalletOrderByDateDesc(Wallet wallet);
}