import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { paymentHandler } from "@/state/wallet/Action";
const TopUpForm = () => {
    const [amount, setAmount] = React.useState('')
    const dispatch = useDispatch();
    const { loading, error } = useSelector(state => state.wallet);
    const handleChange = (e) => {
        setAmount(e.target.value)
    }
    const handleSubmit = () => {
        dispatch(paymentHandler({
            jwt: localStorage.getItem("jwt"),
            paymentMethod: "RAZORPAY",
            amount
        }))
    }
    return (

        <div className="space-y-5 pt-4">
            <div>
                <h1 className="m-0 pb-1 text-xl! leading-tight!">
                    Enter Amount
                </h1>
                <Input onChange={handleChange}
                    value={amount}
                    className="py-5 text-lg"
                    placeholder="₹9000" />
            </div>
            <div>
                <h1 className="m-0 pb-1 text-xl! leading-tight!">Select Payment Method</h1>
                <div className="flex w-fit items-center rounded-md border p-3 px-5">
                    <div className="w-40 rounded-md bg-white px-5 py-2">
                        <img
                            src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=original"
                            alt="Razorpay"
                        />
                    </div>
                </div>
            </div>
            {error && (
                <p role="alert" className="text-sm text-destructive">
                    {error}
                </p>
            )}
            <Button onClick={handleSubmit} disabled={loading} className="w-full py-7">
                {loading ? "Processing..." : "SUBMIT"}
            </Button>
        </div>
    )
}
export default TopUpForm;