package com.CryptoPasta.CryptoPasta.Repository;

import com.CryptoPasta.CryptoPasta.Model.Coin;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CoinRepository extends JpaRepository<Coin, String> {
}
