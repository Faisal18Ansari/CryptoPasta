import React from "react";
import { Check, RefreshCw, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    getAllWithdrawalRequest,
    proceedWithdrawal,
} from "@/state/withdrawal/Action";

const formatDate = value => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
};

const formatAmount = value => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "—";
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
};

const WithdrawalAdmin = () => {
    const dispatch = useDispatch();
    const { requests, loading, error } = useSelector(state => state.withdrawal);
    const [notice, setNotice] = React.useState("");

    const loadRequests = React.useCallback(() => {
        dispatch(getAllWithdrawalRequest(localStorage.getItem("jwt")));
    }, [dispatch]);

    React.useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    const handleDecision = async (request, accept) => {
        const action = accept ? "approve" : "decline";
        const requester = request.user?.fullName || request.user?.email || `request #${request.id}`;
        if (!window.confirm(`Are you sure you want to ${action} the withdrawal for ${requester}?`)) {
            return;
        }

        setNotice("");
        const result = await dispatch(proceedWithdrawal({
            id: request.id,
            jwt: localStorage.getItem("jwt"),
            accept,
        }));

        if (result) {
            setNotice(`Withdrawal #${request.id} was ${accept ? "approved" : "declined"}.`);
        }
    };

    const pendingCount = requests.filter(request => request.status === "PENDING").length;

    return (
        <main className="mx-auto w-full max-w-7xl space-y-6 px-5 pb-10 pt-8 lg:px-10">
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Admin withdrawals</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Review withdrawal requests. Pending requests: {pendingCount}
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    onClick={loadRequests}
                    disabled={loading}
                >
                    <RefreshCw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </header>

            {error && (
                <p role="alert" className="rounded-md border border-destructive/40 p-3 text-sm text-destructive">
                    {error}
                </p>
            )}
            {notice && (
                <p role="status" className="rounded-md border border-green-600/30 p-3 text-sm text-green-600">
                    {notice}
                </p>
            )}

            <div className="overflow-hidden rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Request</TableHead>
                            <TableHead>Requester</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Requested</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.map(request => {
                            const isPending = request.status === "PENDING";
                            return (
                                <TableRow key={request.id}>
                                    <TableCell>#{request.id}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">
                                            {request.user?.fullName || "Unknown user"}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {request.user?.email || "No email available"}
                                        </div>
                                    </TableCell>
                                    <TableCell>{formatAmount(request.amount)}</TableCell>
                                    <TableCell>{formatDate(request.date)}</TableCell>
                                    <TableCell>
                                        <span className={isPending ? "font-semibold text-amber-500" : "text-muted-foreground"}>
                                            {request.status || "UNKNOWN"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-2">
                                            {isPending ? (
                                                <>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() => handleDecision(request, true)}
                                                        disabled={loading}
                                                        aria-label={`Approve withdrawal ${request.id}`}
                                                    >
                                                        <Check className="mr-1 size-4" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleDecision(request, false)}
                                                        disabled={loading}
                                                        aria-label={`Decline withdrawal ${request.id}`}
                                                    >
                                                        <X className="mr-1 size-4" />
                                                        Decline
                                                    </Button>
                                                </>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">Processed</span>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {!loading && requests.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                                    No withdrawal requests found.
                                </TableCell>
                            </TableRow>
                        )}
                        {loading && requests.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                                    Loading withdrawal requests…
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </main>
    );
};

export default WithdrawalAdmin;