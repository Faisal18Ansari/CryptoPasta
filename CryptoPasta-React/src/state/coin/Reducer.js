import {
    FETCH_COIN_LIST_REQUEST,
    FETCH_COIN_LIST_SUCCESS,
    FETCH_COIN_LIST_FAILURE,
    FETCH_MARKET_CHART_REQUEST,
    FETCH_MARKET_CHART_SUCCESS,
    FETCH_MARKET_CHART_FAILURE,
    FETCH_COIN_BY_ID_REQUEST,
    FETCH_COIN_BY_ID_SUCCESS,
    FETCH_COIN_BY_ID_FAILURE,
    FETCH_COIN_DETAILS_REQUEST,
    FETCH_COIN_DETAILS_SUCCESS,
    FETCH_COIN_DETAILS_FAILURE,
    FETCH_TOP_50_COINS_SUCCESS,
    SEARCH_COIN_SUCCESS,
    SEARCH_COIN_FAILURE,
    SEARCH_COIN_REQUEST,
    FETCH_TOP_50_COINS_REQUEST,
    FETCH_TOP_50_COINS_FAILURE,
} from "./ActionType";

const initialState = {
    coinList: [],
    top50: [],
    top50Loading: false,
    top50Error: null,
    searchCoinList: [],
    marketChart: { data: [], loading: false },
    coinById: null,
    coinDetails: null,
    loading: false,
    error: null
};

const coinReducer = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_COIN_LIST_REQUEST:
        case FETCH_COIN_BY_ID_REQUEST:
        case FETCH_COIN_DETAILS_REQUEST:
        case SEARCH_COIN_REQUEST:
            return { ...state, loading: true, error: null };

        case FETCH_TOP_50_COINS_REQUEST:
            return { ...state, top50Loading: true, top50Error: null };

        case FETCH_MARKET_CHART_REQUEST:
            return {
                ...state,
                marketChart: {
                    loading: true,
                    data: [],
                    coinId: action.payload.coinId,
                    error: null,
                },
                error: null
            };
        case FETCH_COIN_LIST_SUCCESS:
            return {
                ...state, coinList: action.payload, loading: false, error: null
            };

        case FETCH_TOP_50_COINS_SUCCESS:
            return {
                ...state,
                top50: action.payload,
                top50Loading: false,
                top50Error: null,
            };

        case FETCH_MARKET_CHART_SUCCESS:
            if (action.payload.coinId !== state.marketChart.coinId) return state;
            return {
                ...state,
                marketChart: {
                    data: action.payload.prices,
                    loading: false,
                    coinId: action.payload.coinId,
                    error: null,
                },
            };

        case SEARCH_COIN_SUCCESS:
            return {
                ...state, searchCoinList: action.payload.coins, loading: false, error: null
            };

        case FETCH_COIN_DETAILS_SUCCESS:
            return {
                ...state, coinDetails: action.payload, loading: false, error: null
            };

        case FETCH_MARKET_CHART_FAILURE:
            if (action.payload.coinId !== state.marketChart.coinId) return state;
            return {
                ...state,
                marketChart: {
                    loading: false,
                    data: [],
                    coinId: action.payload.coinId,
                    error: action.payload.error,
                },
                error: action.payload.error
            };

        case FETCH_COIN_LIST_FAILURE:
        case SEARCH_COIN_FAILURE:
        case FETCH_COIN_BY_ID_FAILURE:
        case FETCH_COIN_DETAILS_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload
            }

        case FETCH_TOP_50_COINS_FAILURE:
            return {
                ...state,
                top50: [],
                top50Loading: false,
                top50Error: action.payload,
            };
        default:
            return state;
    }
}

export default coinReducer;