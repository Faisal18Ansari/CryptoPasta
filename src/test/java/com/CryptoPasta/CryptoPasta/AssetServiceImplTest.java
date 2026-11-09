package com.CryptoPasta.CryptoPasta;

import com.CryptoPasta.CryptoPasta.Model.Asset;
import com.CryptoPasta.CryptoPasta.Repository.AssetRepository;
import com.CryptoPasta.CryptoPasta.Services.AssetServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AssetServiceImplTest {

    @Mock
    private AssetRepository assetRepository;

    @InjectMocks
    private AssetServiceImpl assetService;

    @Test
    void addToAssetRecalculatesWeightedAveragePurchasePrice() throws Exception {
        Asset asset = existingAsset("0.5", "300000");
        when(assetRepository.findById(1L)).thenReturn(Optional.of(asset));
        when(assetRepository.save(any(Asset.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Asset updated = assetService.addToAsset(
                1L,
                new BigDecimal("0.25"),
                new BigDecimal("360000")
        );

        assertDecimalEquals("0.75", updated.getQuantity());
        assertDecimalEquals("320000", updated.getBuyPrice());
        verify(assetRepository).save(asset);
    }

    @Test
    void subtractFromAssetReducesQuantityWithoutChangingAverageCost() throws Exception {
        Asset asset = existingAsset("0.75", "320000");
        when(assetRepository.findById(1L)).thenReturn(Optional.of(asset));
        when(assetRepository.save(any(Asset.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Asset updated = assetService.subtractFromAsset(1L, new BigDecimal("0.1"));

        assertDecimalEquals("0.65", updated.getQuantity());
        assertDecimalEquals("320000", updated.getBuyPrice());
    }

    @Test
    void subtractFromAssetRejectsSellingMoreThanHeld() {
        Asset asset = existingAsset("0.5", "300000");
        when(assetRepository.findById(1L)).thenReturn(Optional.of(asset));

        assertThrows(
                ResponseStatusException.class,
                () -> assetService.subtractFromAsset(1L, new BigDecimal("0.6"))
        );
    }

    private Asset existingAsset(String quantity, String averagePrice) {
        Asset asset = new Asset();
        asset.setId(1L);
        asset.setQuantity(new BigDecimal(quantity));
        asset.setBuyPrice(new BigDecimal(averagePrice));
        return asset;
    }

    private void assertDecimalEquals(String expected, BigDecimal actual) {
        assertEquals(0, new BigDecimal(expected).compareTo(actual));
    }
}
