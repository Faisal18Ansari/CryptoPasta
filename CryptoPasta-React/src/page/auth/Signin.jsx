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
import { login } from "@/state/auth/Action";
import { useNavigate } from "react-router-dom";

const signinSchema = z.object({
    email: z.string().trim().email("Enter a valid email address."),
    password: z.string().min(1, "Enter your password."),
})

const Signin = ({ onSubmitted }) => {
    const dispatch = useDispatch()
    const navigate = useNavigate();
    const authError = useSelector((state) => state.auth.error);
    const form = useForm({
        resolver: zodResolver(signinSchema),
        defaultValues: {
            email: "",
            password: ""
        }
    })
    const onSubmit = (data) => {
        dispatch(login({ data, navigate }))
        console.log("Signin data:", { ...data, password: "[redacted]" })
        onSubmitted?.(data)
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
                        type={name === "email" ? "email" : "password"}
                        autoComplete={name === "email" ? "email" : "current-password"}
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
                            "email",
                            "Email Address",
                            "blaze@gmail.com",
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
                {authError && (
                    <p role="alert" className="mt-3 text-center text-sm text-destructive">
                        {typeof authError === "string"
                            ? authError
                            : authError.message || "Unable to sign in. Please check your credentials."}
                    </p>
                )}
                <Button type="submit" className="mx-auto mt-6 flex w-[92%]">
                    Sign in
                </Button>
            </form>
        </div>
    )
}
export default Signin;