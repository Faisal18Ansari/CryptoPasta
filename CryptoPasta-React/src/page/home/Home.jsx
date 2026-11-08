import React, { useEffect, useMemo, useState } from "react";
import { DotIcon, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import AssetTable from "./AssetTable";
import StockChart from "./StockChart";
import ChatbotWidget from "./ChatbotWidget";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { getCoinList, getTop50CoinList, fetchCoinMarketData } from "@/state/coin/Action";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

const TOP_MOVERS_REFRESH_INTERVAL_MS = 60_000;

const Home = () => {
    const [category, setCategory] = useState("all");
    const [page, setPage] = useState(1);
    const [selectedCoinId, setSelectedCoinId] = useState(null);
    const [searchSelectedCoin, setSearchSelectedCoin] = useState(null);
    const [searchSelectionError, setSearchSelectionError] = useState(null);
    const { coin, auth } = useSelector((state) => state);
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();
    const requestedSearchCoinId = location.state?.selectedCoinId;
    const searchRequestId = location.state?.searchRequestId;
    const activeCategory = requestedSearchCoinId ? "search" : category;

    const topGainers = useMemo(
        () => coin.top50
            .filter((item) => item.price_change_percentage_24h != null
                && Number.isFinite(Number(item.price_change_percentage_24h))
                && Number(item.price_change_percentage_24h) > 0)
            .slice()
            .sort((left, right) =>
                Number(right.price_change_percentage_24h) - Number(left.price_change_percentage_24h))
            .slice(0, 20),
        [coin.top50]
    );
    const topLosers = useMemo(
        () => coin.top50
            .filter((item) => item.price_change_percentage_24h != null
                && Number.isFinite(Number(item.price_change_percentage_24h))
                && Number(item.price_change_percentage_24h) < 0)
            .slice()
            .sort((left, right) =>
                Number(left.price_change_percentage_24h) - Number(right.price_change_percentage_24h))
            .slice(0, 20),
        [coin.top50]
    );
    const activeCoinList = useMemo(() => {
        if (activeCategory === "all") return coin.coinList;
        if (activeCategory === "top50") return coin.top50;
        if (activeCategory === "topGainers") return topGainers;
        if (activeCategory === "topLosers") return topLosers;
        if (activeCategory === "search"
            && searchSelectedCoin?.coinId === requestedSearchCoinId
            && searchSelectedCoin?.requestId === searchRequestId) {
            const refreshedCoin = coin.top50.find((item) => item.id === searchSelectedCoin.coin.id);
            return [refreshedCoin ?? searchSelectedCoin.coin];
        }
        return [];
    }, [activeCategory, coin.coinList, coin.top50, requestedSearchCoinId, searchRequestId, searchSelectedCoin, topGainers, topLosers]);
    const selectedCoin = activeCoinList.find((item) => item.id === selectedCoinId)
        ?? activeCoinList[0]
        ?? null;
    const activeSelectedCoinId = selectedCoin?.id ?? null;
    const searchSelectionLoading = Boolean(
        requestedSearchCoinId
        && (searchSelectedCoin?.coinId !== requestedSearchCoinId
            || searchSelectedCoin?.requestId !== searchRequestId)
        && (searchSelectionError?.coinId !== requestedSearchCoinId
            || searchSelectionError?.requestId !== searchRequestId)
    );
    const visibleSearchSelectionError = requestedSearchCoinId
        && searchSelectionError?.coinId === requestedSearchCoinId
        && searchSelectionError?.requestId === searchRequestId
        ? searchSelectionError.message
        : null;

    const handleCategory = (value) => {
        setCategory(value);
        setPage(1);
        if (location.state?.selectedCoinId) {
            navigate("/", { replace: true, state: null });
        }
    };

    const handlePageChange = (event, nextPage) => {
        event.preventDefault();
        if (nextPage < 1 || nextPage === page) return;
        if (nextPage > page && coin.coinList.length < 10) return;
        setPage(nextPage);
    };

    useEffect(() => {
        const controller = new AbortController();
        let timeoutId;
        const shouldPoll = activeCategory === "top50"
            || activeCategory === "topGainers"
            || activeCategory === "topLosers";
        const refreshTop50 = async () => {
            await dispatch(getTop50CoinList({ signal: controller.signal }));
            if (shouldPoll && !controller.signal.aborted) {
                timeoutId = window.setTimeout(refreshTop50, TOP_MOVERS_REFRESH_INTERVAL_MS);
            }
        };
        refreshTop50();

        return () => {
            window.clearTimeout(timeoutId);
            controller.abort();
        };
    }, [dispatch, activeCategory]);

    useEffect(() => {
        dispatch(getCoinList(page));
    }, [dispatch, page]);

    useEffect(() => {
        const coinId = requestedSearchCoinId;
        if (!coinId) return undefined;

        const controller = new AbortController();

        dispatch(fetchCoinMarketData(coinId, controller.signal))
            .then((marketCoin) => {
                if (!controller.signal.aborted) {
                    if (!marketCoin) {
                        setSearchSelectionError({
                            coinId,
                            requestId: searchRequestId,
                            message: "No current market data was returned for that coin.",
                        });
                        return;
                    }
                    setSearchSelectedCoin({ coinId, requestId: searchRequestId, coin: marketCoin });
                }
            })
            .catch((error) => {
                if (!controller.signal.aborted) {
                    setSearchSelectionError({
                        coinId,
                        requestId: searchRequestId,
                        message: error.response?.data?.message
                            ?? error.message
                            ?? "Unable to load current market data for this coin.",
                    });
                }
            });

        return () => controller.abort();
    }, [dispatch, requestedSearchCoinId, searchRequestId]);

    const pageNumbers = page <= 3
        ? [1, 2, 3]
        : [1, page - 1, page, page + 1];
    const selectedPrice = Number(selectedCoin?.current_price ?? 0);
    const selectedPriceChange = Number(selectedCoin?.price_change_percentage_24h ?? 0);
    const priceChangeIsPositive = selectedPriceChange >= 0;
    const categoryLabel = activeCategory === "topGainers"
        ? "Top Gainers"
        : activeCategory === "topLosers"
            ? "Top Losers"
            : "Top 50";

    return (
        <div className="relative min-w-0">
            <div className="lg:flex">
                <div className="min-w-0 lg:w-[55%] lg:border-r">
                    <div className="ml-1 flex flex-wrap items-center gap-3 p-3">
                        <Button onClick={() => handleCategory("all")} variant={activeCategory === "all" ? "default" : "outline"} className="rounded-full">
                            All
                        </Button>
                        <Button onClick={() => handleCategory("top50")} variant={activeCategory === "top50" ? "default" : "outline"} className="rounded-full">
                            Top 50
                        </Button>
                        <Button onClick={() => handleCategory("topGainers")} variant={activeCategory === "topGainers" ? "default" : "outline"} className="rounded-full">
                            Top Gainers
                        </Button>
                        <Button onClick={() => handleCategory("topLosers")} variant={activeCategory === "topLosers" ? "default" : "outline"} className="rounded-full">
                            Top Losers
                        </Button>
                    </div>
                    {activeCategory === "search" && selectedCoin && (
                        <div className="flex items-center justify-between gap-3 px-5 pb-3 text-sm">
                            <p className="min-w-0 truncate">
                                Search result: <span className="font-medium">{selectedCoin.name}</span>
                                {" "}({selectedCoin.symbol?.toUpperCase()})
                            </p>
                            <Button variant="ghost" size="sm" onClick={() => handleCategory("all")}>
                                Clear search
                            </Button>
                        </div>
                    )}
                    {searchSelectionLoading && (
                        <p role="status" className="px-5 pb-3 text-sm text-muted-foreground">
                            Loading current market data…
                        </p>
                    )}
                    {visibleSearchSelectionError && (
                        <p role="alert" className="px-5 pb-3 text-sm text-destructive">
                            {visibleSearchSelectionError}
                        </p>
                    )}
                    {coin.top50Error && activeCategory !== "all" && activeCategory !== "search" && (
                        <p role="alert" className="px-5 pb-3 text-sm text-destructive">
                            Market movers could not be refreshed: {coin.top50Error}
                        </p>
                    )}
                    <AssetTable
                        coin={activeCoinList}
                        category={activeCategory}
                        selectedCoinId={activeSelectedCoinId}
                        onSelectCoin={(item) => setSelectedCoinId(item.id)}
                    />
                    {activeCategory === "all" && (
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
                    )}
                    {(activeCategory === "top50" || activeCategory === "topGainers" || activeCategory === "topLosers") && (
                        <p className="px-5 pt-2 text-xs text-muted-foreground">
                            {activeCategory === "top50"
                                ? "Top 50 coins by market capitalization."
                                : `Top 20 ${categoryLabel.toLowerCase()} by 24-hour price change, ranked within the current top 50.`}
                        </p>
                    )}
                </div>
                <div className="hidden min-w-0 p-5 lg:block lg:w-[45%]">
                    <StockChart coinId={activeSelectedCoinId} />
                    {selectedCoin && (
                        <div className="flex min-w-0 items-center gap-5">
                            <Avatar>
                                <AvatarImage src={selectedCoin.image} alt="" />
                            </Avatar>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <p>{selectedCoin.symbol?.toUpperCase()}</p>
                                    <DotIcon className="shrink-0 text-gray-400" />
                                    <p className="truncate text-chart-4">{selectedCoin.name}</p>
                                </div>
                                <div className="mt-1 flex flex-wrap items-end gap-2">
                                    <p className="flex items-center text-xl font-bold">
                                        <IndianRupee className="mr-1 size-4" />
                                        {selectedPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                                    </p>
                                    <p className={priceChangeIsPositive ? "text-green-600" : "text-red-600"}>
                                        {selectedCoin.price_change_percentage_24h == null
                                            ? "—"
                                            : `${selectedPriceChange >= 0 ? "+" : ""}${selectedPriceChange.toFixed(2)}%`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <ChatbotWidget fullName={auth.user?.fullName} />
        </div>
    );
};

export default Home;
