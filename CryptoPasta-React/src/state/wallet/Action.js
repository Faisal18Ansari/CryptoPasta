import api from "@/config/app";
import * as types from "./ActionType";

const getAuthConfig = (jwt) => {
    const token = jwt || localStorage.getItem("jwt");
    return {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    };
};

export const getUserWallet = (jwt) => async (dispatch) => {
    dispatch({ type: types.GET_USER_WALLET_REQUEST });
    try {
        const response = await api.get("/api/wallet", getAuthConfig(jwt));
        dispatch({
            type: types.GET_USER_WALLET_SUCCESS,
            payload: response.data,
        });
        console.log("user wallet", response.data)
    } catch (error) {
        console.log(error);
        dispatch({
            type: types.GET_USER_WALLET_FAILURE,
            error: error.message,
        });
    }
};
export const getWalletTransactions =
    ({ jwt }) =>
        async (dispatch) => {
            dispatch({ type: types.GET_WALLET_TRANSACTION_REQUEST });

            try {
                const response = await api.get("/api/transactions", getAuthConfig(jwt));

                dispatch({
                    type: types.GET_WALLET_TRANSACTION_SUCCESS,
                    payload: response.data,
                });
                console.log("wallet transaction", response.data);
            } catch (error) {
                console.log(error);
                dispatch({
                    type: types.GET_WALLET_TRANSACTION_FAILURE,
                    error: error.message,
                });
            }
        };

export const depositMoney =
    ({
        jwt,
        orderId,
        paymentId,
        paymentLinkId,
        paymentLinkReferenceId,
        paymentLinkStatus,
        signature,
        navigate,
    }) =>
        async (dispatch) => {
            dispatch({ type: types.DEPOSIT_MONEY_REQUEST });

            try {
                const response = await api.put(`/api/wallet/deposit`, null, {
                    params: {
                        order_id: orderId,
                        razorpay_payment_id: paymentId,
                        razorpay_payment_link_id: paymentLinkId,
                        razorpay_payment_link_reference_id: paymentLinkReferenceId,
                        razorpay_payment_link_status: paymentLinkStatus,
                        razorpay_signature: signature,
                    },
                    ...getAuthConfig(jwt),
                });

                dispatch({
                    type: types.DEPOSIT_MONEY_SUCCESS,
                    payload: response.data,
                });
                navigate("/wallet")
                console.log(response.data);
            } catch (error) {
                console.error(error);
                const responseData = error.response?.data;
                const message =
                    responseData?.detail ??
                    responseData?.message ??
                    error.message ??
                    "Unable to verify this payment.";

                dispatch({
                    type: types.DEPOSIT_MONEY_FAILURE,
                    error: message,
                });
            }
        };

export const paymentHandler = ({ jwt, amount, paymentMethod }) => async (dispatch) => {
    dispatch({ type: types.DEPOSIT_MONEY_REQUEST });
    try {
        const response = await api.post(
            `/api/payment/${paymentMethod}/amount/${amount}`,
            null,
            getAuthConfig(jwt)
        );
        const paymentUrl = response.data.paymentUrl;
        if (!paymentUrl) {
            throw new Error("Payment URL was missing from the server response");
        }
        window.location.href = paymentUrl;
        // window.location.href = response.data.payment_url;
        // dispatch({
        //     type: types.DEPOSIT_MONEY_SUCCESS,
        //     payload: response.data
        // });
    } catch (error) {
        const responseData = error.response?.data;
        const message =
            responseData?.detail ??
            responseData?.message ??
            error.message ??
            "Unable to start the payment.";

        dispatch({
            type: types.DEPOSIT_MONEY_FAILURE,
            error: message
        });
    }
};
export const transferMoney =
    ({ jwt, walletId, reqData }) =>
        async (dispatch) => {
            dispatch({ type: types.TRANSFER_MONEY_REQUEST });

            try {
                const response = await api.put(
                    `/api/wallet/${walletId}/transfer`,
                    reqData,
                    getAuthConfig(jwt)
                );

                dispatch({
                    type: types.TRANSFER_MONEY_SUCCESS,
                    payload: response.data,
                });
                console.log("transfer money sent", response.data);
            }
            catch (error) {
                const responseData = error.response?.data;
                const message =
                    responseData?.message ??
                    responseData?.detail ??
                    error.message ??
                    "Transfer failed.";

                dispatch({
                    type: types.TRANSFER_MONEY_FAILURE,
                    error: message,
                });
            }
        };
