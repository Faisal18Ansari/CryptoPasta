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
    FieldLegend,
    FieldSeparator,
    FieldSet,
    FieldTitle,
} from "@/components/ui/field"
import { useDispatch } from "react-redux";
import { addPaymentDetails } from "@/state/withdrawal/Action";

const paymentDetailsSchema = z.object({
    accountHolderName: z.string().min(2, "Enter the account holder name."),
    ifscCode: z.string().min(4, "Enter a valid IFSC code."),
    accountNumber: z.string().min(5, "Enter a valid account number."),
    bankName: z.string().min(2, "Enter the bank name."),
})

const PaymentDetailsForm = ({ onSubmitted }) => {
    const dispatch = useDispatch();
    const form = useForm({
        resolver: zodResolver(paymentDetailsSchema),
        defaultValues: {
            accountHolderName: "",
            ifscCode: "",
            accountNumber: "",
            bankName: ""
        }
    })
    const onSubmit = (data) => {

        console.log(data)
        dispatch(addPaymentDetails({
            paymentDetails: data,
            jwt: localStorage.getItem("jwt")
        }))
        onSubmitted()
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
        <div className="px-2 py-2">
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <FieldSet>
                    <FieldGroup>
                        {renderField(
                            "accountHolderName",
                            "Account Holder Name",
                            "CryptoPasta",
                            "This is the name registered with your bank."
                        )}
                        {renderField(
                            "ifscCode",
                            "IFSC Code",
                            "HDFC0000069",
                            "Enter your bank branch IFSC code."
                        )}
                        {renderField(
                            "accountNumber",
                            "Account Number",
                            "***********7937",
                            "Keep your account details accurate."
                        )}
                        {renderField(
                            "bankName",
                            "Bank Name",
                            "HDFC Bank",
                            "Enter the name of your bank."
                        )}
                    </FieldGroup>
                </FieldSet>
                <Button type="submit" className="mt-6 w-full">
                    Save Payment Details
                </Button>
            </form>
        </div>
    )
}
export default PaymentDetailsForm;