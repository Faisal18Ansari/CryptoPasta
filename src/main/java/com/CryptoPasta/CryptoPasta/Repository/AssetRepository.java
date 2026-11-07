package com.CryptoPasta.CryptoPasta.Repository;

import com.CryptoPasta.CryptoPasta.Model.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.List;

public interface AssetRepository extends JpaRepository<Asset, Long> {

    List<Asset> findByUserId(Long userId);

    Asset findByUserIdAndCoinId(Long userId, String coinId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select a from Asset a
        where a.user.id = :userId and a.coin.id = :coinId
        """)
    Optional<Asset> findByUserIdAndCoinIdForUpdate(
            @Param("userId") Long userId,
            @Param("coinId") String coinId
    );


}
