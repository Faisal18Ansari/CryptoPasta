import { thunk } from "redux-thunk";
import authReducer from "./auth/Reducer";

import { combineReducers, legacy_createStore, applyMiddleware } from "redux";
import coinReducer from "./coin/Reducer";
import walletReducer from "./wallet/Reducer";
import withdrawalReducer from "./withdrawal/Reducer";
import orderReducer from "./order/Reducer";
import assetReducer from "./asset/Reducer";
import watchlistReducer from "./watchlist/Reducer";
import { LOGOUT } from "./auth/ActionType";

const combinedReducer = combineReducers({
    auth: authReducer,
    coin: coinReducer,
    wallet: walletReducer,
    withdrawal: withdrawalReducer,
    order: orderReducer,
    asset: assetReducer,
    watchlist: watchlistReducer
});

const rootReducer = (state, action) => {
    if (action.type === LOGOUT) {
        state = undefined;
    }

    return combinedReducer(state, action);
};

export const store = legacy_createStore(rootReducer, applyMiddleware(thunk));