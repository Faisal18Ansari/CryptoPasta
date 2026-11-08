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
                <Table className="table-fixed">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[25%]">Coin</TableHead>
                            <TableHead className="w-[8%]">Symbol</TableHead>
                            <TableHead className="w-[18%]">Volume</TableHead>
                            <TableHead className="w-[19%]">Market Cap</TableHead>
                            <TableHead className="w-[12%]">24Hr</TableHead>
                            <TableHead className="w-[18%] text-right">Price</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {coin.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No coins to display in this category.
                                </TableCell>
                            </TableRow>
                        ) : coin.map((item) => (
                            <TableRow
                                key={item.id}
                                onClick={() => handleCoinClick(item)}
                                className={selectedCoinId === item.id ? "cursor-pointer bg-muted/50" : "cursor-pointer"}
                            >
                                <TableCell className="overflow-hidden">
                                    <div className="flex min-w-0 items-center gap-2 font-medium">
                                        <Avatar className="size-8 shrink-0">
                                            <AvatarImage src={item.image} alt="" />
                                        </Avatar>
                                        <span className="truncate" title={item.name}>{item.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="overflow-hidden text-ellipsis" title={item.symbol}>
                                    {item.symbol}
                                </TableCell>
                                <TableCell className="overflow-hidden">
                                    <span className="block truncate" title={formatIndianNumber(item.total_volume, 0)}>
                                        {formatIndianNumber(item.total_volume, 0)}
                                    </span>
                                </TableCell>
                                <TableCell className="overflow-hidden">
                                    <span className="block truncate" title={formatIndianNumber(item.market_cap, 0)}>
                                        {formatIndianNumber(item.market_cap, 0)}
                                    </span>
                                </TableCell>
                                <TableCell className={`overflow-hidden text-ellipsis ${Number(item.price_change_percentage_24h) >= 0 ? "text-green-600" : "text-red-600"}`}>
                                    {item.price_change_percentage_24h == null
                                        ? "—"
                                        : `${Number(item.price_change_percentage_24h) >= 0 ? "+" : ""}${Number(item.price_change_percentage_24h).toFixed(2)}%`}
                                </TableCell>
                                <TableCell className="overflow-hidden">
                                    <div className="flex items-center justify-end gap-1">
                                        <IndianRupee className="size-4 shrink-0" />
                                        <span className="truncate" title={formatIndianNumber(item.current_price, 2)}>
                                            {formatIndianNumber(item.current_price, 2)}
                                        </span>
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