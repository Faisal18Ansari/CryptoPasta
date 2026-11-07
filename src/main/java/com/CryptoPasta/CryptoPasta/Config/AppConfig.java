package com.CryptoPasta.CryptoPasta.Config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.List;
import java.util.UUID;

@Configuration
public class AppConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean("dummyPasswordHash")
    public String dummyPasswordHash(PasswordEncoder passwordEncoder) {
        return passwordEncoder.encode(UUID.randomUUID().toString());
    }

    @Bean
    public JwtTokenValidator jwtTokenValidator() {
        return new JwtTokenValidator();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtTokenValidator jwtTokenValidator
    ) throws Exception {

        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(configurationSource()))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET, "/").permitAll()
                        .requestMatchers(
                                HttpMethod.POST,
                                "/auth/signin",
                                "/auth/signup"
                        ).permitAll()
                        .requestMatchers("/auth/two-factor/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/api/users/profile").authenticated()
                        .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(
                        jwtTokenValidator,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource configurationSource() {
        return request -> {
            CorsConfiguration config = new CorsConfiguration();

            config.setAllowedOrigins(List.of(
                    "http://localhost:5173",
                    "http://localhost:3000"
            ));
            config.setAllowedMethods(List.of(
                    "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
            ));
            config.setAllowedHeaders(List.of("*"));
            config.setExposedHeaders(List.of("Authorization"));
            config.setAllowCredentials(true);
            config.setMaxAge(3600L);

            return config;
        };
    }
}