import React, { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { IndianRupee, BookmarkCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDispatch, useSelector } from "react-redux";
import { addItemToWatchlist, getUserWatchlist } from "@/state/watchlist/Action";
import api from "@/config/app";
import { formatIndianNumber } from "@/lib/utils";
import { CheckCircle2, X } from "lucide-react";
const Watchlist = () => {
    const watchlist = useSelector(store => store.watchlist);
    const [marketCoins, setMarketCoins] = useState([]);
    const [notification, setNotification] = useState(null);
    const coinIdsKey = (watchlist.items ?? []).map(item => item.id).filter(Boolean).join(",");
    const dispatch = useDispatch();

    const handleRemoveToWatchlist = async (item) => {
        const result = await dispatch(addItemToWatchlist({ coinId: item.id, jwt: localStorage.getItem("jwt") }));
        if (result) {
            setNotification({ message: `${item.name} has been removed from your watchlist.` });
        }
    };

    useEffect(() => {
        dispatch(getUserWatchlist());
    }, [dispatch]);

    useEffect(() => {
        if (!notification) return;
        const timeout = window.setTimeout(() => setNotification(null), 5000);
        return () => window.clearTimeout(timeout);
    }, [notification]);

    useEffect(() => {
        if (!coinIdsKey) {
            return;
        }

        let isActive = true;
        const coinIds = coinIdsKey.split(",");
        const fetchMarketCoins = async () => {
            try {
                const jwt = localStorage.getItem("jwt");
                const { data } = await api.get("/coins/markets", {
                    params: { ids: coinIds.join(",") },
                    headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
                });

                if (isActive) {
                    setMarketCoins(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error("Could not load live watchlist market data", error);
            }
        };

        fetchMarketCoins();
        const interval = window.setInterval(fetchMarketCoins, 60_000);

        return () => {
            isActive = false;
            window.clearInterval(interval);
        };
    }, [coinIdsKey]);

    const marketCoinsById = new Map(marketCoins.map(item => [item.id, item]));

    return (
        < div className="lg:px-20 px-5 pb-7 pt-10">
            {notification && (
                <div role="status" aria-live="polite" className="fixed right-4 top-4 z-100 flex w-[min(24rem,calc(100vw-2rem))] items-start gap-3 rounded-md border bg-background p-4 text-foreground shadow-lg">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" />
                    <p className="flex-1 text-sm font-medium">{notification.message}</p>
                    <Button variant="ghost" size="icon" className="-mr-2 -mt-2 size-8 shrink-0" aria-label="Dismiss notification" onClick={() => setNotification(null)}>
                        <X className="size-4" />
                    </Button>
                </div>
            )}
            <h1 className="font-bold text-3xl">Watchlist</h1>
            <Table className="border">
                <TableHeader>
                    <TableRow>
                        <TableHead className="py-5">Coin</TableHead>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Volume</TableHead>
                        <TableHead>Market Cap</TableHead>
                        <TableHead>24H</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right text-red-600">REMOVE</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {(watchlist.items ?? []).map((item) => {
                        const marketCoin = marketCoinsById.get(item.id) ?? item;
                        const priceChange = marketCoin.price_change_percentage_24h;
                        const numericPriceChange = Number(priceChange);
                        const hasPriceChange = priceChange != null && Number.isFinite(numericPriceChange);

                        return <TableRow key={item.id}>
                            <TableCell className="font-medium flex items-center gap-2">
                                <Avatar className="-z-50">
                                    <AvatarImage src={marketCoin.image ?? item.image} />
                                </Avatar>
                                <span>{marketCoin.name ?? item.name}</span>
                            </TableCell>
                            <TableCell>{(marketCoin.symbol ?? item.symbol)?.toUpperCase()}</TableCell>
                            <TableCell>{formatIndianNumber(marketCoin.total_volume ?? item.total_volume, 0)}</TableCell>
                            <TableCell>{formatIndianNumber(marketCoin.market_cap ?? item.market_cap, 0)}</TableCell>
                            <TableCell className={hasPriceChange ? numericPriceChange >= 0 ? "text-green-600" : "text-red-600" : "text-muted-foreground"}>
                                {hasPriceChange
                                    ? `${numericPriceChange >= 0 ? "+" : ""}${numericPriceChange.toFixed(2)}%`
                                    : "—"}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center justify-end gap-1">
                                    <IndianRupee className="size-4" />
                                    <span>{formatIndianNumber(marketCoin.current_price ?? item.current_price, 2)}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button size="icon" className="h-10 w-10" onClick={() => handleRemoveToWatchlist(item)}>
                                    <BookmarkCheckIcon className="w-6 h-6" />
                                </Button>
                            </TableCell>
                        </TableRow>;
                    })}
                </TableBody>
            </Table>
        </div >
    )
}
export default Watchlist;