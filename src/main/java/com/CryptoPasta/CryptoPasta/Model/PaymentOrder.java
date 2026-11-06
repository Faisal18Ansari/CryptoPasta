package com.CryptoPasta.CryptoPasta.Model;

import com.CryptoPasta.CryptoPasta.Domain.PaymentMethod;
import com.CryptoPasta.CryptoPasta.Domain.PaymentOrderStatus;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class PaymentOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long amount;

    private PaymentOrderStatus status;

    private PaymentMethod paymentMethod;

    @ManyToOne
    private User user;
}
