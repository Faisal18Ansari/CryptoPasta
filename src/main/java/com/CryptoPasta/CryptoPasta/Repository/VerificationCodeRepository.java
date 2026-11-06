package com.CryptoPasta.CryptoPasta.Repository;

import com.CryptoPasta.CryptoPasta.Model.VerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VerificationCodeRepository extends JpaRepository<VerificationCode, Long> {
    public VerificationCode findByUserId(Long userId);
}
