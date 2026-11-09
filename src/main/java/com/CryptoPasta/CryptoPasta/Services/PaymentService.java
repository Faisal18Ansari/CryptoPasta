package com.CryptoPasta.CryptoPasta.Services;

import com.CryptoPasta.CryptoPasta.Domain.PaymentMethod;
import com.CryptoPasta.CryptoPasta.Model.PaymentOrder;
import com.CryptoPasta.CryptoPasta.Model.User;
import com.CryptoPasta.CryptoPasta.Response.PaymentResponse;
import com.razorpay.RazorpayException;
import com.stripe.exception.StripeException;

import java.math.BigDecimal;

public interface PaymentService {
    PaymentOrder createOrder(User user, BigDecimal amount, PaymentMethod paymentMethod);

    PaymentOrder getPaymentOrderByIdForUpdate(Long id);

    PaymentOrder getPaymentOrderById(Long id) throws Exception;

    Boolean proceedPaymentOrder(
            PaymentOrder paymentOrder,
            String paymentId,
            String paymentLinkId,
            String paymentLinkReferenceId,
            String paymentLinkStatus,
            String signature
    );

    PaymentResponse createRazorpayPaymentLink(PaymentOrder paymentOrder) throws RazorpayException;

    PaymentResponse createStripePaymentLink(User user, BigDecimal amount, Long orderId) throws StripeException;

}
