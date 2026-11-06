package com.CryptoPasta.CryptoPasta.Repository;

import com.CryptoPasta.CryptoPasta.Model.Asset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssetRepository extends JpaRepository<Asset, Long> {

    List<Asset> findByUserId(Long userId);

    Asset findByUserIdAndCoinId(Long userId, String coinId);


}
