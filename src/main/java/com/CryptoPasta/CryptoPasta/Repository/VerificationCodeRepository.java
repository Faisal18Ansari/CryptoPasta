package com.CryptoPasta.CryptoPasta.Repository;

import com.CryptoPasta.CryptoPasta.Model.VerificationCode;
import com.CryptoPasta.CryptoPasta.Domain.TwoFactorOperation;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VerificationCodeRepository extends JpaRepository<VerificationCode, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select code from VerificationCode code
            where code.id = :id and code.user.id = :userId and code.operation = :operation
            """)
    Optional<VerificationCode> findByIdAndUserIdForUpdate(
            @Param("id") Long id,
            @Param("userId") Long userId,
            @Param("operation") TwoFactorOperation operation
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select code from VerificationCode code where code.user.id = :userId")
    Optional<VerificationCode> findByUserIdForUpdate(@Param("userId") Long userId);
}
