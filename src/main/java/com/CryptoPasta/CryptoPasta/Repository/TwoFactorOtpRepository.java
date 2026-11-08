package com.CryptoPasta.CryptoPasta.Repository;

import com.CryptoPasta.CryptoPasta.Model.TwoFactorOtp;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TwoFactorOtpRepository extends JpaRepository<TwoFactorOtp, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select otp from TwoFactorOtp otp where otp.id = :id")
    Optional<TwoFactorOtp> findByIdForUpdate(@Param("id") String id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select otp from TwoFactorOtp otp where otp.user.id = :userId")
    Optional<TwoFactorOtp> findByUserIdForUpdate(@Param("userId") Long userId);
}
