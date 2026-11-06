import React from "react";
import "./Auth.css"
import Signup from "./Signup";
import Signin from "./Signin";
import ForgetPassword from "./ForgetPassword";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
const Auth = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const pageTitle = location.pathname === "/signup"
        ? "Create New account"
        : location.pathname === "/forgot-password"
            ? "Reset Password"
            : "Login";
    return (
        <div className='h-screen relative authContainer'>

            <div className="absolute inset-0 bg-[#030712]/30">

                <div className="bgBlur absolute top-1/2 left-1/2 z-50 flex h-[38rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-md bg-black/50 shadow-2xl shadow-chart-2">
                    <h1 className="!mb-2 pb-2 text-6xl font-bold">
                        Crypto<span className="text-chart-4">Pasta</span>
                    </h1>
                    <h2 className="mt-2 mb-6 w-full text-center text-2xl font-semibold">{pageTitle}</h2>
                    {location.pathname == "/signup" ? (
                        <section className="w-full px-4">
                            <Signup onSubmitted={() => navigate("/signin")} />
                            <div className="flex items-center justify-center gap-2">
                                <span>Already have an account?</span>
                                <Button
                                    onClick={() => navigate("/signin")}
                                    style={{ backgroundColor: "rgba(23, 21, 28, 0.7)" }}
                                    variant="ghost"
                                >
                                    Signin
                                </Button>
                            </div>
                        </section>
                    ) : location.pathname == "/forgot-password" ? (
                        <section className="w-full px-4">
                            <ForgetPassword />
                            <div className="flex items-center justify-center gap-2">
                                <span>Back to login</span>
                                <Button
                                    onClick={() => navigate("/signin")}
                                    style={{ backgroundColor: "rgba(23, 21, 28, 0.7)" }}
                                    variant="ghost"
                                >
                                    Signin
                                </Button>
                            </div>
                        </section>
                    ) : (
                        <section className="w-full px-4">
                            <Signin />
                            <div className="flex items-center justify-center gap-2">
                                <span>Don't have an account?</span>
                                <Button
                                    onClick={() => navigate("/signup")}
                                    style={{ backgroundColor: "rgba(23, 21, 28, 0.7)" }}
                                    variant="ghost"
                                >
                                    Signup
                                </Button>
                            </div>
                            <div className="mt-5 flex items-center justify-center">
                                <Button
                                    className="w-full"
                                    style={{ backgroundColor: "rgba(23, 21, 28, 0.3)" }}
                                    onClick={() => navigate("/forgot-password")}
                                    variant="outline"
                                >
                                    Forgot Password
                                </Button>
                            </div>
                        </section>
                    )}
                </div>

            </div>

        </div>
    )
}
export default Auth;