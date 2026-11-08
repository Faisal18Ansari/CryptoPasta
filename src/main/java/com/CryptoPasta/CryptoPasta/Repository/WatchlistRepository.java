package com.CryptoPasta.CryptoPasta.Repository;
import java.util.Optional;
import com.CryptoPasta.CryptoPasta.Model.Watchlist;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WatchlistRepository extends JpaRepository<Watchlist, Long> {
    Watchlist findByUserId(Long userId);

    Optional<Watchlist> findByIdAndUserId(Long watchlistId, Long userId);
}
