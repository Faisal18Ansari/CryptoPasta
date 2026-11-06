package com.CryptoPasta.CryptoPasta.Services;

import com.CryptoPasta.CryptoPasta.Model.Coin;
import com.CryptoPasta.CryptoPasta.Model.User;
import com.CryptoPasta.CryptoPasta.Model.Watchlist;

public interface WatchlistService {
    Watchlist findUserWatchlist(Long userId) throws Exception;

    Watchlist createWatchlist(User user);

    Watchlist findById(Long id) throws Exception;

    Coin addItemToWatchlist(Coin coin, User user) throws Exception;

}
