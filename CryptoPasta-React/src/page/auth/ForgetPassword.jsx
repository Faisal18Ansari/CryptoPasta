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
    FieldLabel,
    FieldSet,
} from "@/components/ui/field"

const forgotPasswordSchema = z.object({
    email: z.string()
        .trim()
        .min(1, "Enter your email address.")
        .email("Enter a valid email address."),
})

const ForgetPassword = () => {
    const form = useForm({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    })
    const emailError = form.formState.errors.email

    return (
        <div className="w-full px-2 py-2">
            <form
                className="w-full"
                noValidate
                onSubmit={form.handleSubmit(() => {})}
            >
                <FieldSet className="w-full min-w-0">
                    <Field data-invalid={!!emailError}>
                        <FieldLabel htmlFor="reset-email">Email Address</FieldLabel>
                        <FieldContent>
                            <Input
                                id="reset-email"
                                type="email"
                                autoComplete="email"
                                placeholder="blaze@gmail.com"
                                aria-invalid={!!emailError}
                                {...form.register("email")}
                            />
                            <FieldDescription>
                                Enter the email address associated with your account.
                            </FieldDescription>
                            <FieldError errors={emailError ? [emailError] : undefined} />
                        </FieldContent>
                    </Field>
                </FieldSet>
                {form.formState.isSubmitSuccessful && (
                    <p role="status" className="mt-3 text-center text-sm text-muted-foreground">
                        Email validated. Password reset is not connected yet.
                    </p>
                )}
                <Button type="submit" className="mx-auto mt-6 flex w-[92%]">
                    Send Reset Link
                </Button>
            </form>
        </div>
    )
}
export default ForgetPassword;