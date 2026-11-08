package com.CryptoPasta.CryptoPasta.Controller;

import com.CryptoPasta.CryptoPasta.Domain.VerificationType;
import com.CryptoPasta.CryptoPasta.Domain.TwoFactorOperation;
import com.CryptoPasta.CryptoPasta.Model.ForgotPasswordToken;
import com.CryptoPasta.CryptoPasta.Model.User;
import com.CryptoPasta.CryptoPasta.Model.VerificationCode;
import com.CryptoPasta.CryptoPasta.Request.ForgotPasswordTokenRequest;
import com.CryptoPasta.CryptoPasta.Request.ResetPasswordRequest;
import com.CryptoPasta.CryptoPasta.Request.TwoFactorVerificationRequest;
import com.CryptoPasta.CryptoPasta.Response.ApiResponse;
import com.CryptoPasta.CryptoPasta.Response.AuthResponse;
import com.CryptoPasta.CryptoPasta.Services.EmailService;
import com.CryptoPasta.CryptoPasta.Services.ForgotPasswordService;
import com.CryptoPasta.CryptoPasta.Services.OtpVerificationResult;
import com.CryptoPasta.CryptoPasta.Services.UserService;
import com.CryptoPasta.CryptoPasta.Services.VerificationCodeService;
import com.CryptoPasta.CryptoPasta.Utilities.OtpUtils;
import jakarta.mail.MessagingException;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
public class UserController {
    @Autowired
    private UserService userService;
    @Autowired
    private VerificationCodeService verificationCodeService;
    @Autowired
    private EmailService emailService;
    @Autowired
    private ForgotPasswordService forgotPasswordService;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping("/api/users/profile")
    public ResponseEntity<User> getUserProfile(@RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        return new ResponseEntity<User>(user, HttpStatus.OK);
    }

    @PostMapping("/api/users/verification/{operation}/send-otp")
    public ResponseEntity<AuthResponse> sendVerificationOtp(
            @RequestHeader("Authorization") String jwt,
            @PathVariable TwoFactorOperation operation) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);

        boolean enabled = user.getTwoFactorAuth() != null
                && user.getTwoFactorAuth().isEnabled();
        if (operation == TwoFactorOperation.ENABLE && enabled) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Two-factor authentication is already enabled."
            );
        }
        if (operation == TwoFactorOperation.DISABLE && !enabled) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Two-factor authentication is already disabled."
            );
        }

        String otp = OtpUtils.generateOtp();
        VerificationCode challenge =
                verificationCodeService.sendVerificationCode(
                        user,
                        VerificationType.EMAIL,
                        operation,
                        otp
                );
        try {
            emailService.sendVerificationOtpEmail(user.getEmail(), otp);
        } catch (MessagingException | MailException exception) {
            verificationCodeService.deleteVerificationCodeById(challenge.getId());
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Could not send the verification email. Please try again.",
                    exception
            );
        }

        AuthResponse response = new AuthResponse();
        response.setMessage("Two-factor verification code sent.");
        response.setSession(challenge.getId().toString());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/api/users/two-factor/verify-otp")
    public ResponseEntity<User> enableTwoFactorAuthentication(
            @RequestBody @Valid TwoFactorVerificationRequest request,
            @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        boolean enabled = user.getTwoFactorAuth() != null
                && user.getTwoFactorAuth().isEnabled();

        if (request.getOperation() == TwoFactorOperation.DISABLE) {
            if (!enabled) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Two-factor authentication is already disabled."
                );
            }
            if (request.getPassword() == null
                    || user.getPassword() == null
                    || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                throw new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Current password is incorrect."
                );
            }
        } else if (enabled) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Two-factor authentication is already enabled."
            );
        }

        long challengeId;
        try {
            challengeId = Long.parseLong(request.getSessionId());
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "The verification session is invalid."
            );
        }

        OtpVerificationResult result = verificationCodeService.verifyVerificationCode(
                challengeId,
                user.getId(),
                request.getOperation(),
                request.getOtp()
        );
        if (result.status() != OtpVerificationResult.Status.SUCCESS) {
            throw otpVerificationException(result.status());
        }

        User updatedUser;
        if (request.getOperation() == TwoFactorOperation.ENABLE) {
            updatedUser = userService.enableTwoFactorAuthentication(
                    VerificationType.EMAIL,
                    user.getEmail(),
                    user
            );
        } else {
            updatedUser = userService.disableTwoFactorAuthentication(user);
        }

        return ResponseEntity.ok(updatedUser);
    }

    private ResponseStatusException otpVerificationException(OtpVerificationResult.Status status) {
        return switch (status) {
            case INVALID -> new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "The verification code is incorrect."
            );
            case EXPIRED -> new ResponseStatusException(
                    HttpStatus.GONE,
                    "The verification code has expired. Request a new one."
            );
            case LOCKED -> new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Too many incorrect codes. Request a new one."
            );
            case NOT_FOUND -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "The verification session is invalid or has already been used."
            );
            case SUCCESS -> new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "OTP verification result was inconsistent."
            );
        };
    }

    @PostMapping("/auth/users/reset-password/send-otp")
    public ResponseEntity<AuthResponse> sendForgotPasswordOtp(@RequestBody ForgotPasswordTokenRequest req) throws Exception {
        User user = userService.findUserByEmail(req.getSendTo());
        String otp = OtpUtils.generateOtp();
        UUID uuid = UUID.randomUUID();
        String id = uuid.toString();
        ForgotPasswordToken token = forgotPasswordService.findByUser(user.getId());

        if (token == null) {
            token = forgotPasswordService.createToken(user, id, otp, req.getVerificationType(), req.getSendTo());
        }

        if (req.getVerificationType().equals(VerificationType.EMAIL)) {
            emailService.sendVerificationOtpEmail(user.getEmail(), token.getOtp());
        }

        AuthResponse response = new AuthResponse();
        response.setSession(token.getId());
        response.setMessage("Password reset OTP sent successfully!");

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PatchMapping("/auth/users/reseet-password/verify-otp")
    public ResponseEntity<ApiResponse> resetPassword(@RequestParam String id, @RequestBody ResetPasswordRequest req, @RequestHeader("Authorization") String jwt) throws Exception {

        ForgotPasswordToken forgotPasswordToken = forgotPasswordService.findById(id);

        boolean isVerified = forgotPasswordToken.getOtp().equals(req.getOtp());
        if (isVerified) {
            userService.updatePassword(forgotPasswordToken.getUser(), req.getPassword());
            ApiResponse res = new ApiResponse();
            res.setMessage("Password updated successfully");
            return new ResponseEntity<>(res, HttpStatus.ACCEPTED);
        }
        throw new Exception("Wrong OTP!");
    }
}
