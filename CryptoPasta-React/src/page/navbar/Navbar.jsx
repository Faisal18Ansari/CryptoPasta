import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Search } from "lucide-react";
import Sidebar from "./Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSelector } from "react-redux";
const Navbar = () => {
    const { auth } = useSelector(store => store);

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
                    <SheetContent className=" !w-[296px] !max-w-[296px] flex flex-col justify-start border-r-0 px-6 pt-10 pb-4 [&>button]:top-5 [&>button]:right-5" side="left">
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
                    <Button variant="outline" className="flex items-center gap-5">
                        <Search />
                        <span>Search</span>
                    </Button>
                </div>
            </div>
            <div>
                <Avatar className="mr-3">
                    <AvatarFallback>{auth.user?.fullName[0].toUpperCase()}</AvatarFallback>
                </Avatar>
            </div>
        </div>
    )
}
export default Navbar