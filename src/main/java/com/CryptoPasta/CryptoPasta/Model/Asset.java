package com.CryptoPasta.CryptoPasta.Model;

import java.math.BigDecimal;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, precision = 36, scale = 18)
    private BigDecimal quantity;

    @Column(nullable = false, precision = 36, scale = 18)
    private BigDecimal buyPrice;

    @ManyToOne
    private Coin coin;
    @ManyToOne
    private User user;
}
