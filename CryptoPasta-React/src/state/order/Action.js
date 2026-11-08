import api from '@/config/app';
import * as types from './ActionType'

const getAuthConfig = (jwt = localStorage.getItem('jwt')) => ({
    headers: jwt ? { Authorization: `Bearer ${jwt}` } : {}
});

export const payOrder = ({ jwt, orderData, amount }) => async (dispatch) => {
    dispatch({ type: types.PAY_ORDER_REQUEST });
    try {
        const response = await api.post('/api/orders/pay', orderData, getAuthConfig(jwt));
        dispatch({
            type: types.PAY_ORDER_SUCCESS,
            payload: response.data,
            amount
        });
        console.log("Order Success", response.data);
        return response.data;
    } catch (error) {
        const responseData = error.response?.data;
        const message =
            responseData?.detail ??
            responseData?.message ??
            error.message ??
            "Order failed.";

        dispatch({
            type: types.PAY_ORDER_FAILURE,
            error: message,
        });

        return null;
    }
};

export const getAllOrdersForUser = ({ jwt, orderType, assetSymbol }) => async (dispatch) => {
    dispatch({ type: types.GET_ALL_ORDERS_REQUEST });
    try {
        const response = await api.get('/api/orders', {
            ...getAuthConfig(jwt),
            params: {
                order_type: orderType,
                asset_symbol: assetSymbol,
            },
        });
        dispatch({
            type: types.GET_ALL_ORDERS_SUCCESS,
            payload: response.data,
        });
        console.log("order Success", response.data)
    } catch (error) {
        console.log("error", error)
        dispatch({
            type: types.GET_ALL_ORDERS_FAILURE,
            error: error.message,
        });
    }
};

