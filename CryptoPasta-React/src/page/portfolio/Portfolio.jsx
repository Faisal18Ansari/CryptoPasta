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
import { useDispatch, useSelector } from "react-redux";
import { getUserAssets } from "@/state/asset/Action";
import api from "@/config/app";
import { formatIndianNumber } from "@/lib/utils";
const Portfolio = () => {
    const { asset } = useSelector(store => store)
    const dispatch = useDispatch();
    const [liveCoinsById, setLiveCoinsById] = useState({});

    useEffect(() => {
        dispatch(getUserAssets(localStorage.getItem("jwt")));
    }, [dispatch])

    useEffect(() => {
        const coinIds = [...new Set(asset.userAssets.map(item => item.coin?.id).filter(Boolean))];
        if (coinIds.length === 0) return;

        let isActive = true;
        const jwt = localStorage.getItem("jwt");

        api.get("/coins/markets", {
            params: { ids: coinIds.join(",") },
            headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
        }).then(({ data }) => {
            if (isActive) {
                setLiveCoinsById(Object.fromEntries(data.map(coin => [coin.id, coin])));
            }
        }).catch(error => {
            console.error("Could not load live portfolio market data", error);
            if (isActive) setLiveCoinsById({});
        });

        return () => {
            isActive = false;
        };
    }, [asset.userAssets]);

    const changeClass = (value) => {
        if (value == null || !Number.isFinite(Number(value))) return "text-muted-foreground";
        return Number(value) >= 0 ? "text-green-600" : "text-red-600";
    };

    const formatPriceChange = (value, direction) => {
        if (value == null || !Number.isFinite(Number(value))) return "—";

        const roundedChange = Number(Number(value).toFixed(5));
        const sign = Number(direction) > 0 ? "+" : Number(direction) < 0 ? "-" : "";
        return `${sign}₹${Math.abs(roundedChange).toLocaleString("en-IN", {
            maximumFractionDigits: 5,
        })}`;
    };

    const formatPriceChangePercentage = (value) => {
        if (value == null || !Number.isFinite(Number(value))) return "—";

        const roundedPercentage = Number(Number(value).toFixed(2));
        const sign = roundedPercentage > 0 ? "+" : roundedPercentage < 0 ? "-" : "";
        return `${sign}${Math.abs(roundedPercentage).toFixed(2)}%`;
    };

    return (
        < div className="lg:px-20 px-5 pb-7 pt-10">
            <h1 className="font-bold text-3xl">Portfolio</h1>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Asset</TableHead>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Price change</TableHead>
                        <TableHead>Price change %</TableHead>
                        <TableHead className="text-right">Volume</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {asset.userAssets.map((item) => {
                        const liveCoin = liveCoinsById[item.coin.id];
                        const priceChangePercentage = liveCoin?.price_change_percentage_24h;
                        const currentPrice = Number(liveCoin?.current_price);
                        const priceChange = Number.isFinite(currentPrice) && priceChangePercentage != null
                            ? currentPrice * Number(priceChangePercentage) / 100
                            : null;
                        const priceChangeClass = changeClass(priceChangePercentage);

                        return (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium flex items-center gap-2">
                                    <Avatar className="-z-50">
                                        <AvatarImage src={item.coin.image} alt={item.coin.name} />
                                    </Avatar>
                                    <span>{item.coin.name}</span>
                                </TableCell>
                                <TableCell>{item.coin.symbol.toUpperCase()}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell className={priceChangeClass}>
                                    {priceChange == null ? "—" : formatPriceChange(priceChange, priceChangePercentage)}
                                </TableCell>
                                <TableCell className={priceChangeClass}>
                                    {formatPriceChangePercentage(priceChangePercentage)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {formatIndianNumber(liveCoin?.total_volume ?? item.coin.total_volume, 0)}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div >
    )
}
export default Portfolio;