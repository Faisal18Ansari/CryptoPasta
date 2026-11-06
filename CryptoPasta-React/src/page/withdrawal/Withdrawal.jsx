import React, { useEffect } from "react";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { IndianRupee, BookmarkCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDispatch, useSelector } from "react-redux";
import { formatIndianNumber } from "@/lib/utils";
import { getWithdrawalHistory } from "@/state/withdrawal/Action";
const Withdrawal = () => {
    const dispatch = useDispatch();
    const { wallet, withdrawal } = useSelector(store => store)
    useEffect(() => {
        dispatch(getWithdrawalHistory(localStorage.getItem("jwt")))
    }, [])
    return (
        < div className="lg:px-20 px-5 pb-7 pt-10">
            <h1 className="font-bold text-3xl">Withdrawal</h1>
            <Table className="border">
                <TableHeader>
                    <TableRow>
                        <TableHead className="py-5">Date</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {withdrawal.history.map((item, index) => <TableRow key={index}>
                        <TableCell>
                            <p>
                                {item.date.toString()}
                            </p>
                        </TableCell>
                        <TableCell>Bank</TableCell>
                        <TableCell>
                            <div className="flex items-center gap-1">
                                <IndianRupee className="size-4" />
                                <span>₹{formatIndianNumber(item.amount, 2)}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center justify-end gap-1 text-green-500">
                                <span>{item.status}</span>
                            </div>
                        </TableCell>
                    </TableRow>)}
                </TableBody>
            </Table>
        </div >)
}
export default Withdrawal;