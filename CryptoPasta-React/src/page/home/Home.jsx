import React, { useEffect } from "react";
import { DotIcon, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import AssetTable from "./AssetTable";
import StockChart from "./StockChart";
import ChatbotWidget from "./ChatbotWidget";
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { useDispatch, useSelector } from "react-redux";
import { getCoinList, getTop50CoinList } from "@/state/coin/Action";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
const Home = () => {
    const [category, setCategory] = React.useState("all");
    const [page, setPage] = React.useState(1);
    const [selectedCoin, setSelectedCoin] = React.useState(null);
    // const [inputValue, setInputValue] = React.useState("");
    // const [isBotReleased, setIsBotReleased] = React.useState(false);
    const { coin, auth } = useSelector(store => store);
    const dispatch = useDispatch();
    const activeCoinList = category === "all" ? coin.coinList : coin.top50;
    const selectedCoinId = selectedCoin?.id || activeCoinList[0]?.id || "bitcoin";

    const handleCategory = (value) => {
        setCategory(value);
        setPage(1);
    };
    const handlePageChange = (event, nextPage) => {
        event.preventDefault();
        if (nextPage < 1 || nextPage === page) return;
        if (nextPage > page && coin.coinList.length < 10) return;
        setPage(nextPage);
    };
    // const handleChange = (e) => {
    //     setInputValue(e.target.value);
    // };
    // const handleKeyDown = (event) => {
    //     if (event.key !== "Enter") return;
    //     // Don't fire while an IME (Hindi/Japanese keyboards etc.) is composing text
    //     if (event.nativeEvent.isComposing) return;

    //     event.preventDefault();
    //     const prompt = inputValue.trim();
    //     if (!prompt) return;

    //     console.log("Chat prompt:", prompt); // swapped for the real send action in the Redux step
    //     setInputValue("");
    // };
    // const handleBotReleased = () => {
    //     setIsBotReleased((prev) => !prev);
    // }
    useEffect(() => {
        dispatch(getTop50CoinList())
    }, [dispatch, category])
    useEffect(() => {
        dispatch(getCoinList(page))
    }, [dispatch, page])
    useEffect(() => {
        if (!activeCoinList.length) return;

        setSelectedCoin((currentCoin) => {
            if (!currentCoin || !activeCoinList.some((item) => item.id === currentCoin.id)) {
                return activeCoinList[0];
            }
            return currentCoin;
        });
    }, [activeCoinList, category]);
    const pageNumbers = page <= 3
        ? [1, 2, 3]
        : [1, page - 1, page, page + 1];

    const selectedPrice = Number(selectedCoin?.current_price ?? 0);
    const selectedPriceChange = Number(selectedCoin?.price_change_percentage_24h ?? 0);
    const priceChangeIsPositive = selectedPriceChange >= 0;

    return (
        <div className="relative">
            <div className="lg:flex">
                <div className="lg:w-[55%] lg:border-r">
                    <div className="p-3 flex items-center gap-4 ml-1">
                        <Button onClick={() => handleCategory("all")} variant={category === "all" ? "default" : "outline"} className="rounded-full">
                            All
                        </Button>
                        <Button onClick={() => handleCategory("top50")} variant={category === "top50" ? "default" : "outline"} className="rounded-full">
                            Top 50
                        </Button>
                        <Button onClick={() => handleCategory("topGainers")} variant={category === "topGainers" ? "default" : "outline"} className="rounded-full">
                            Top Gainers
                        </Button>
                        <Button onClick={() => handleCategory("topLosers")} variant={category === "topLosers" ? "default" : "outline"} className="rounded-full">
                            Top Losers
                        </Button>
                    </div>
                    <AssetTable
                        coin={category === "all" ? coin.coinList : coin.top50}
                        category={category}
                        selectedCoinId={selectedCoinId}
                        onSelectCoin={setSelectedCoin}
                    />
                    {category === "all" && <div>
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        aria-disabled={page === 1}
                                        className={page === 1 ? "pointer-events-none opacity-50" : ""}
                                        onClick={(event) => handlePageChange(event, page - 1)}
                                    />
                                </PaginationItem>
                                {pageNumbers.map((pageNumber, index) => (
                                    <React.Fragment key={pageNumber}>
                                        {index === 1 && pageNumber - pageNumbers[0] > 1 && (
                                            <PaginationItem>
                                                <PaginationEllipsis />
                                            </PaginationItem>
                                        )}
                                        <PaginationItem>
                                            <PaginationLink
                                                href="#"
                                                isActive={page === pageNumber}
                                                onClick={(event) => handlePageChange(event, pageNumber)}
                                            >
                                                {pageNumber}
                                            </PaginationLink>
                                        </PaginationItem>
                                    </React.Fragment>
                                ))}
                                <PaginationItem>
                                    <PaginationNext
                                        href="#"
                                        aria-disabled={coin.coinList.length < 10}
                                        className={coin.coinList.length < 10 ? "pointer-events-none opacity-50" : ""}
                                        onClick={(event) => handlePageChange(event, page + 1)}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>}
                </div>
                <div className="hidden lg:block lg:w-[45%] p-5">
                    <StockChart coinId={selectedCoinId} />
                    <div className="flex gap-5 items-center">
                        <div>
                            <Avatar>
                                <AvatarImage src={selectedCoin?.image || "https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1696501400"} />
                            </Avatar>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p>{(selectedCoin?.symbol || "btc").toUpperCase()}</p>
                                <DotIcon className="text-gray-400" />
                                <p className="text-chart-4">{selectedCoin?.name || "Bitcoin"}</p>
                            </div>
                            <div className="mt-1 flex items-end gap-2">
                                <p className="flex items-center text-xl font-bold">
                                    <IndianRupee className="mr-1 size-4" />
                                    {selectedPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                                </p>
                                <p className={priceChangeIsPositive ? "text-green-600" : "text-red-600"}>
                                    <span>{selectedPriceChange >= 0 ? "+" : ""}{selectedPriceChange.toFixed(2)}%</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <ChatbotWidget fullName={auth.user?.fullName} />
        </div>
    )
}

export default Home