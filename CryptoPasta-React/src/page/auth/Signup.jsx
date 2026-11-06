import React from "react";
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
} from "@/components/ui/field"
import { useDispatch, useSelector } from "react-redux";
import { register } from "@/state/auth/Action";

const signupSchema = z.object({
    fullName: z.string().trim().min(2, "Enter your full name."),
    email: z.string().trim().email("Enter a valid email address."),
    password: z.string()
        .min(12, "Use at least 12 characters.")
        .regex(/[a-z]/, "Include at least one lowercase letter.")
        .regex(/[A-Z]/, "Include at least one uppercase letter.")
        .regex(/[0-9]/, "Include at least one number.")
        .regex(/[^A-Za-z0-9]/, "Include at least one symbol.")
        .refine(
            (password) => new TextEncoder().encode(password).length <= 72,
            "Use a password no longer than 72 UTF-8 bytes."
        ),
})

const Signup = ({ onSubmitted }) => {
    const dispatch = useDispatch();
    const authError = useSelector((state) => state.auth.error);
    const form = useForm({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            fullName: "",
            email: "",
            password: ""
        }
    })
    const onSubmit = async (data) => {
        const succeeded = await dispatch(register(data));

        if (succeeded) {
            onSubmitted?.();
        }
    }

    const renderField = (name, label, placeholder, description) => {
        const error = form.formState.errors[name]

        return (
            <Field data-invalid={!!error}>
                <FieldLabel htmlFor={name}>{label}</FieldLabel>
                <FieldContent>
                    <Input
                        id={name}
                        placeholder={placeholder}
                        type={name === "email" ? "email" : name === "password" ? "password" : "text"}
                        autoComplete={name === "fullName" ? "name" : name === "email" ? "email" : "new-password"}
                        aria-invalid={!!error}
                        {...form.register(name)}
                    />
                    <FieldDescription>{description}</FieldDescription>
                    <FieldError errors={error ? [error] : undefined} />
                </FieldContent>
            </Field>
        )
    }

    return (
        <div className="w-full px-2 py-2">
            <form className="w-full" onSubmit={form.handleSubmit(onSubmit)}>
                <FieldSet className="w-full min-w-0">
                    <FieldGroup>
                        {renderField(
                            "fullName",
                            "Full Name",
                            "Blaze",
                            "Please enter your full name."
                        )}
                        {renderField(
                            "email",
                            "Email Address",
                            "blaze@gmail.com",
                            "Please enter a valid email id."
                        )}
                        {renderField(
                            "password",
                            "Password",
                            "Create a strong password",
                            "Please enter a strong password."
                        )}

                    </FieldGroup>
                </FieldSet>
                {authError && (
                    <p role="alert" className="mt-3 text-center text-sm text-destructive">
                        {typeof authError === "string"
                            ? authError
                            : authError.message || "Signup failed. Please try again."}
                    </p>
                )}
                <Button type="submit" className="mx-auto mt-6 flex w-[92%]">
                    Create New Account
                </Button>
            </form>
        </div>
    )
}
export default Signup;