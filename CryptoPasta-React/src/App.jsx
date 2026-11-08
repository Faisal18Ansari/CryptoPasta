// import { useState } from 'react'
// import heroImg from './assets/hero.png'
// import reactLogo from './assets/react.svg'
// import viteLogo from './assets/vite.svg'
// import './App.css'
import Navbar from "./page/navbar/Navbar"
import Home from "./page/home/Home"
import Portfolio from "./page/portfolio/Portfolio"
import Activity from "./page/activity/Activity"
import Wallet from "./page/wallet/Wallet"
import Withdrawal from "./page/withdrawal/Withdrawal"
import PaymentDetails from "./page/paymentDetails/PaymentDetails"
import StockDetails from "./page/stockDetails/StockDetails"
import Watchlist from "./page/watchlist/Watchlist"
import Profile from "./page/profile/Profile"
import WithdrawalAdmin from "./page/admin/WithdrawalAdmin"
import SearchCoin from "./page/search/SearchCoin"
import NotFound from "./page/notfound/NotFound"
import { Route, Routes } from "react-router-dom";
import Auth from "./page/auth/Auth"
import { useDispatch, useSelector } from "react-redux"
import { store } from "./state/Store"
import { useEffect } from "react"
import { getUser } from "./state/auth/Action"
function App() {
  // const [count, setCount] = useState(0)
  const { auth } = useSelector(store => store);
  const dispatch = useDispatch();
  useEffect(() => {
    const jwt = auth.jwt || localStorage.getItem("jwt");

    if (!jwt) return;

    dispatch(getUser(jwt));
  }, [auth.jwt, dispatch]);
  return (
    <>
      {auth.user ? <div>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/withdrawal" element={<Withdrawal />} />
          <Route path="/payment-details" element={<PaymentDetails />} />
          <Route path="/market/:id" element={<StockDetails />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/profile" element={<Profile />} />
          <Route
            path="/admin/withdrawals"
            element={auth.user?.userRole === "ROLE_ADMIN" ? <WithdrawalAdmin /> : <NotFound />}
          />
          <Route path="/search" element={<SearchCoin />} />
          <Route path="/*" element={<NotFound />} />
        </Routes>
      </div> : <Auth />}
    </>
  )
}

export default App
