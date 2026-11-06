import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { getPaymentDetails, withdrawalRequest } from "@/state/withdrawal/Action";
import { DialogClose } from "@/components/ui/dialog";
import { formatIndianNumber } from "@/lib/utils";

const WithdrawalRequest = () => {
    const dispatch = useDispatch();
    const withdrawal = useSelector(state => state.withdrawal);
    const wallet = useSelector(state => state.wallet);
    const availableBalance = wallet.userWallet?.balance;
    const balance = Number(availableBalance ?? 0);
    const [amount, setAmount] = React.useState("");
    const [error, setError] = React.useState("");

    React.useEffect(() => {
        dispatch(getPaymentDetails({ jwt: localStorage.getItem("jwt") }));
    }, [dispatch]);

    const handleChange = (event) => {
        setAmount(event.target.value);
        setError("");
    };
    const handleSubmit = (event) => {
        const requestedAmount = Number(amount);

        if (!amount || !Number.isFinite(requestedAmount) || requestedAmount <= 0) {
            event.preventDefault();
            setError("Enter an amount greater than zero.");
            return;
        }

        if (requestedAmount > balance) {
            event.preventDefault();
            setError("The withdrawal amount exceeds your available balance.");
            return;
        }

        dispatch(withdrawalRequest({
            amount: requestedAmount,
            jwt: localStorage.getItem("jwt")
        }));
    }
    return (
        <div className="space-y-6 pt-4">
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
                        min="1"
                        max={balance}
                        placeholder="9000"
                        className="mx-auto !w-52 flex-none bg-transparent border-none py-6 text-center text-2xl outline-none focus-visible:ring-0"
                    />
                </div>
                {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            </div>
            <div>
                <p className="pb-2">Transfer To</p>
                <div className="flex items-center gap-5 border px-5 py-2 rounded-md">
                    <img src="https://cdn.pixabay.com/photo/2015/10/14/18/43/bank-988164_1280.png" alt="" className="h-8 w-8" />
                    <div>
                        <p className="text-xl font-bold">
                            {withdrawal.paymentDetails?.bankName}
                        </p>
                        <p className="text-xs">
                            Account ending in {String(withdrawal.paymentDetails?.accountNumber ?? "").slice(-4)}
                        </p>
                    </div>
                </div>
            </div>
            <DialogClose asChild>
                <Button onClick={handleSubmit} className="w-full py-7 text-xl">
                    Withdraw
                </Button>
            </DialogClose>
        </div>
    );
};

export default WithdrawalRequest;