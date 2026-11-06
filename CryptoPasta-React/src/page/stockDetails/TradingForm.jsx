import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DotIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getUserWallet } from "@/state/wallet/Action";
import { getAssetDetails } from "@/state/asset/Action";
import { payOrder } from "@/state/order/Action";
import { formatIndianNumber } from "@/lib/utils";
const TradingForm = ({ onOrderSuccess, marketCoin }) => {
    const [orderType, setOrderType] = useState("BUY")

    const [amount, setAmount] = useState("");
    const [quantity, setQuantity] = useState("");
    const dispatch = useDispatch();
    const coin = useSelector(store => store.coin);
    const wallet = useSelector(store => store.wallet);
    const asset = useSelector(store => store.asset);
    const order = useSelector(store => store.order);
    const coinDetails = coin.coinDetails;
    const coinId = coinDetails?.id;
    const currentPrice = Number(marketCoin?.current_price ?? coinDetails?.market_data?.current_price?.inr ?? 0);
    const priceChangePercentage = marketCoin?.price_change_percentage_24h;
    const priceChangeClass = Number(priceChangePercentage) >= 0 ? "text-green-600" : "text-red-600";
    const availableCash = Number(wallet.userWallet?.balance ?? 0);
    const availableQuantity = Number(asset.assetDetails?.quantity ?? 0);
    const requestedAmount = Number(amount);
    const requestedQuantity = Number(quantity);
    const hasAmount = amount !== "" && Number.isFinite(requestedAmount) && requestedAmount > 0;
    const insufficientBalance = hasAmount && (
        orderType === "BUY"
            ? wallet.userWallet?.balance != null && requestedAmount > availableCash
            : requestedQuantity > availableQuantity
    );
    const disableOrder = !hasAmount || currentPrice <= 0 || insufficientBalance || order.loading ||
        (orderType === "BUY" && wallet.userWallet?.balance == null);

    useEffect(() => {
        dispatch(getUserWallet(localStorage.getItem("jwt")));
        if (coinId) {
            dispatch(getAssetDetails({
                coinId,
                jwt: localStorage.getItem("jwt"),
            }));
        }
    }, [dispatch, coinId]);

    const handleChange = (e) => {
        const nextAmount = e.target.value;
        setAmount(nextAmount);
        setQuantity(currentPrice > 0 && nextAmount !== ""
            ? calculateBuyCost(Number(nextAmount), currentPrice)
            : "");
    }
    const calculateBuyCost = (amount, price) => {
        let volume = amount / price;
        let decimalPlaces = Math.max(2, price.toString().split(".")[0].length)
        return volume.toFixed(decimalPlaces);
    }
    const handleBuyCrypto = async () => {
        if (disableOrder || !coinId) return;

        const succeeded = await dispatch(
            payOrder({
                jwt: localStorage.getItem("jwt"),
                amount: requestedAmount,
                orderData: {
                    coinId,
                    quantity: requestedQuantity,
                    orderType,
                },
            })
        );

        if (succeeded) {
            onOrderSuccess?.({
                amount: requestedAmount,
                coinName: coinDetails?.name || coinDetails?.symbol?.toUpperCase(),
                orderType,
                quantity: requestedQuantity,
            });
        }
    };
    return (
        <div className="space-y-7 p-1 sm:p-2">
            <div className="space-y-3">
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(100px,0.65fr)] items-center gap-4">
                    <Input
                        className="h-14 min-w-0 px-4 text-base focus-visible:ring-2"
                        placeholder="Enter Amount..."
                        onChange={handleChange}
                        type="number"
                        name="amount"
                    />
                    <div className="flex h-14 items-center justify-center rounded-md border text-xl font-medium">{quantity}</div>
                </div>
                {insufficientBalance && (
                    <p className="pt-1 text-center text-sm font-medium text-red-600">
                        {orderType === "BUY"
                            ? "Insufficient balance to buy."
                            : "Insufficient quantity to sell."}
                    </p>
                )}
            </div>

            <div className="flex min-w-0 items-center gap-4">
                <Avatar className="size-12 shrink-0">
                    <AvatarImage src={coinDetails?.image?.large} alt={coinDetails?.name || ""} />
                </Avatar>
                <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                        <p>{coinDetails?.symbol?.toUpperCase() || "Loading..."}</p>
                        <DotIcon className="text-gray-400" />
                        <p className="text-gray-400">{coinDetails?.name || "Loading..."}</p>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-x-2">
                        <p className="text-xl font-bold">₹ {currentPrice > 0 ? formatIndianNumber(currentPrice, 2) : "Loading..."}</p>
                        {priceChangePercentage != null && (
                            <p className={`text-sm ${priceChangeClass}`}>
                                {Number(priceChangePercentage) >= 0 ? "+" : ""}{Number(priceChangePercentage).toFixed(2)}%
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-5 text-sm">
                <div className="flex items-center justify-between gap-4">
                    <p className="text-muted-foreground">Order Type</p>
                    <p className="font-medium">Market Order</p>
                </div>
                <div className="flex items-center justify-between gap-4">
                    <p className="text-muted-foreground">{orderType == "BUY" ? "Available Cash" : "Available Quantity"}</p>
                    <p className="text-muted-foreground">
                        {orderType === "BUY"
                            ? wallet.userWallet?.balance == null
                                ? "Loading..."
                                : `₹${formatIndianNumber(wallet.userWallet.balance, 2)}`
                            : availableQuantity}
                    </p>
                </div>
            </div>

            <div className="space-y-5">
                {order.error && (
                    <p role="alert" className="text-center text-sm font-medium text-red-600">
                        Order failed: {order.error}
                    </p>
                )}
                <Button
                    onClick={handleBuyCrypto}
                    disabled={disableOrder || !coinId}
                    className="h-12 w-full text-base">{order.loading ? "Processing..." : orderType}</Button>
                <div className="flex justify-center">
                    <Button
                        variant="ghost" className="underline underline-offset-4"
                        onClick={() => setOrderType(orderType === "BUY" ? "SELL" : "BUY")}
                    >
                        {orderType === "BUY" ? "Or SELL" : "Or BUY"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
export default TradingForm;