package com.CryptoPasta.CryptoPasta.Model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class PaymentDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String accountNumber;

    private String accountHolderName;

    private String ifscCode;

    private String bankName;

    @OneToOne
    @JsonProperty(access = JsonProperty.Access.READ_WRITE)
    private User user;

}
