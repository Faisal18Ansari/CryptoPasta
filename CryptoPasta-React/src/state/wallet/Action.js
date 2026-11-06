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
    ({ jwt, orderId, paymentId, navigate }) =>
        async (dispatch) => {
            dispatch({ type: types.DEPOSIT_MONEY_REQUEST });

            try {
                const response = await api.put(`/api/wallet/deposit`, null, {
                    params: {
                        order_id: orderId,
                        payment_id: paymentId,
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
                dispatch({
                    type: types.DEPOSIT_MONEY_FAILURE,
                    error: error.message,
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
        console.log("error", error);
        dispatch({
            type: types.DEPOSIT_MONEY_FAILURE,
            error: error.message
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
                dispatch({
                    type: types.TRANSFER_MONEY_FAILURE,
                    error: error.message
                });
            }
        };
