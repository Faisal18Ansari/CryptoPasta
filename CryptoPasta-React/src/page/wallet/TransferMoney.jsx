import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React from "react";
import {
    Dialog,
    DialogContent,
    DialogClose,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useDispatch, useSelector } from "react-redux";
import { transferMoney } from "@/state/wallet/Action";
const TransferMoney = () => {
    const dispatch = useDispatch();
    const { wallet } = useSelector(store => store)
    const [formData, setFormData] = React.useState({
        amount: "",
        walletId: '',
        purpose: ''
    })
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }
    const handleSubmit = () => {
        dispatch(transferMoney({
            jwt: localStorage.getItem("jwt"),
            walletId: formData.walletId,
            reqData: {
                amount: formData.amount,
                purpose: formData.purpose
            }
        }))
        console.log(formData)

    }
    return (
        <div className=" pt-10 space-y-5">
            <div>
                <h1 className="pb-1">Enter Amount</h1>
                <Input name="amount"
                    onChange={handleChange}
                    value={formData.amount}
                    className="py-7"
                    placeholder="₹9000"
                />
            </div>
            <div>
                <h1 className="pb-1">Wallet ID</h1>
                <Input name="walletId"
                    onChange={handleChange}
                    value={formData.walletId}
                    className="py-7"
                    placeholder="#FA02591"
                />
            </div>
            <div>
                <h1 className="pb-1">Purpose</h1>
                <Input name="purpose"
                    onChange={handleChange}
                    value={formData.purpose}
                    className="py-7"
                    placeholder="Gift for your friend"
                />
            </div>
            <DialogClose className="w-full">
                <Button onClick={handleSubmit} className="w-full py-7">
                    Submit
                </Button>
            </DialogClose>
        </div>
    )
}
export default TransferMoney