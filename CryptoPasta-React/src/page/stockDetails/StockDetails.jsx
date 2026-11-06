import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button";
import { CheckCircle2, DotIcon, BookmarkCheckIcon, BookmarkIcon, X } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogClose,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import TradingForm from "./TradingForm";
import React, { useEffect } from "react";
import StockChart from "../home/StockChart";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { fetchCoinDetails } from "@/state/coin/Action";
import api from "@/config/app";
import { addItemToWatchlist, getUserWatchlist } from "@/state/watchlist/Action";
import { formatIndianNumber } from "@/lib/utils";
import { existInWatchlist } from "@/util/existInWatchlist";
const StockDetails = () => {
    const { coin, watchlist } = useSelector(store => store)
    const dispatch = useDispatch();
    const { id } = useParams();
    const coinDetails = coin.coinDetails?.id === id ? coin.coinDetails : null;
    const [marketCoin, setMarketCoin] = React.useState(null);
    const marketCapChangePercentage = Number(coinDetails?.market_data?.market_cap_change_percentage_24h ?? 0);
    const marketCapChangeClass = marketCapChangePercentage >= 0 ? "text-green-600" : "text-red-600";
    const priceChangePercentage = marketCoin?.price_change_percentage_24h;
    const priceChangeClass = priceChangePercentage >= 0 ? "text-green-600" : "text-red-600";
    const [tradeOpen, setTradeOpen] = React.useState(false);
    const [notification, setNotification] = React.useState(null);

    useEffect(() => {
        dispatch(fetchCoinDetails({ coinId: id, jwt: localStorage.getItem("jwt") }));
        dispatch(getUserWatchlist(localStorage.getItem("jwt")))
    }, [id])

    useEffect(() => {
        let isActive = true;
        setMarketCoin(null);
        const jwt = localStorage.getItem("jwt");

        api.get("/coins/markets", {
            params: { ids: id },
            headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
        }).then(({ data }) => {
            if (isActive) {
                setMarketCoin(data.find(item => item.id === id) ?? null);
            }
        }).catch(error => {
            console.error(`Could not load live market data for ${id}`, error);
        });

        return () => {
            isActive = false;
        };
    }, [id]);

    useEffect(() => {
        if (!notification) return;
        const timeout = window.setTimeout(() => setNotification(null), 5000);
        return () => window.clearTimeout(timeout);
    }, [notification]);

    const handleOrderSuccess = ({ amount, coinName, orderType, quantity }) => {
        setTradeOpen(false);
        setNotification({
            message: `You ${orderType === "BUY" ? "bought" : "sold"} ${quantity} ${coinName} for ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount)}.`,
        });
    };

    const handleAddToWatchlist = async () => {
        const wasInWatchlist = existInWatchlist(watchlist.items, coinDetails);
        const result = await dispatch(addItemToWatchlist({ coinId: id, jwt: localStorage.getItem("jwt") }));

        if (result) {
            setNotification({
                message: wasInWatchlist
                    ? `${coinDetails?.name ?? "Coin"} has been removed from your watchlist.`
                    : `${coinDetails?.name ?? "Coin"} has been added to your watchlist.`,
            });
        }
    }

    return (
        <div className="p-5 mt-5">
            {notification && (
                <div role="status" aria-live="polite" className="fixed right-4 top-4 z-100 flex w-[min(24rem,calc(100vw-2rem))] items-start gap-3 rounded-md border bg-background p-4 text-foreground shadow-lg">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" />
                    <p className="flex-1 text-sm font-medium">{notification.message}</p>
                    <Button variant="ghost" size="icon" className="-mr-2 -mt-2 size-8 shrink-0" aria-label="Dismiss notification" onClick={() => setNotification(null)}>
                        <X className="size-4" />
                    </Button>
                </div>
            )}
            <div className="flex justify-between">
                <div className="flex gap-5 items-center">
                    <div>
                        <Avatar>
                            <AvatarImage
                                src={coin.coinDetails?.image.large} />
                        </Avatar>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p>{coinDetails?.symbol?.toUpperCase()}</p>
                            <DotIcon className="text-gray-400" />
                            <p className="text-gray-400">{coinDetails?.name}</p>

                        </div>
                        <div className="flex items-end gap-2">
                            <p className="text-xl font-bold">₹ {formatIndianNumber(marketCoin?.current_price ?? coinDetails?.market_data?.current_price?.inr, 2)}</p>
                            {priceChangePercentage != null && (
                                <p className={priceChangeClass}>
                                    {Number(priceChangePercentage) >= 0 ? "+" : ""}{Number(priceChangePercentage).toFixed(2)}%
                                </p>
                            )}
                        </div>
                        {coinDetails?.market_data?.market_cap_change_percentage_24h != null && (
                            <p className={`mt-1 text-sm ${marketCapChangeClass}`}>
                                <span className="text-muted-foreground">Market cap change: </span>
                                {marketCapChangePercentage >= 0 ? "+" : ""}{marketCapChangePercentage.toFixed(2)}%
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={handleAddToWatchlist} className={"size-12"} variant="outline">
                        {existInWatchlist(watchlist.items, coin.coinDetails) ? (
                            <BookmarkCheckIcon className="size-8" />
                        ) : (
                            <BookmarkIcon className="size-8" />
                        )}
                    </Button>
                    <Dialog open={tradeOpen} onOpenChange={setTradeOpen}>
                        <DialogTrigger asChild>
                            <Button size="lg" className="h-12 px-6 text-base">Trade</Button>
                        </DialogTrigger>
                        <DialogContent className="gap-6 p-6 sm:max-w-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl leading-tight">How Much Do you want to spend?</DialogTitle>
                            </DialogHeader>
                            <TradingForm onOrderSuccess={handleOrderSuccess} marketCoin={marketCoin} />
                        </DialogContent>
                    </Dialog>
                </div>

            </div>
            <div className="mt-14"><StockChart coinId={id} /></div>
        </div>
    )
}
export default StockDetails;