import React, { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, Search } from "lucide-react";
import Sidebar from "./Sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "@/config/app";

const getSearchErrorMessage = (error) => {
    const responseData = error.response?.data;
    if (typeof responseData === "string") return responseData;
    return responseData?.detail ?? responseData?.message ?? error.message ?? "Coin search failed.";
};

const Navbar = () => {
    const { auth } = useSelector(store => store);
    const navigate = useNavigate();
    const searchRequestSequence = useRef(0);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const initials = auth.user?.fullName?.trim()?.[0]
        ?? auth.user?.email?.trim()?.[0]
        ?? "?";

    useEffect(() => {
        const query = searchQuery.trim();
        if (!searchOpen || query.length < 2) {
            return undefined;
        }

        const controller = new AbortController();
        const timeoutId = window.setTimeout(async () => {
            const search = async () => {
                try {
                    const response = await api.get("/coins/search", {
                        params: { q: query },
                        signal: controller.signal,
                    });
                    if (!controller.signal.aborted) {
                        setSearchResults(response.data?.coins ?? []);
                    }
                } catch (error) {
                    if (error.code !== "ERR_CANCELED") {
                        setSearchError(getSearchErrorMessage(error));
                        setSearchResults([]);
                    }
                } finally {
                    if (!controller.signal.aborted) {
                        setSearchLoading(false);
                    }
                }
            };
            search();
        }, 300);

        return () => {
            window.clearTimeout(timeoutId);
            controller.abort();
        };
    }, [searchOpen, searchQuery]);

    const handleSearchOpenChange = (open) => {
        setSearchOpen(open);
        if (!open) {
            setSearchQuery("");
            setSearchResults([]);
            setSearchError(null);
            setSearchLoading(false);
        }
    };

    const handleSearchQueryChange = (event) => {
        const value = event.target.value;
        setSearchQuery(value);
        setSearchResults([]);
        setSearchError(null);
        setSearchLoading(value.trim().length >= 2);
    };

    const handleSelectCoin = (coin) => {
        handleSearchOpenChange(false);
        setSearchQuery("");
        searchRequestSequence.current += 1;
        navigate("/", {
            state: {
                selectedCoinId: coin.id,
                searchRequestId: searchRequestSequence.current,
            },
        });
    };

    return (
        <div className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-border bg-background px-2 py-3">
            <div className="flex items-center gap-3">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full h-14 w-14">
                            <Menu className="size-7" />
                            <span className="sr-only">Open navigation menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="!w-[296px] !max-w-[296px] flex min-h-0 flex-col justify-start overflow-hidden border-r-0 px-6 pt-10 pb-4 [&>button]:top-5 [&>button]:right-5" side="left">
                        <SheetHeader className="p-0">
                            <SheetTitle>
                                <div className="flex items-center justify-center gap-0">
                                    <img
                                        src="/Crypto-Pasta.png"
                                        alt="Crypto Pasta logo"
                                        className="h-12 w-auto object-contain"
                                    />
                                    <div className="text-3xl">
                                        <span className="font-bold text-chart-4">Crypto</span>
                                        <span>Pasta</span>
                                    </div>
                                </div>
                            </SheetTitle>
                        </SheetHeader>
                        <Sidebar />
                    </SheetContent>
                </Sheet>
                <p className="text-sm lg:text-base cursor-pointer">
                    CryptoPasta
                </p>
                <div className="p-0 ml-9">
                    <Button
                        type="button"
                        variant="outline"
                        className="flex items-center gap-3"
                        onClick={() => setSearchOpen(true)}
                    >
                        <Search />
                        <span>Search</span>
                    </Button>
                </div>
            </div>
            <div>
                <Avatar className="mr-3">
                    <AvatarFallback>{initials.toUpperCase()}</AvatarFallback>
                </Avatar>
            </div>
            <Dialog open={searchOpen} onOpenChange={handleSearchOpenChange}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Search coins</DialogTitle>
                        <DialogDescription>
                            Search by coin name or symbol, then select a result to view its market data and chart.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        autoFocus
                        type="search"
                        value={searchQuery}
                        onChange={handleSearchQueryChange}
                        placeholder="Try Bitcoin or BTC"
                        aria-label="Search by coin name or symbol"
                    />
                    <div className="max-h-80 space-y-1 overflow-y-auto">
                        {searchQuery.trim().length < 2 && (
                            <p className="py-4 text-center text-sm text-muted-foreground">
                                Enter at least two characters.
                            </p>
                        )}
                        {searchLoading && (
                            <p role="status" className="py-4 text-center text-sm text-muted-foreground">
                                Searching coins…
                            </p>
                        )}
                        {searchError && (
                            <p role="alert" className="py-4 text-center text-sm text-destructive">
                                {searchError}
                            </p>
                        )}
                        {!searchLoading && !searchError && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                            <p className="py-4 text-center text-sm text-muted-foreground">
                                No matching coins found.
                            </p>
                        )}
                        {searchResults.slice(0, 10).map((coin) => (
                            <Button
                                key={coin.id}
                                type="button"
                                variant="ghost"
                                className="h-auto w-full justify-start gap-3 px-2 py-2 text-left"
                                onClick={() => handleSelectCoin(coin)}
                            >
                                <img
                                    src={coin.thumb}
                                    alt=""
                                    className="size-8 rounded-full"
                                    loading="lazy"
                                />
                                <span className="min-w-0 flex-1 truncate">{coin.name}</span>
                                <span className="shrink-0 text-muted-foreground">
                                    {coin.symbol?.toUpperCase()}
                                </span>
                                {coin.market_cap_rank && (
                                    <span className="shrink-0 text-xs text-muted-foreground">
                                        #{coin.market_cap_rank}
                                    </span>
                                )}
                            </Button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
export default Navbar