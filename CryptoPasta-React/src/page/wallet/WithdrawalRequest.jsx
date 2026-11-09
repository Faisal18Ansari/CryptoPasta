import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    getPaymentDetails,
    withdrawalRequest
} from "@/state/withdrawal/Action";
import {
    getUserWallet,
    getWalletTransactions
} from "@/state/wallet/Action";
import { formatIndianNumber } from "@/lib/utils";

const WithdrawalRequest = () => {
    const dispatch = useDispatch();
    const withdrawal = useSelector(state => state.withdrawal);
    const wallet = useSelector(state => state.wallet);
    const paymentDetails = withdrawal.paymentDetails;
    const availableBalance = wallet.userWallet?.balance;
    const balance = Number(availableBalance ?? 0);

    const [amount, setAmount] = React.useState("");
    const [error, setError] = React.useState("");
    const [success, setSuccess] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);

    React.useEffect(() => {
        dispatch(getPaymentDetails({ jwt: localStorage.getItem("jwt") }));
    }, [dispatch]);

    const handleChange = event => {
        setAmount(event.target.value);
        setError("");
        setSuccess("");
    };

    const handleSubmit = async event => {
        event.preventDefault();
        setError("");
        setSuccess("");

        const requestedAmount = Number(amount);

        if (!amount || !Number.isFinite(requestedAmount) || requestedAmount <= 0
            || !/^\d+(\.\d{1,2})?$/.test(amount)) {
            setError("Enter an amount greater than zero with no more than two decimal places.");
            return;
        }

        if (availableBalance == null) {
            setError("Your wallet balance is still loading. Try again shortly.");
            return;
        }

        if (!paymentDetails) {
            setError("Add your bank payment details before requesting a withdrawal.");
            return;
        }

        if (requestedAmount > balance) {
            setError("The withdrawal amount exceeds your available balance.");
            return;
        }

        const jwt = localStorage.getItem("jwt");
        setSubmitting(true);

        try {
            const result = await dispatch(withdrawalRequest({
                amount,
                jwt
            }));

            if (result) {
                setAmount("");
                setSuccess("Withdrawal request submitted and is pending review.");
                dispatch(getUserWallet(jwt));
                dispatch(getWalletTransactions({ jwt }));
            }
        } finally {
            setSubmitting(false);
        }
    };

    const visibleError = error || withdrawal.error;

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="flex w-full items-center justify-between rounded-md border bg-sidebar px-5 py-4 text-xl font-bold">
                <p>Available balance</p>
                <p>
                    {availableBalance == null
                        ? "Loading..."
                        : `₹${formatIndianNumber(balance, 2)}`}
                </p>
            </div>

            <div className="flex flex-col items-center gap-3">
                <h1 className="m-0 whitespace-nowrap text-xl! leading-tight!">
                    Enter Withdrawal Amount
                </h1>

                <div className="flex w-full max-w-sm items-center rounded-md border px-4">
                    <span className="text-2xl">₹</span>
                    <Input
                        onChange={handleChange}
                        value={amount}
                        type="number"
                        min="0.01"
                        step="0.01"
                        max={balance}
                        placeholder="9000"
                        className="mx-auto !w-52 flex-none border-none bg-transparent py-6 text-center text-2xl outline-none focus-visible:ring-0"
                    />
                </div>
            </div>

            <div>
                <p className="pb-2">Transfer To</p>
                <div className="flex items-center gap-5 rounded-md border px-5 py-2">
                    <img
                        src="https://cdn.pixabay.com/photo/2015/10/14/18/43/bank-988164_1280.png"
                        alt=""
                        className="h-8 w-8"
                    />
                    <div>
                        <p className="text-xl font-bold">
                            {paymentDetails?.bankName || "No bank account added"}
                        </p>
                        {paymentDetails?.accountNumber && (
                            <p className="text-xs">
                                Account ending in {String(paymentDetails.accountNumber).slice(-4)}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {visibleError && (
                <p role="alert" className="text-sm text-destructive">
                    {visibleError}
                </p>
            )}

            {success && (
                <p role="status" className="text-sm text-green-600">
                    {success}
                </p>
            )}

            <Button
                type="submit"
                disabled={!paymentDetails || submitting}
                className="w-full py-7 text-xl"
            >
                {submitting ? "Submitting..." : "Withdraw"}
            </Button>
        </form>
    );
};

export default WithdrawalRequest;