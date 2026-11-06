package com.CryptoPasta.CryptoPasta.Config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Getter
@Component
public class GeminiConfig {

    private static final Logger log = LoggerFactory.getLogger(GeminiConfig.class);

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.model}")
    private String model;

    @Value("${gemini.base-url}")
    private String baseUrl;

    @PostConstruct
    void validate() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                    "GEMINI_API_KEY is missing. Set it as an environment variable before starting the app.");
        }
        // Never log the key itself.
        log.info("Gemini configured: model={}, keyLength={}", model, apiKey.length());
    }

    public String generateContentUrl() {
        return baseUrl + "/models/" + model + ":generateContent";
    }
}
