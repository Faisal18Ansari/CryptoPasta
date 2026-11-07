package com.CryptoPasta.CryptoPasta.Model;

import com.CryptoPasta.CryptoPasta.Domain.PaymentMethod;
import com.CryptoPasta.CryptoPasta.Domain.PaymentOrderStatus;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(uniqueConstraints = {
        @UniqueConstraint(name = "uk_payment_order_razorpay_reference", columnNames = "razorpay_reference_id"),
        @UniqueConstraint(name = "uk_payment_order_razorpay_link", columnNames = "razorpay_payment_link_id"),
        @UniqueConstraint(name = "uk_payment_order_razorpay_payment", columnNames = "razorpay_payment_id")
})
@Data
public class PaymentOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long amount;

    private PaymentOrderStatus status;

    private PaymentMethod paymentMethod;

    @Column(name = "razorpay_reference_id", length = 100)
    private String razorpayReferenceId;

    @Column(name = "razorpay_payment_link_id", length = 100)
    private String razorpayPaymentLinkId;

    @Column(name = "razorpay_payment_id", length = 100)
    private String razorpayPaymentId;

    @ManyToOne
    private User user;
}
