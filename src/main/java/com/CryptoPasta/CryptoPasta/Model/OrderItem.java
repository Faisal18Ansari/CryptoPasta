package com.CryptoPasta.CryptoPasta.Model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Entity
public class OrderItem  {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, precision = 36, scale = 18)
    private BigDecimal quantity;

    @ManyToOne
    private Coin coin;

    @Column(nullable = false, precision = 36, scale = 18)
    private BigDecimal buyPrice;

    @Column(nullable = false, precision = 36, scale = 18)
    private BigDecimal sellPrice;

    @JsonIgnore
    @OneToOne
    private Order order;
}
