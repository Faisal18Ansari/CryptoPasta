package com.CryptoPasta.CryptoPasta.Services;

import com.CryptoPasta.CryptoPasta.Domain.PaymentMethod;
import com.CryptoPasta.CryptoPasta.Domain.PaymentOrderStatus;
import com.CryptoPasta.CryptoPasta.Model.PaymentOrder;
import com.CryptoPasta.CryptoPasta.Model.User;
import com.CryptoPasta.CryptoPasta.Repository.PaymentOrderRepository;
import com.CryptoPasta.CryptoPasta.Response.PaymentResponse;
import com.razorpay.Payment;
import com.razorpay.PaymentLink;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import com.stripe.exception.StripeException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class PaymentServiceImpl implements PaymentService {

    @Autowired
    private PaymentOrderRepository paymentOrderRepository;

    @Value("${razorpay.api.key}")
    private String razorPayApiKey;

    @Value("${razorpay.api.secret}")
    private String razorPayApiSecretKey;

    @Override
    @Transactional
    public PaymentOrder getPaymentOrderByIdForUpdate(Long id) {
        return paymentOrderRepository.findByIdForUpdate(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment order not found.")
        );
    }

    @Override
    public PaymentOrder createOrder(User user, BigDecimal amount, PaymentMethod paymentMethod) {
        PaymentOrder paymentOrder = new PaymentOrder();
        paymentOrder.setUser(user);
        paymentOrder.setAmount(amount);
        paymentOrder.setPaymentMethod(paymentMethod);
        paymentOrder.setStatus(PaymentOrderStatus.PENDING);
        return paymentOrderRepository.save(paymentOrder);
    }

    @Override
    public PaymentOrder getPaymentOrderById(Long id) throws Exception {
        return paymentOrderRepository.findById(id).orElseThrow(() -> new Exception("Payment order not found!"));
    }

    @Override
    @Transactional
    public Boolean proceedPaymentOrder(
            PaymentOrder paymentOrder,
            String paymentId,
            String paymentLinkId,
            String paymentLinkReferenceId,
            String paymentLinkStatus,
            String signature
    ) {
        if (paymentOrder.getPaymentMethod() != PaymentMethod.RAZORPAY) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Stripe top-ups are temporarily disabled."
            );
        }

        if (paymentOrder.getStatus() != PaymentOrderStatus.PENDING) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This payment order is not pending."
            );
        }

        if (paymentId == null || paymentId.isBlank()
                || paymentLinkId == null || paymentLinkId.isBlank()
                || paymentLinkReferenceId == null || paymentLinkReferenceId.isBlank()
                || paymentLinkStatus == null || paymentLinkStatus.isBlank()
                || signature == null || signature.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Razorpay callback details are incomplete.");
        }

        if (!paymentLinkId.equals(paymentOrder.getRazorpayPaymentLinkId())
                || !paymentLinkReferenceId.equals(paymentOrder.getRazorpayReferenceId())
                || !"paid".equals(paymentLinkStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Razorpay callback does not match this payment order.");
        }

        JSONObject callback = new JSONObject();
        callback.put("razorpay_payment_id", paymentId);
        callback.put("payment_link_id", paymentLinkId);
        callback.put("payment_link_reference_id", paymentLinkReferenceId);
        callback.put("payment_link_status", paymentLinkStatus);
        callback.put("razorpay_signature", signature);

        try {
            if (!Utils.verifyPaymentLink(callback, razorPayApiSecretKey)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Razorpay callback signature is invalid.");
            }
        } catch (RazorpayException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Razorpay callback signature is invalid.");
        }

        if (paymentOrder.getAmount() == null || paymentOrder.getAmount().signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment amount is invalid.");
        }

        long expectedAmountInPaise;
        try {
            expectedAmountInPaise = amountInPaise(paymentOrder.getAmount());
        } catch (ArithmeticException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment amount is invalid.");
        }

        try {
            RazorpayClient razorpayClient = new RazorpayClient(razorPayApiKey, razorPayApiSecretKey);
            PaymentLink paymentLink = razorpayClient.paymentLink.fetch(paymentLinkId);
            Payment payment = razorpayClient.payments.fetch(paymentId);

            if (!"paid".equals(paymentLink.get("status"))
                    || !"INR".equals(paymentLink.get("currency"))
                    || !hasAmount(paymentLink.get("amount"), expectedAmountInPaise)
                    || !hasAmount(paymentLink.get("amount_paid"), expectedAmountInPaise)
                    || !paymentLinkReferenceId.equals(paymentLink.get("reference_id"))
                    || !"captured".equals(payment.get("status"))
                    || !"INR".equals(payment.get("currency"))
                    || !hasAmount(payment.get("amount"), expectedAmountInPaise)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Razorpay payment details do not match this order.");
            }
        } catch (RazorpayException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Unable to verify the payment with Razorpay."
            );
        }

        if (paymentOrderRepository.existsByRazorpayPaymentId(paymentId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This Razorpay payment was already used.");
        }

        paymentOrder.setRazorpayPaymentId(paymentId);
        paymentOrder.setStatus(PaymentOrderStatus.SUCCESS);
        try {
            paymentOrderRepository.saveAndFlush(paymentOrder);
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This Razorpay payment was already used.");
        }
        return true;
    }

    @Override
    public PaymentResponse createRazorpayPaymentLink(PaymentOrder paymentOrder) throws RazorpayException {
        long amountInPaise;
        try {
            amountInPaise = amountInPaise(paymentOrder.getAmount());
        } catch (ArithmeticException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Top-up amount is too large.");
        }

        String referenceId = "cp_" + UUID.randomUUID();
        paymentOrder.setRazorpayReferenceId(referenceId);
        paymentOrderRepository.saveAndFlush(paymentOrder);

        try {
            RazorpayClient razorpay = new RazorpayClient(razorPayApiKey, razorPayApiSecretKey);
            JSONObject paymentLinkRequest = new JSONObject();
            paymentLinkRequest.put("amount", amountInPaise);
            paymentLinkRequest.put("currency", "INR");
            paymentLinkRequest.put("reference_id", referenceId);

            JSONObject customer = new JSONObject();
            customer.put("name", paymentOrder.getUser().getFullName());
            customer.put("email", paymentOrder.getUser().getEmail());
            paymentLinkRequest.put("customer", customer);

            JSONObject notify = new JSONObject();
            notify.put("email", true);
            paymentLinkRequest.put("notify", notify);

            paymentLinkRequest.put("reminder_enable", true);
            paymentLinkRequest.put(
                    "callback_url",
                    "http://localhost:5173/wallet?order_id=" + paymentOrder.getId()
            );
            paymentLinkRequest.put("callback_method", "get");

            PaymentLink payment = razorpay.paymentLink.create(paymentLinkRequest);
            String paymentLinkId = payment.get("id");
            String paymentUrl = payment.get("short_url");
            if (paymentLinkId == null || paymentLinkId.isBlank() || paymentUrl == null || paymentUrl.isBlank()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Razorpay did not return a valid payment link."
                );
            }

            paymentOrder.setRazorpayPaymentLinkId(paymentLinkId);
            paymentOrderRepository.saveAndFlush(paymentOrder);

            PaymentResponse response = new PaymentResponse();
            response.setPaymentUrl(paymentUrl);
            return response;
        } catch (RazorpayException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Unable to create a payment link with Razorpay."
            );
        }
    }

    @Override
    public PaymentResponse createStripePaymentLink(User user, BigDecimal amount, Long orderId) throws StripeException {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Stripe top-ups are temporarily disabled."
        );
    }

    private boolean hasAmount(Object amount, long expectedAmount) {
        if (!(amount instanceof Number number)) {
            return false;
        }
        try {
            return new BigDecimal(number.toString())
                    .compareTo(BigDecimal.valueOf(expectedAmount)) == 0;
        } catch (NumberFormatException exception) {
            return false;
        }
    }

    private long amountInPaise(BigDecimal amount) {
        return amount.movePointRight(2).longValueExact();
    }
}