package com.CryptoPasta.CryptoPasta.Repository;

import com.CryptoPasta.CryptoPasta.Model.PaymentOrder;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PaymentOrderRepository extends JpaRepository<PaymentOrder, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from PaymentOrder p where p.id = :id")
    Optional<PaymentOrder> findByIdForUpdate(@Param("id") Long id);
}
