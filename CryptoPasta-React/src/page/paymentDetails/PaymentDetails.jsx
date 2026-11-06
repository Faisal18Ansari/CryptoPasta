import React, { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import PaymentDetailsForm from "./PaymentDetailsForm";
import { useDispatch, useSelector } from "react-redux";
import { getPaymentDetails } from "@/state/withdrawal/Action";
const PaymentDetails = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const paymentDetails = useSelector(store => store.withdrawal.paymentDetails);
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(getPaymentDetails({ jwt: localStorage.getItem("jwt") }))
    }, [])
    return (
        < div className="px-20">
            <h1 className="text-3xl font-bold py-10">Payment Details</h1>
            {paymentDetails ? <Card>
                <CardHeader>
                    <CardTitle>{paymentDetails.bankName}</CardTitle>
                    <CardDescription>
                        Account ending in {String(paymentDetails.accountNumber ?? "").slice(-4)}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                        <p className="w-32">Account Holder</p>
                        <p className="text-gray-400">{paymentDetails.accountHolderName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <p className="w-32">IFSC</p>
                        <p className="text-gray-400">{paymentDetails.ifscCode}</p>
                    </div>
                </CardContent>
            </Card> : <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild >
                    <Button className="py-6 mt-4">Add payment details</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Payment Details</DialogTitle>
                    </DialogHeader>
                    <PaymentDetailsForm onSubmitted={() => setIsDialogOpen(false)} />
                </DialogContent>
            </Dialog>}

        </div >
    )
}
export default PaymentDetails;