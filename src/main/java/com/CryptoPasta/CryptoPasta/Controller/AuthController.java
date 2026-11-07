package com.CryptoPasta.CryptoPasta.Controller;

import com.CryptoPasta.CryptoPasta.Config.JwtProvider;
import com.CryptoPasta.CryptoPasta.Model.TwoFactorOtp;
import com.CryptoPasta.CryptoPasta.Model.User;
import com.CryptoPasta.CryptoPasta.Repository.UserRepository;
import com.CryptoPasta.CryptoPasta.Response.AuthResponse;
import com.CryptoPasta.CryptoPasta.Services.*;
import com.CryptoPasta.CryptoPasta.Utilities.OtpUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.CryptoPasta.CryptoPasta.Services.WalletService;
import com.CryptoPasta.CryptoPasta.Utilities.PasswordPolicy;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.server.ResponseStatusException;
import com.CryptoPasta.CryptoPasta.Domain.USER_ROLE;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final String EMAIL_ALREADY_REGISTERED =
            "An account with this email already exists.";

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WalletService walletService;

    @Autowired
    private CustomUserDetailService customUserDetailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    @Qualifier("dummyPasswordHash")
    private String dummyPasswordHash;

    @Autowired
    private TwoFactorOtpService twoFactorOtpService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private WatchlistService watchlistService;

    @PostMapping("/signup")
    public ResponseEntity<?> register(@RequestBody User user) throws Exception {
        PasswordPolicy.validateBcryptPassword(user.getPassword());

        String normalizedEmail = normalizeEmail(user.getEmail());

        if (userRepository.findByEmail(normalizedEmail) != null) {
            return duplicateEmailResponse();
        }

        User newUser = new User();
        newUser.setEmail(normalizedEmail);
        newUser.setPassword(passwordEncoder.encode(user.getPassword()));
        newUser.setFullName(user.getFullName());
        newUser.setUserRole(USER_ROLE.ROLE_CUSTOMER);

        final User savedUser;
        try {
            savedUser = userRepository.saveAndFlush(newUser);
        } catch (DataIntegrityViolationException exception) {
            if (userRepository.findByEmail(normalizedEmail) != null) {
                return duplicateEmailResponse();
            }

            throw exception;
        }

        watchlistService.createWatchlist(savedUser);
        walletService.createWallet(savedUser);

        Authentication auth = new UsernamePasswordAuthenticationToken(
                normalizedEmail,
                user.getPassword(),
                List.of(new SimpleGrantedAuthority(savedUser.getUserRole().name()))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        String jwt = JwtProvider.generateToken(auth);
        AuthResponse res = new AuthResponse();
        res.setJwt(jwt);
        res.setStatus(true);
        res.setMessage("Registration Successful");

        return new ResponseEntity<>(res, HttpStatus.CREATED);
    }

    @PostMapping("/signin")
    public ResponseEntity<AuthResponse> login(@RequestBody User user) throws Exception {
        System.out.println("LOGIN CONTROLLER REACHED: " + user.getEmail());
        String username = normalizeEmail(user.getEmail());
        String password = user.getPassword();
        User authUser = userRepository.findByEmail(username);
        boolean bcryptCompatible = PasswordPolicy.isBcryptCompatible(password);

        if (authUser == null || !bcryptCompatible) {
            passwordEncoder.matches(bcryptCompatible ? password : "", dummyPasswordHash);
            throw new BadCredentialsException("Invalid credentials");
        }

        Authentication auth = authenticate(username, password);
        SecurityContextHolder.getContext().setAuthentication(auth);

        String jwt = JwtProvider.generateToken(auth);

        if (authUser.getTwoFactorAuth() != null && authUser.getTwoFactorAuth().isEnabled()) {

            AuthResponse res = new AuthResponse();
            res.setMessage("Two Factor Authentication is enabled");
            res.setTwoFactorAuthEnable(true);
            String otp = OtpUtils.generateOtp();

            TwoFactorOtp oldTwoFactorOtp = twoFactorOtpService.findByUser(authUser.getId());
            if (oldTwoFactorOtp != null) {
                twoFactorOtpService.deleteTwoFactorOtp(oldTwoFactorOtp);
            }
            TwoFactorOtp newTwoFactorOtp = twoFactorOtpService.createTwoFactorOtp(authUser, otp, jwt);
            emailService.sendVerificationOtpEmail(username, otp);

            res.setSession(newTwoFactorOtp.getId());
            return new ResponseEntity<>(res, HttpStatus.ACCEPTED);
        }
        AuthResponse res = new AuthResponse();
        res.setJwt(jwt);
        res.setStatus(true);
        res.setMessage("Login Successful");

        return new ResponseEntity<>(res, HttpStatus.CREATED);
    }

    private Authentication authenticate(String username, String password) {
        UserDetails userDetails;
        try {
            userDetails = customUserDetailService.loadUserByUsername(username);
        } catch (UsernameNotFoundException exception) {
            passwordEncoder.matches(password, dummyPasswordHash);
            throw new BadCredentialsException("Invalid credentials");
        }
        if (!passwordEncoder.matches(password, userDetails.getPassword())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        return new UsernamePasswordAuthenticationToken(userDetails, password, userDetails.getAuthorities());
    }

    @PostMapping("/two-factor/otp/{otp}")
    public ResponseEntity<AuthResponse> verifySigninOtp(@PathVariable String otp, @RequestParam String id) throws Exception {
        TwoFactorOtp twoFactorOtp = twoFactorOtpService.findById(id);
        if (twoFactorOtpService.verifyTwoFactorOtp(twoFactorOtp, otp)) {
            AuthResponse res = new AuthResponse();
            res.setMessage("Two Factor Authentication Verified");
            res.setTwoFactorAuthEnable(true);
            res.setJwt(twoFactorOtp.getJwt());
            return new ResponseEntity<>(res, HttpStatus.OK);
        }
        throw new Exception("Invalid OTP");
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<String> handleBadCredentials(
            BadCredentialsException exception
    ) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(exception.getMessage());
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Email is required."
            );
        }

        return email.trim().toLowerCase(Locale.ROOT);
    }

    private ResponseEntity<Map<String, String>> duplicateEmailResponse() {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(Map.of("message", EMAIL_ALREADY_REGISTERED));
    }
}
