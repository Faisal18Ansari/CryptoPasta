package com.CryptoPasta.CryptoPasta.Services;

import com.CryptoPasta.CryptoPasta.Domain.WithdrawalStatus;
import com.CryptoPasta.CryptoPasta.Model.User;
import com.CryptoPasta.CryptoPasta.Model.Withdrawal;
import com.CryptoPasta.CryptoPasta.Repository.WithdrawalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.CryptoPasta.CryptoPasta.Domain.WalletTransactionType;
import com.CryptoPasta.CryptoPasta.Model.PaymentDetails;
import com.CryptoPasta.CryptoPasta.Model.Wallet;
import com.CryptoPasta.CryptoPasta.Repository.WalletRepository;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class WithdrawalServiceImpl implements WithdrawalService {

    @Autowired
    private WithdrawalRepository withdrawalRepository;

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private PaymentDetailsService paymentDetailsService;

    @Autowired
    private TransactionService transactionService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Withdrawal requestMyWithdrawal(Long amount, User user) {
        if (amount == null || amount <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Withdrawal amount must be greater than zero."
            );
        }

        Wallet wallet = walletRepository.findByUserIdForUpdate(user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Wallet not found."
                ));

        if (wallet.getBalance() == null) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Wallet balance is not initialized."
            );
        }

        PaymentDetails paymentDetails = paymentDetailsService.getUserPaymentDetails(user);
        if (paymentDetails == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Add your bank payment details before requesting a withdrawal."
            );
        }

        BigDecimal withdrawalAmount = BigDecimal.valueOf(amount);
        if (wallet.getBalance().compareTo(withdrawalAmount) < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Insufficient balance."
            );
        }

        Withdrawal withdrawal = new Withdrawal();
        withdrawal.setUser(user);
        withdrawal.setAmount(amount);
        withdrawal.setStatus(WithdrawalStatus.PENDING);

        wallet.setBalance(wallet.getBalance().subtract(withdrawalAmount));
        walletRepository.save(wallet);

        Withdrawal savedWithdrawal = withdrawalRepository.save(withdrawal);

        transactionService.createTransaction(
                wallet,
                WalletTransactionType.WITHDRAWAL,
                null,
                "bank account withdrawal",
                amount
        );

        return savedWithdrawal;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Withdrawal proceedWithWithdrawal(Long withdrawalId, boolean accept) throws Exception {
        Withdrawal withdrawal = withdrawalRepository.findByIdForUpdate(withdrawalId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Withdrawal not found."
                ));

        if (withdrawal.getStatus() != WithdrawalStatus.PENDING) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This withdrawal has already been processed."
            );
        }

        Long amount = withdrawal.getAmount();
        if (amount == null || amount <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This withdrawal has an invalid amount and cannot be processed."
            );
        }

        if (accept) {
            withdrawal.setStatus(WithdrawalStatus.SUCCESS);
        } else {
            Long requesterId = withdrawal.getUser().getId();

            Wallet requesterWallet = walletRepository.findByUserIdForUpdate(requesterId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Requester's wallet not found."
                    ));

            if (requesterWallet.getBalance() == null) {
                throw new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Requester's wallet balance is not initialized."
                );
            }

            requesterWallet.setBalance(
                    requesterWallet.getBalance().add(BigDecimal.valueOf(amount))
            );
            walletRepository.save(requesterWallet);

            transactionService.createTransaction(
                    requesterWallet,
                    WalletTransactionType.WITHDRAWAL,
                    null,
                    "Declined withdrawal refund",
                    amount
            );

            withdrawal.setStatus(WithdrawalStatus.DECLINE);
        }

        withdrawal.setDate(LocalDateTime.now());
        return withdrawalRepository.save(withdrawal);
    }

    @Override
    public List<Withdrawal> getUsersWithdrawalHistory(User user) {
        return withdrawalRepository.findByUserId(user.getId());
    }

    @Override
    public List<Withdrawal> getAllWithdrawalRequest() {
        return withdrawalRepository.findAll();
    }
}
