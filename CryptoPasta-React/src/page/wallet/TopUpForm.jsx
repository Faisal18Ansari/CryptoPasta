import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React from "react";
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Check } from "lucide-react";
import { useDispatch } from "react-redux";
import { paymentHandler } from "@/state/wallet/Action";
const TopUpForm = () => {
    const [amount, setAmount] = React.useState('')
    const [paymentMethod, setPaymentMethod] = React.useState("RAZORPAY")
    const dispatch = useDispatch();
    const handlePaymentMethodChange = (value) => {
        setPaymentMethod(value)
    }
    const handleChange = (e) => {
        setAmount(e.target.value)
    }
    const handleSubmit = () => {
        console.log(amount, paymentMethod);
        dispatch(paymentHandler({ jwt: localStorage.getItem("jwt"), paymentMethod, amount }))
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
                <RadioGroup
                    onValueChange={(value) => handlePaymentMethodChange(value)}
                    className="flex"
                    defaultValue="RAZORPAY">
                    <div className="flex items-center space-x-2 border p-3 px-5 rounded-md">
                        <RadioGroupItem
                            value="RAZORPAY"
                            id="r1"
                            icon={Check}
                            className="h-9 w-9 "
                        />
                        <Label htmlFor="r1">
                            <div className="bg-white rounded-md px-5 py-2 w-32">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=original" alt="" />
                            </div>
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2 border p-3 px-5 rounded-md">
                        <RadioGroupItem
                            value="STRIPE"
                            id="r2"
                            icon={Check}
                            className="h-9 w-9 "
                        />
                        <Label htmlFor="r2">
                            <div className="bg-white rounded-md px-5 py-2 w-32">
                                <img src="https://thumb.wikimedia.org/wikipedia/commons/thumb/b/ba/Stripe_Logo%2C_revised_2016.svg/250px-Stripe_Logo%2C_revised_2016.svg.png?utm_source=en.wikipedia.org&utm_campaign=parser&utm_content=thumbnail" alt="" />
                            </div>
                        </Label>
                    </div>
                </RadioGroup>
            </div>
            <Button onClick={handleSubmit} className="w-full py-7">
                SUBMIT
            </Button>
        </div>
    )
}
export default TopUpForm;