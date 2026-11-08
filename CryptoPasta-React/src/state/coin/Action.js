import { FETCH_COIN_BY_ID_FAILURE, FETCH_COIN_BY_ID_REQUEST, FETCH_COIN_BY_ID_SUCCESS, FETCH_COIN_DETAILS_FAILURE, FETCH_COIN_DETAILS_REQUEST, FETCH_COIN_DETAILS_SUCCESS, FETCH_COIN_LIST_FAILURE, FETCH_COIN_LIST_REQUEST, FETCH_COIN_LIST_SUCCESS, FETCH_MARKET_CHART_FAILURE, FETCH_MARKET_CHART_REQUEST, FETCH_MARKET_CHART_SUCCESS, FETCH_TOP_50_COINS_FAILURE, FETCH_TOP_50_COINS_REQUEST, FETCH_TOP_50_COINS_SUCCESS, SEARCH_COIN_FAILURE, SEARCH_COIN_REQUEST, SEARCH_COIN_SUCCESS } from "./ActionType";
import api from "@/config/app";

const getAuthConfig = (jwt = localStorage.getItem("jwt")) => ({
    headers: jwt ? { Authorization: `Bearer ${jwt}` } : {}
});

export const getCoinList = (page) => async (dispatch) => {
    dispatch({ type: FETCH_COIN_LIST_REQUEST });

    try {
        const { data } = await api.get(`/coins?page=${page}`, getAuthConfig());
        console.log("coin list", data);

        dispatch({ type: FETCH_COIN_LIST_SUCCESS, payload: data });
    } catch (error) {
        dispatch({ type: FETCH_COIN_LIST_FAILURE, payload: error.message });
        console.log(error);
    }
};

export const getTop50CoinList = ({ signal } = {}) => async (dispatch) => {
    dispatch({ type: FETCH_TOP_50_COINS_REQUEST });
    try {
        const response = await api.get("/coins/top50", {
            ...getAuthConfig(),
            signal,
        });
        dispatch({ type: FETCH_TOP_50_COINS_SUCCESS, payload: response.data });
    } catch (error) {
        if (error.code !== "ERR_CANCELED") {
            dispatch({ type: FETCH_TOP_50_COINS_FAILURE, payload: error.message });
        }
    }
};

export const fetchMarketChart = ({ coinId, days, jwt, signal }) => async (dispatch) => {
    dispatch({ type: FETCH_MARKET_CHART_REQUEST, payload: { coinId } });
    try {
        const response = await api.get(`/coins/${coinId}/chart`, {
            ...getAuthConfig(jwt),
            params: { days },
            signal,
        });
        dispatch({
            type: FETCH_MARKET_CHART_SUCCESS,
            payload: { ...response.data, coinId },
        });
    } catch (error) {
        if (error.code !== "ERR_CANCELED") {
            dispatch({
                type: FETCH_MARKET_CHART_FAILURE,
                payload: { coinId, error: error.message },
            });
        }
    }
};

export const fetchCoinMarketData = (coinId, signal) => async () => {
    const response = await api.get("/coins/markets", {
        ...getAuthConfig(),
        params: { ids: coinId },
        signal,
    });
    return response.data?.[0] ?? null;
};

export const fetchCoinById = (coinId) => async (dispatch) => {
    dispatch({ type: FETCH_COIN_BY_ID_REQUEST });
    try {
        const response = await api.get(`/coins/${coinId}`, getAuthConfig());
        dispatch({ type: FETCH_COIN_BY_ID_SUCCESS, payload: response.data });
        console.log("coin by id", response.data)
    } catch (error) {
        console.log("error", error)
        dispatch({ type: FETCH_COIN_BY_ID_FAILURE, payload: error.message });
    }
};

export const fetchCoinDetails = ({ coinId, jwt }) => async (dispatch) => {
    dispatch({ type: FETCH_COIN_DETAILS_REQUEST });
    try {
        const response = await api.get(`/coins/details/${coinId}`, getAuthConfig(jwt));
        dispatch({ type: FETCH_COIN_DETAILS_SUCCESS, payload: response.data });
        console.log("coin details", response.data)
    } catch (error) {
        console.log("error", error)
        dispatch({ type: FETCH_COIN_DETAILS_FAILURE, payload: error.message });
    }
};

export const searchCoin = (keyword) => async (dispatch) => {
    dispatch({ type: SEARCH_COIN_REQUEST });
    try {
        const response = await api.get("/coins/search", {
            ...getAuthConfig(),
            params: { q: keyword },
        });
        dispatch({ type: SEARCH_COIN_SUCCESS, payload: response.data });
        return { coins: response.data?.coins ?? [] };
    } catch (error) {
        const responseData = error.response?.data;
        const message = typeof responseData === "string"
            ? responseData
            : responseData?.detail ?? responseData?.message ?? error.message;
        dispatch({ type: SEARCH_COIN_FAILURE, payload: message });
        return { error: message };
    }
};