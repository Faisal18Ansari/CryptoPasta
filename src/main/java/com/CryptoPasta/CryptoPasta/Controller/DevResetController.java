package com.CryptoPasta.CryptoPasta.Controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.net.InetAddress;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;

/**
 * DEV ONLY. Only exists when spring.profiles.active=dev, and only accepts
 * requests from the local machine. TRUNCATE resets AUTO_INCREMENT back to 1.
 */
@RestController
@Profile("dev")
@RequestMapping("/dev")
public class DevResetController {

    // Children first, parents last. "coin" is intentionally NOT here (market-data cache).
    private static final List<String> TABLES_TO_WIPE = List.of(
            "withdrawal",
            "wallet_transaction",
            "watchlist_coins",
            "watchlist",
            "order_item",
            "orders",
            "asset",
            "payment_order",
            "payment_details",
            "verification_code",
            "two_factor_otp",
            "forgot_password_token",
            "wallet",
            "user"
    );

    private final DataSource dataSource;

    public DevResetController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @DeleteMapping("/reset-data")
    public ResponseEntity<String> resetData(HttpServletRequest request) throws SQLException {
        if (!isLoopback(request.getRemoteAddr())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Local requests only");
        }

        // FOREIGN_KEY_CHECKS is per-connection, so everything must run on ONE connection.
        try (Connection con = dataSource.getConnection(); Statement st = con.createStatement()) {
            st.execute("SET FOREIGN_KEY_CHECKS = 0");
            try {
                for (String table : TABLES_TO_WIPE) {
                    st.execute("TRUNCATE TABLE `" + table + "`");
                }
            } finally {
                st.execute("SET FOREIGN_KEY_CHECKS = 1");
            }
        }
        return ResponseEntity.ok("All user data wiped. AUTO_INCREMENT reset to 1.");
    }

    private boolean isLoopback(String addr) {
        try {
            return InetAddress.getByName(addr).isLoopbackAddress();
        } catch (Exception e) {
            return false;
        }
    }
}