package com.CryptoPasta.CryptoPasta.Services;

import com.CryptoPasta.CryptoPasta.Model.PaymentDetails;
import com.CryptoPasta.CryptoPasta.Model.User;

public interface PaymentDetailsService {

    public PaymentDetails addPaymentDetails(String accountNumber, String accountHolderName, String ifscCode, String bankName, User user);

    public PaymentDetails getUserPaymentDetails(User user);
}
