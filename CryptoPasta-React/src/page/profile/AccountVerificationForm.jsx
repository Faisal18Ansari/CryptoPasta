import React, { useState } from "react";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const AccountVerificationForm = ({
    email,
    operation,
    sessionId,
    loading,
    error,
    onSendOtp,
    onVerifyOtp,
}) => {
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const isDisabling = operation === "DISABLE";

    if (!sessionId) {
        return (
            <div className="space-y-5">
                <p className="text-sm text-muted-foreground">
                    A six-digit verification code will be sent to {email} to{" "}
                    {isDisabling ? "confirm disabling" : "confirm enabling"} two-step verification.
                </p>
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                <Button type="button" onClick={onSendOtp} disabled={loading}>
                    {loading ? "Sending code..." : "Send verification code"}
                </Button>
            </div>
        );
    }

    return (
        <form
            className="space-y-5"
            onSubmit={(event) => {
                event.preventDefault();
                if (otp.length === 6 && (!isDisabling || password.length > 0)) {
                    onVerifyOtp({ otp, password });
                }
            }}
        >
            <p className="text-sm text-muted-foreground">
                Enter the six-digit code sent to {email}. The code expires in five minutes.
            </p>
            {isDisabling && (
                <Input
                    type="password"
                    autoComplete="current-password"
                    placeholder="Current password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                />
            )}
            <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                        {Array.from({ length: 6 }, (_, index) => (
                            <InputOTPSlot key={index} index={index} />
                        ))}
                    </InputOTPGroup>
                </InputOTP>
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button
                type="submit"
                className="w-full"
                disabled={loading || otp.length !== 6 || (isDisabling && !password)}
            >
                {loading
                    ? "Verifying..."
                    : isDisabling
                        ? "Verify and disable"
                        : "Verify and enable"}
            </Button>
            <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={loading}
                onClick={() => {
                    setOtp("");
                    onSendOtp();
                }}
            >
                Send a new code
            </Button>
        </form>
    );
};

export default AccountVerificationForm;
