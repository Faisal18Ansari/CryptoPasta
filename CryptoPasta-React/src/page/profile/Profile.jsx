import React, { useState } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { VerifiedIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import AccountVerificationForm from "./AccountVerificationForm";
import { useDispatch, useSelector } from "react-redux";
import {
    sendTwoFactorOtp,
    updateTwoFactorAuthentication,
} from "@/state/auth/Action";

const Profile = () => {
    const dispatch = useDispatch();
    const auth = useSelector((state) => state.auth);
    const user = auth.user;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [formError, setFormError] = useState(null);
    const [operation, setOperation] = useState("ENABLE");

    const twoFactorEnabled = Boolean(
        user?.twoFactorAuth?.enabled ?? user?.twoFactorAuth?.isEnabled
    );

    const handleSendOtp = async () => {
        setFormError(null);
        const result = await dispatch(sendTwoFactorOtp(operation));
        if (result?.sessionId) {
            setSessionId(result.sessionId);
        } else {
            setFormError(result?.error || "Unable to send the verification code.");
        }
    };

    const handleVerifyOtp = async ({ otp, password }) => {
        setFormError(null);
        const result = await dispatch(
            updateTwoFactorAuthentication({ sessionId, otp, operation, password })
        );
        if (result?.success) {
            setDialogOpen(false);
            setSessionId(null);
        } else {
            setFormError(result?.error || "Unable to verify the code.");
        }
    };

    const handleDialogOpenChange = (open) => {
        setDialogOpen(open);
        if (!open) {
            setFormError(null);
        }
    };

    const profileRows = [
        ["Email", user?.email],
        ["Full name", user?.fullName],
        ["Account role", user?.userRole],
    ].filter(([, value]) => value);

    return (
        <div className="mb-5 flex flex-col items-center">
            <div className="w-full pt-10 lg:w-[60%]">
                <Card>
                    <CardHeader>
                        <CardTitle>Your Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {user ? (
                            <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                                {profileRows.map(([label, value]) => (
                                    <div key={label} className="flex min-w-0 gap-4">
                                        <dt className="w-28 shrink-0 font-medium">{label}</dt>
                                        <dd className="break-all text-muted-foreground">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Loading account information...
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="mt-6 w-full">
                    <CardHeader>
                        <div className="flex flex-wrap items-center gap-3">
                            <CardTitle>Two-Step Verification</CardTitle>
                            {twoFactorEnabled ? (
                                <Badge className="gap-2 bg-green-600 text-white">
                                    <VerifiedIcon />
                                    <span>Enabled</span>
                                </Badge>
                            ) : (
                                <Badge className="bg-orange-500 text-white">Disabled</Badge>
                            )}
                        </div>
                    </CardHeader>

                    {user && (
                        <CardContent>
                            <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant={twoFactorEnabled ? "outline" : "default"}
                                        onClick={() => {
                                            setOperation(twoFactorEnabled ? "DISABLE" : "ENABLE");
                                            setFormError(null);
                                        }}
                                    >
                                        {twoFactorEnabled
                                            ? "Disable Two-Step Verification"
                                            : "Enable Two-Step Verification"}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]">
                                    <DialogHeader>
                                        <DialogTitle>
                                            {operation === "DISABLE"
                                                ? "Confirm two-step verification change"
                                                : "Verify your email"}
                                        </DialogTitle>
                                    </DialogHeader>
                                    <AccountVerificationForm
                                        email={user.email}
                                        operation={operation}
                                        sessionId={sessionId}
                                        loading={auth.loading}
                                        error={formError}
                                        onSendOtp={handleSendOtp}
                                        onVerifyOtp={handleVerifyOtp}
                                    />
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default Profile;
