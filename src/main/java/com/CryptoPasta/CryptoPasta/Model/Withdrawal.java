package com.CryptoPasta.CryptoPasta.Model;

import com.CryptoPasta.CryptoPasta.Domain.WithdrawalStatus;
import jakarta.persistence.*;
import jdk.jfr.Enabled;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
public class Withdrawal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private WithdrawalStatus status;

    private Long amount;

    @ManyToOne
    private User user;

    private LocalDateTime date = LocalDateTime.now();

}
