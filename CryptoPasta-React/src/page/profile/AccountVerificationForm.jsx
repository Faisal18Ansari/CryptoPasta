import React, { useState } from "react";

import {
    Dialog,
    DialogContent,
    DialogClose,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "@/components/ui/input-otp";

import { Button } from "@/components/ui/button";

const AccountVerificationForm = ({ handleSubmit }) => {
    const [value, setValue] = useState("");

    const handleOTPSubmit = () => {
        console.log("OTP:", value);

        if (handleSubmit) {
            handleSubmit();
        }
    };

    return (
        <div className="w-full">
            <div className="flex items-center justify-between gap-5">

                {/* Email */}
                <div className="flex items-center gap-8">
                    <p className="whitespace-nowrap">
                        Email :
                    </p>

                    <p className="whitespace-nowrap">
                        blaze@gmail.com
                    </p>
                </div>

                {/* Send OTP */}
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            Sent OTP
                        </Button>
                    </DialogTrigger>

                    <DialogContent className="sm:max-w-[550px]">
                        <DialogHeader>
                            <DialogTitle>
                                Enter OTP
                            </DialogTitle>
                        </DialogHeader>

                        <div className="flex items-center justify-center gap-8 py-4">

                            {/* OTP */}
                            <InputOTP
                                maxLength={6}
                                value={value}
                                onChange={(value) => setValue(value)}
                            >
                                <InputOTPGroup>
                                    <InputOTPSlot index={0} />
                                    <InputOTPSlot index={1} />
                                    <InputOTPSlot index={2} />
                                </InputOTPGroup>

                                <InputOTPSeparator />

                                <InputOTPGroup>
                                    <InputOTPSlot index={3} />
                                    <InputOTPSlot index={4} />
                                    <InputOTPSlot index={5} />
                                </InputOTPGroup>
                            </InputOTP>

                            {/* Submit */}
                            <DialogClose asChild>
                                <Button
                                    onClick={handleOTPSubmit}
                                    className="w-[12rem]"
                                >
                                    Submit
                                </Button>
                            </DialogClose>

                        </div>
                    </DialogContent>
                </Dialog>

            </div>
        </div>
    );
};

export default AccountVerificationForm;