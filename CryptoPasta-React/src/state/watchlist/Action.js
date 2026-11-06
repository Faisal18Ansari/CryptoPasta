import api from "@/config/app";
import * as types from './ActionType'

const getAuthConfig = (jwt = localStorage.getItem("jwt")) => ({
    headers: jwt ? { Authorization: `Bearer ${jwt}` } : {}
});

export const getUserWatchlist = (jwt) => async (dispatch) => {
    dispatch({ type: types.GET_USER_WATCHLIST_REQUEST });

    try {
        const response = await api.get('/api/watchlist/user', getAuthConfig(jwt));

        dispatch({
            type: types.GET_USER_WATCHLIST_SUCCESS,
            payload: response.data,
        });
        console.log("user watchlist:", response.data);
    } catch (error) {
        console.log("error: ", error);
        dispatch({
            type: types.GET_USER_WATCHLIST_FAILURE,
            error: error.message,
        });
    }
};

export const addItemToWatchlist = ({ coinId, jwt }) => async (dispatch) => {
    dispatch({ type: types.ADD_COIN_TO_WATCHLIST_REQUEST });

    try {
        const response = await api.patch(`/api/watchlist/add/coin/${coinId}`, {}, getAuthConfig(jwt));

        dispatch({
            type: types.ADD_COIN_TO_WATCHLIST_SUCCESS,
            payload: response.data,
        });
        console.log("add coin to watchlist: ", response.data);
        return response.data;
    } catch (error) {
        console.log("error", error);
        dispatch({
            type: types.ADD_COIN_TO_WATCHLIST_FAILURE,
            error: error.message,
        });
        return null;
    }
};