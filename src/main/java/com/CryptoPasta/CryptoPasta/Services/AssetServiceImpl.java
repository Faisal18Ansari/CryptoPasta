package com.CryptoPasta.CryptoPasta.Services;

import com.CryptoPasta.CryptoPasta.Model.Asset;
import com.CryptoPasta.CryptoPasta.Model.Coin;
import com.CryptoPasta.CryptoPasta.Model.User;
import com.CryptoPasta.CryptoPasta.Repository.AssetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class AssetServiceImpl implements AssetService {

    @Autowired
    private AssetRepository assetRepository;

    @Override
    public Asset createAsset(User user, Coin coin, BigDecimal quantity, BigDecimal executionPrice) {
        requirePositive(quantity, "Quantity");
        requirePositive(executionPrice, "Execution price");

        Asset asset = new Asset();
        asset.setUser(user);
        asset.setCoin(coin);
        asset.setQuantity(quantity);
        asset.setBuyPrice(executionPrice);

        return assetRepository.save(asset);
    }

    @Override
    public Asset getAssetById(Long assetId) throws Exception {
        return assetRepository.findById(assetId).orElseThrow(() -> new Exception("Asset not found!"));
    }

    @Override
    public Asset getAssetByUserIdAndId(Long userId, Long assetId) {
        return assetRepository.findByIdAndUserId(assetId, userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Asset not found."));
    }

    @Override
    public List<Asset> getUsersAsset(Long userId) {
        return assetRepository.findByUserId(userId);
    }

    @Override
    public Asset addToAsset(Long assetId, BigDecimal quantity, BigDecimal executionPrice) throws Exception {
        requirePositive(quantity, "Quantity");
        requirePositive(executionPrice, "Execution price");

        Asset asset = getAssetById(assetId);
        BigDecimal oldQuantity = asset.getQuantity();
        if (oldQuantity == null || oldQuantity.signum() <= 0 || asset.getBuyPrice() == null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "The existing asset quantity or average purchase price is invalid."
            );
        }
        BigDecimal newQuantity = oldQuantity.add(quantity);
        BigDecimal weightedCost = oldQuantity.multiply(asset.getBuyPrice())
                .add(quantity.multiply(executionPrice));
        BigDecimal newAveragePrice = weightedCost.divide(newQuantity, 18, RoundingMode.HALF_UP);

        asset.setQuantity(newQuantity);
        asset.setBuyPrice(newAveragePrice);
        return assetRepository.save(asset);
    }

    @Override
    public Asset subtractFromAsset(Long assetId, BigDecimal quantity) throws Exception {
        requirePositive(quantity, "Quantity");

        Asset asset = getAssetById(assetId);
        if (asset.getQuantity() == null || asset.getBuyPrice() == null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "The existing asset quantity or average purchase price is invalid."
            );
        }
        BigDecimal remainingQuantity = asset.getQuantity().subtract(quantity);
        if (remainingQuantity.signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient quantity to sell.");
        }

        asset.setQuantity(remainingQuantity);
        return assetRepository.save(asset);
    }

    @Override
    public Asset findAssetByUserIdAndCoinId(Long userId, String coinId) {
        return assetRepository.findByUserIdAndCoinId(userId, coinId);
    }

    @Override
    public Asset findAssetByUserIdAndCoinIdForUpdate(Long userId, String coinId) {
        return assetRepository.findByUserIdAndCoinIdForUpdate(userId, coinId)
                .orElse(null);
    }

    @Override
    public void deleteAsset(Long assetId) {
        assetRepository.deleteById(assetId);
    }

    private void requirePositive(BigDecimal value, String fieldName) {
        if (value == null || value.signum() <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    fieldName + " must be greater than zero."
            );
        }
    }
}
