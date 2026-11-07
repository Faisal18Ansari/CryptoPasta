import React, { useEffect, useRef } from "react";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { WalletIcon, CopyIcon, RefreshCw, IndianRupee, UploadIcon, ShuffleIcon, ArrowDownLeft, Car } from 'lucide-react';
import TopUpForm from "./TopUpForm";
import WithdrawalRequest from "./WithdrawalRequest";
import TransferMoney from "./TransferMoney";
import { useDispatch, useSelector } from "react-redux";
import { formatIndianNumber } from "@/lib/utils";
import { depositMoney, getUserWallet, getWalletTransactions } from "@/state/wallet/Action";
import { useLocation, useNavigate } from "react-router-dom";
function useQuery() {
    return new URLSearchParams(useLocation().search);
}
export const Wallet = () => {
    const dispatch = useDispatch();
    const { wallet } = useSelector(store => store);
    const sortedTransactions = [...(wallet.transaction ?? [])].sort(
        (first, second) => {
            const dateDifference = new Date(second.date).getTime() - new Date(first.date).getTime();
            return dateDifference || Number(second.id ?? 0) - Number(first.id ?? 0);
        }
    );
    const query = useQuery();
    const orderId = query.get("order_id");
    const razorpayPaymentId = query.get("razorpay_payment_id");
    const paymentLinkId = query.get("razorpay_payment_link_id");
    const paymentLinkReferenceId = query.get("razorpay_payment_link_reference_id");
    const paymentLinkStatus = query.get("razorpay_payment_link_status");
    const razorpaySignature = query.get("razorpay_signature");
    const navigate = useNavigate();
    const processedPayment = useRef(null);
    const handleFetchUserWallet = () => {
        dispatch(getUserWallet(localStorage.getItem("jwt")));
    };
    const handleFetchWalletTransaction = () => {
        dispatch(getWalletTransactions({ jwt: localStorage.getItem("jwt") }))
    }
    useEffect(() => {
        handleFetchUserWallet();
        handleFetchWalletTransaction();
    }, []);
    useEffect(() => {
        if (orderId) {
            const paymentKey = `${orderId}:${razorpayPaymentId || ""}`;
            if (processedPayment.current === paymentKey) return;
            processedPayment.current = paymentKey;

            dispatch(depositMoney({
                jwt: localStorage.getItem("jwt"),
                orderId,
                paymentId: razorpayPaymentId,
                paymentLinkId,
                paymentLinkReferenceId,
                paymentLinkStatus,
                signature: razorpaySignature,
                navigate
            }))
        }
    }, [
        orderId,
        razorpayPaymentId,
        paymentLinkId,
        paymentLinkReferenceId,
        paymentLinkStatus,
        razorpaySignature,
        dispatch,
        navigate,
    ])
    return (
        < div className="flex flex-col items-center">
            <div className="pt-10 w-full lg:w-[60%]">
                <Card>
                    <CardHeader className="pb-9">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-5">
                                <WalletIcon size={30} />
                                <div>
                                    <CardTitle className="text-2xl">My Wallet</CardTitle>
                                    <div className="flex items-center gap-2">
                                        <p className="text-gray-200 text-sm">
                                            #{wallet.userWallet?.id}
                                        </p>
                                        <CopyIcon size={12} className="cursor-pointer hover:text-primary" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <RefreshCw onClick={handleFetchUserWallet} className="w-6 h-6 cursor-pointer hover:text-primary" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {wallet.error && (
                            <p role="alert" className="mb-4 text-sm text-destructive">
                                {wallet.error}
                            </p>
                        )}
                        <div className="flex items-center">
                            {/* <IndianRupee /> */}
                            <span className="text-2xl font-semibold">₹{formatIndianNumber(wallet.userWallet.balance, 2)}</span>
                        </div>
                        <div className="flex gap-7 mt-5">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <button
                                        type="button"
                                        className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-md border border-sidebar-border bg-sidebar shadow-[0_4px_12px_var(--chart-4)] transition-colors hover:text-primary">
                                        <UploadIcon className="size-6" />
                                        <span className="mt-2 text-sm">Add Money</span>
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="w-[min(90vw,40rem)] sm:max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle className="text-center text-xl">
                                            Top Up Your Wallet
                                        </DialogTitle>
                                    </DialogHeader>
                                    <TopUpForm />
                                </DialogContent>
                            </Dialog>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <button
                                        type="button"
                                        className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-md border border-sidebar-border bg-sidebar shadow-[0_4px_12px_var(--chart-4)] transition-colors hover:text-primary">
                                        <ArrowDownLeft className="size-6" />
                                        <span className="mt-2 text-sm">Withdrawal</span>
                                    </button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle className="text-center text-xl">
                                            Request Withdrawal
                                        </DialogTitle>
                                    </DialogHeader>
                                    <WithdrawalRequest />
                                </DialogContent>
                            </Dialog>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <button
                                        type="button"
                                        className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-md border border-sidebar-border bg-sidebar shadow-[0_4px_12px_var(--chart-4)] transition-colors hover:text-primary">
                                        <ShuffleIcon className="size-6" />
                                        <span className="mt-2 text-sm">Transfer Money</span>
                                    </button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle className="text-center text-xl">
                                            Transfer To Other Wallet
                                        </DialogTitle>
                                    </DialogHeader>
                                    <TransferMoney />
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardContent>
                </Card>
                <div className="pt-10 pb-5">
                    <div className="flex items-center gap-3 pb-5">
                        <h1 className="m-0 text-3xl! leading-tight! font-semibold">
                            History
                        </h1>
                        <RefreshCw onClick={handleFetchWalletTransaction} className="size-7 cursor-pointer hover:text-primary" />
                    </div>
                    <div className="space-y-4">
                        {sortedTransactions.map((item) => <Card className="flex min-h-20 flex-row items-center justify-between rounded-xl border-sidebar-border bg-transparent px-5 py-3" key={item.id ?? `${item.date}-${item.type || item.purpose}`}>
                            <div className="flex items-center gap-4">
                                <Avatar className="size-11 bg-sidebar-accent">
                                    <AvatarFallback className="bg-sidebar-accent text-foreground">
                                        <ShuffleIcon className="size-5" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <p className="font-semibold">{item.type || item.purpose}</p>
                                    <p className="text-sm text-muted-foreground">{item.date}</p>
                                </div>
                            </div>
                            <p className="font-semibold text-green-600">{item.amount}</p>
                        </Card>)}

                    </div>
                </div>
            </div>
        </div >
    )
}
export default Wallet;