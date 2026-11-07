import { ActivityIcon, BookmarkIcon, CreditCardIcon, HomeIcon, LandmarkIcon, LayoutDashboardIcon, PersonStandingIcon, ShieldCheckIcon, SquareArrowRightExitIcon, WalletIcon } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { SheetClose } from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";
import { logout } from "@/state/auth/Action";
import { useDispatch, useSelector } from "react-redux";
const menu = [
    {
        name: "Home", path: "/", icon: <HomeIcon className="h-6 w-6" />
    },
    {
        name: "Portfolio", path: "/portfolio", icon: <LayoutDashboardIcon className="h-6 w-6" />
    },
    {
        name: "Watchlist", path: "/watchlist", icon: <BookmarkIcon className="h-6 w-6" />
    },
    {
        name: "Activity", path: "/activity", icon: <ActivityIcon className="h-6 w-6" />
    },
    {
        name: "Wallet", path: "/wallet", icon: <WalletIcon className="h-6 w-6" />
    },
    {
        name: "Payment Details", path: "/payment-details", icon: <LandmarkIcon className="h-6 w-6" />
    },
    {
        name: "Withdrawal", path: "/withdrawal", icon: <CreditCardIcon className="h-6 w-6" />
    },
    {
        name: "Admin Withdrawals", path: "/admin/withdrawals", adminOnly: true, icon: <ShieldCheckIcon className="h-6 w-6" />
    },
    {
        name: "Profile", path: "/profile", icon: <PersonStandingIcon className="h-6 w-6" />
    },
    {
        name: "Logout", path: "/", icon: <SquareArrowRightExitIcon className="h-6 w-6" />
    }
];
const Sidebar = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isAdmin = useSelector(state => state.auth.user?.userRole === "ROLE_ADMIN");
    const visibleMenu = menu.filter(item => !item.adminOnly || isAdmin);
    const handleLogout = () => {
        dispatch(logout())
    }
    return (
        <div className="mt-8 min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-0 pb-2">
            {visibleMenu.map((item) => (
                <div key={item.name}>
                    <SheetClose asChild>
                        <Button variant="outline" onClick={() => {
                            navigate(item.path)
                            if (item.name == "Logout") {
                                handleLogout()
                            }
                        }} className="flex items-center gap-5 py-6 w-full">
                            <span className="w-5">
                                {item.icon}
                            </span>
                            <p className="text-lg font-semibold">{item.name}</p>
                        </Button>
                    </SheetClose>
                </div>
            ))}
            {/* <div>
                <SheetClose asChild>
                    <Button variant="outline" className="flex items-center gap-5 py-6 w-full">
                        <span className="w-5"><HomeIcon className="size-5" /></span>
                        <p className="text-lg font-semibold">Home</p>
                    </Button>
                </SheetClose>
            </div> */}
        </div>
    )
}
export default Sidebar