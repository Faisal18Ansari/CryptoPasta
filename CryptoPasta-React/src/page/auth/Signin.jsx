import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldSet,
} from "@/components/ui/field";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { useDispatch, useSelector } from "react-redux";
import { login, verifyLoginOtp } from "@/state/auth/Action";
import { useNavigate } from "react-router-dom";

const signinSchema = z.object({
    email: z.string().trim().email("Enter a valid email address."),
    password: z.string().min(1, "Enter your password."),
});

const Signin = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const authError = useSelector((state) => state.auth.error);
    const loading = useSelector((state) => state.auth.loading);
    const [sessionId, setSessionId] = useState(null);
    const [otp, setOtp] = useState("");

    const form = useForm({
        resolver: zodResolver(signinSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (data) => {
        const result = await dispatch(login({ data, navigate }));
        if (result?.requiresTwoFactor) {
            setSessionId(result.sessionId);
            setOtp("");
        }
    };

    const onVerifyOtp = async (event) => {
        event.preventDefault();
        if (otp.length !== 6) {
            return;
        }
        await dispatch(verifyLoginOtp({ sessionId, otp, navigate }));
    };

    const renderField = (name, label, placeholder, description) => {
        const error = form.formState.errors[name];

        return (
            <Field data-invalid={!!error}>
                <FieldLabel htmlFor={name}>{label}</FieldLabel>
                <FieldContent>
                    <Input
                        id={name}
                        placeholder={placeholder}
                        type={name === "email" ? "email" : "password"}
                        autoComplete={name === "email" ? "email" : "current-password"}
                        aria-invalid={!!error}
                        {...form.register(name)}
                    />
                    <FieldDescription>{description}</FieldDescription>
                    <FieldError errors={error ? [error] : undefined} />
                </FieldContent>
            </Field>
        );
    };

    const errorMessage =
        typeof authError === "string"
            ? authError
            : authError?.message || null;

    if (sessionId) {
        return (
            <div className="w-full px-2 py-2">
                <form className="w-full" onSubmit={onVerifyOtp}>
                    <div className="flex flex-col items-center gap-5">
                        <p className="text-center text-sm text-muted-foreground">
                            Enter the six-digit code sent to your account email.
                        </p>
                        <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                            <InputOTPGroup>
                                {Array.from({ length: 6 }, (_, index) => (
                                    <InputOTPSlot key={index} index={index} />
                                ))}
                            </InputOTPGroup>
                        </InputOTP>
                        {errorMessage && (
                            <p role="alert" className="text-center text-sm text-destructive">
                                {errorMessage}
                            </p>
                        )}
                        <Button type="submit" className="w-[92%]" disabled={loading || otp.length !== 6}>
                            {loading ? "Verifying..." : "Verify and sign in"}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            disabled={loading}
                            onClick={() => {
                                setSessionId(null);
                                setOtp("");
                            }}
                        >
                            Back to sign in
                        </Button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="w-full px-2 py-2">
            <form className="w-full" onSubmit={form.handleSubmit(onSubmit)}>
                <FieldSet className="w-full min-w-0">
                    <FieldGroup>
                        {renderField(
                            "email",
                            "Email Address",
                            "name@example.com",
                            "Enter the email address associated with your account."
                        )}
                        {renderField(
                            "password",
                            "Password",
                            "Enter your password",
                            "Enter your account password."
                        )}
                    </FieldGroup>
                </FieldSet>
                {errorMessage && (
                    <p role="alert" className="mt-3 text-center text-sm text-destructive">
                        {errorMessage}
                    </p>
                )}
                <Button type="submit" className="mx-auto mt-6 flex w-[92%]" disabled={loading}>
                    {loading ? "Signing in..." : "Sign in"}
                </Button>
            </form>
        </div>
    );
};

export default Signin;
