import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { IndianRupee } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatIndianNumber } from "@/lib/utils";
const AssetTable = ({ coin = [], category, selectedCoinId, onSelectCoin }) => {

    const navigate = useNavigate();
    const lastClickedCoinId = React.useRef(null);

    const handleCoinClick = (item) => {
        if (lastClickedCoinId.current === item.id) {
            lastClickedCoinId.current = null;
            navigate(`/market/${item.id}`);
            return;
        }

        lastClickedCoinId.current = item.id;
        onSelectCoin(item);

        setTimeout(() => {
            if (lastClickedCoinId.current === item.id) {
                lastClickedCoinId.current = null;
            }
        }, 350);
    };

    return (
        <div className="px-4">
            <ScrollArea className={`${category === "all" ? "h-[74vh]" : "h-[82vh]"}`}>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Coin</TableHead>
                            <TableHead>Symbol</TableHead>
                            <TableHead>Volume</TableHead>
                            <TableHead>Market Cap</TableHead>
                            <TableHead>24Hr</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {coin.map((item) => (
                            <TableRow
                                key={item.id}
                                onClick={() => handleCoinClick(item)}
                                className={selectedCoinId === item.id ? "cursor-pointer bg-muted/50" : "cursor-pointer"}
                            >
                                <TableCell className="font-medium flex items-center gap-2">
                                    <Avatar className="-z-50">
                                        <AvatarImage src={item.image} alt="Coin Avatar Image" />
                                    </Avatar>
                                    <span>{item.name}</span>
                                </TableCell>
                                <TableCell>{item.symbol}</TableCell>
                                <TableCell>{formatIndianNumber(item.total_volume, 0)}</TableCell>
                                <TableCell>{formatIndianNumber(item.market_cap, 0)}</TableCell>
                                <TableCell className={Number(item.price_change_percentage_24h) >= 0 ? "text-green-600" : "text-red-600"}>
                                    {item.price_change_percentage_24h == null
                                        ? "—"
                                        : `${Number(item.price_change_percentage_24h) >= 0 ? "+" : ""}${Number(item.price_change_percentage_24h).toFixed(2)}%`}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-end gap-1">
                                        <IndianRupee className="size-4" />
                                        <span>{formatIndianNumber(item.current_price, 2)}</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </ScrollArea>
        </div>
    )
}
export default AssetTable;