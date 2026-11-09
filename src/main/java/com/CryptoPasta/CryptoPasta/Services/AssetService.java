package com.CryptoPasta.CryptoPasta.Services;

import com.CryptoPasta.CryptoPasta.Model.Asset;
import com.CryptoPasta.CryptoPasta.Model.Coin;
import com.CryptoPasta.CryptoPasta.Model.User;

import java.math.BigDecimal;
import java.util.List;

public interface AssetService {
    Asset createAsset(User user, Coin coin, BigDecimal quantity, BigDecimal executionPrice);

    Asset getAssetById(Long assetId) throws Exception;

    Asset getAssetByUserIdAndId(Long userId, Long assetId);

    List<Asset> getUsersAsset(Long userId);

    Asset addToAsset(Long assetId, BigDecimal quantity, BigDecimal executionPrice) throws Exception;

    Asset subtractFromAsset(Long assetId, BigDecimal quantity) throws Exception;

    Asset findAssetByUserIdAndCoinId(Long userId, String coinId);

    Asset findAssetByUserIdAndCoinIdForUpdate(Long userId, String coinId);

    void deleteAsset(Long assetId);
}
