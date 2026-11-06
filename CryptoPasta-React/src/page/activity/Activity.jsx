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
import { IndianRupee } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { getAllOrdersForUser } from "@/state/order/Action";
const Activity = () => {
    const dispatch = useDispatch();
    const { orders, loading, error } = useSelector(store => store.order);

    useEffect(() => {
        dispatch(getAllOrdersForUser({ jwt: localStorage.getItem("jwt") }));
    }, [dispatch]);

    const formatCurrency = (value) => Number(value ?? 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
    });
    const getOrderTimestamp = (order) => {
        const timestamp = new Date(order.timeStamp ?? 0).getTime();
        return Number.isNaN(timestamp) ? 0 : timestamp;
    };
    const sortedOrders = [...orders].sort((first, second) => (
        getOrderTimestamp(second) - getOrderTimestamp(first)
    ));

    return (
        < div className="lg:px-20 px-5 pb-7 pt-10">
            <h1 className="font-bold text-3xl">Activity</h1>
            <Table className="border">
                <TableHeader>
                    <TableRow>
                        <TableHead className="py-5">Date & Time</TableHead>
                        <TableHead>Trading Pair</TableHead>
                        <TableHead>Buy Price</TableHead>
                        <TableHead>Sell Price</TableHead>
                        <TableHead>Order Type</TableHead>
                        <TableHead>Profit/Loss</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading && orders.length === 0 && (
                        <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Loading orders...</TableCell></TableRow>
                    )}
                    {error && (
                        <TableRow><TableCell colSpan={7} className="py-8 text-center text-red-600">Could not load activity: {error}</TableCell></TableRow>
                    )}
                    {!loading && !error && orders.length === 0 && (
                        <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No orders yet.</TableCell></TableRow>
                    )}
                    {sortedOrders.map((order) => {
                        const orderItem = order.orderItem;
                        const coin = orderItem?.coin;
                        const buyPrice = Number(orderItem?.buyPrice ?? 0);
                        const sellPrice = Number(orderItem?.sellPrice ?? 0);
                        const quantity = Number(orderItem?.quantity ?? 0);
                        const realizedProfitLoss = order.orderType === "SELL" && order.orderStatus === "SUCCESS"
                            ? (sellPrice - buyPrice) * quantity
                            : null;
                        const orderDate = order.timeStamp ? new Date(order.timeStamp) : null;

                        return (
                            <TableRow key={order.id}>
                                <TableCell>
                                    {orderDate ? (
                                        <>
                                            <p>{orderDate.toLocaleDateString()}</p>
                                            <p>{orderDate.toLocaleTimeString()}</p>
                                        </>
                                    ) : "—"}
                                </TableCell>
                                <TableCell className="font-medium flex items-center gap-2">
                                    <Avatar className="-z-50">
                                        <AvatarImage src={coin?.image} alt={coin?.name || "Coin"} />
                                    </Avatar>
                                    <span>{coin?.symbol?.toUpperCase() || coin?.name || "Unknown coin"}</span>
                                </TableCell>
                                <TableCell>₹{formatCurrency(buyPrice)}</TableCell>
                                <TableCell>{sellPrice > 0 ? `₹${formatCurrency(sellPrice)}` : "—"}</TableCell>
                                <TableCell>{order.orderType}</TableCell>
                                <TableCell className={realizedProfitLoss == null ? "text-muted-foreground" : realizedProfitLoss >= 0 ? "text-green-600" : "text-red-600"}>
                                    {realizedProfitLoss == null ? "Not realized" : `${realizedProfitLoss >= 0 ? "+" : "-"}₹${formatCurrency(Math.abs(realizedProfitLoss))}`}
                                </TableCell>
                                <TableCell className="text-right">₹{formatCurrency(order.price)}</TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div >
    )
}
export default Activity;