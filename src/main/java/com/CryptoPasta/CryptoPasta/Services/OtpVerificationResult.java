package com.CryptoPasta.CryptoPasta.Services;

import com.CryptoPasta.CryptoPasta.Model.User;

public record OtpVerificationResult(Status status, User user) {

    public enum Status {
        SUCCESS,
        INVALID,
        EXPIRED,
        LOCKED,
        NOT_FOUND
    }

    public static OtpVerificationResult success(User user) {
        return new OtpVerificationResult(Status.SUCCESS, user);
    }

    public static OtpVerificationResult failure(Status status) {
        return new OtpVerificationResult(status, null);
    }
}
