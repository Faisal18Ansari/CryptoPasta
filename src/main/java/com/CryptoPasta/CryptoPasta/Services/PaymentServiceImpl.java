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
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class PaymentServiceImpl implements PaymentService {

    @Autowired
    private PaymentOrderRepository paymentOrderRepository;

    @Value("${stripe.api.key}")
    private String stripeApiKey;

    @Value("${razorpay.api.key}")
    private String razorPayApiKey;

    @Value("${razorpay.api.secret}")
    private String razorPayApiSecretKey;

    @Override
    public PaymentOrder getPaymentOrderByIdForUpdate(Long id) throws Exception {
        return paymentOrderRepository.findByIdForUpdate(id).orElseThrow(() -> new Exception("Payment order not found!"));
    }

    @Override
    public PaymentOrder createOrder(User user, Long amount, PaymentMethod paymentMethod) {
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
    public Boolean proceedPaymentOrder(PaymentOrder paymentOrder, String paymentId) throws RazorpayException {
        if (paymentOrder.getStatus() == null) {
            paymentOrder.setStatus(PaymentOrderStatus.PENDING);
        }

        if (paymentOrder.getStatus().equals(PaymentOrderStatus.PENDING)) {
            if (paymentOrder.getPaymentMethod().equals(PaymentMethod.RAZORPAY)) {
                RazorpayClient razorpayClient = new RazorpayClient(razorPayApiKey, razorPayApiSecretKey);
                Payment payment = razorpayClient.payments.fetch(paymentId);
                String status = payment.get("status");

                if (status.equals("captured")) {
                    paymentOrder.setStatus(PaymentOrderStatus.SUCCESS);
                    paymentOrderRepository.save(paymentOrder);
                    return true;
                }

                paymentOrder.setStatus(PaymentOrderStatus.FAILED);
                paymentOrderRepository.save(paymentOrder);
                return false;
            }

            paymentOrder.setStatus(PaymentOrderStatus.SUCCESS);
            paymentOrderRepository.save(paymentOrder);
            return true;
        }

        return false;
    }

    @Override
    public PaymentResponse createRazorpayPaymentLink(User user, Long amount, Long orderId) throws RazorpayException {
        long amountInPaise = amount * 100;

        try {
            RazorpayClient razorpay = new RazorpayClient(razorPayApiKey, razorPayApiSecretKey);

            JSONObject paymentLinkRequest = new JSONObject();
            paymentLinkRequest.put("amount", amountInPaise);
            paymentLinkRequest.put("currency", "INR");
            paymentLinkRequest.put("reference_id", orderId.toString());

            JSONObject customer = new JSONObject();
            customer.put("name", user.getFullName());
            customer.put("email", user.getEmail());
            paymentLinkRequest.put("customer", customer);

            JSONObject notify = new JSONObject();
            notify.put("email", true);
            paymentLinkRequest.put("notify", notify);

            paymentLinkRequest.put("reminder_enable", true);
            paymentLinkRequest.put("callback_url", "http://localhost:5173/wallet?order_id=" + orderId);
            paymentLinkRequest.put("callback_method", "get");

            PaymentLink payment = razorpay.paymentLink.create(paymentLinkRequest);

            PaymentResponse response = new PaymentResponse();
            response.setPaymentUrl(payment.get("short_url"));
            return response;
        } catch (RazorpayException e) {
            System.out.println("Error creating payment link: " + e.getMessage());
            throw new RazorpayException(e.getMessage());
        }
    }

    @Override
    public PaymentResponse createStripePaymentLink(User user, Long amount, Long orderId) throws StripeException {
        Stripe.apiKey = stripeApiKey;

        SessionCreateParams params = SessionCreateParams.builder().addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD).setMode(SessionCreateParams.Mode.PAYMENT).setSuccessUrl("http://localhost:5173/wallet?order_id=" + orderId).setCancelUrl("http://localhost:5173/payment/cancel").addLineItem(SessionCreateParams.LineItem.builder().setQuantity(1L).setPriceData(SessionCreateParams.LineItem.PriceData.builder().setCurrency("inr").setUnitAmount(amount * 100).setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder().setName("Top up wallet").build()).build()).build()).build();

        Session session = Session.create(params);

        PaymentResponse response = new PaymentResponse();
        response.setPaymentUrl(session.getUrl());
        return response;
    }
}