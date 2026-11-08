import api from "@/config/app";
import * as types from "./ActionType";

const getAuthConfig = (jwt = localStorage.getItem("jwt")) => ({
    headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
});

const getErrorMessage = (error, fallback) => {
    const responseData = error.response?.data;
    if (typeof responseData === "string") {
        return responseData;
    }
    return responseData?.detail
        ?? responseData?.message
        ?? responseData?.title
        ?? error.message
        ?? fallback;
};

export const register = (userData) => async (dispatch) => {
    dispatch({ type: types.REGISTER_REQUEST });

    try {
        const response = await api.post("/auth/signup", userData);
        const jwt = response.data?.jwt;
        dispatch({ type: types.REGISTER_SUCCESS });

        if (!jwt) {
            return { success: true, authenticated: false };
        }

        localStorage.setItem("jwt", jwt);
        dispatch({ type: types.LOGIN_SUCCESS, payload: jwt });
        return { success: true, authenticated: true };
    } catch (error) {
        dispatch({
            type: types.REGISTER_FAILURE,
            payload: getErrorMessage(error, "Signup failed."),
        });
        return { success: false, authenticated: false };
    }
};

export const login = ({ data, navigate }) => async (dispatch) => {
    localStorage.removeItem("jwt");
    dispatch({ type: types.LOGIN_REQUEST });

    try {
        const response = await api.post("/auth/signin", data);
        const authResponse = response.data;

        if (authResponse.session && !authResponse.jwt) {
            dispatch({
                type: types.LOGIN_TWO_STEP_CHALLENGE,
                payload: authResponse.session,
            });
            return {
                requiresTwoFactor: true,
                sessionId: authResponse.session,
            };
        }

        if (!authResponse.jwt) {
            throw new Error("The server did not return an authentication token.");
        }

        localStorage.setItem("jwt", authResponse.jwt);
        dispatch({ type: types.LOGIN_SUCCESS, payload: authResponse.jwt });
        navigate("/");
        return { requiresTwoFactor: false };
    } catch (error) {
        dispatch({
            type: types.LOGIN_FAILURE,
            payload: getErrorMessage(error, "Unable to sign in."),
        });
        return null;
    }
};

export const verifyLoginOtp = ({ sessionId, otp, navigate }) => async (dispatch) => {
    dispatch({ type: types.LOGIN_TWO_STEP_REQUEST });

    try {
        const response = await api.post("/auth/two-factor/otp", {
            sessionId,
            otp,
        });
        const jwt = response.data?.jwt;
        if (!jwt) {
            throw new Error("The server did not return an authentication token.");
        }

        localStorage.setItem("jwt", jwt);
        dispatch({ type: types.LOGIN_TWO_STEP_SUCCESS, payload: jwt });
        navigate("/");
        return true;
    } catch (error) {
        dispatch({
            type: types.LOGIN_TWO_STEP_FAILURE,
            payload: getErrorMessage(error, "Unable to verify the code."),
        });
        return false;
    }
};

export const sendTwoFactorOtp = (operation) => async (dispatch) => {
    dispatch({ type: types.SEND_VERIFICATION_OTP_REQUEST });

    try {
        const response = await api.post(
            `/api/users/verification/${operation}/send-otp`,
            null,
            getAuthConfig()
        );
        const sessionId = response.data?.session;
        if (!sessionId) {
            throw new Error("The server did not return a verification session.");
        }

        dispatch({
            type: types.SEND_VERIFICATION_OTP_SUCCESS,
            payload: sessionId,
        });
        return { sessionId };
    } catch (error) {
        const message = getErrorMessage(error, "Unable to send the verification code.");
        dispatch({
            type: types.SEND_VERIFICATION_OTP_FAILURE,
            payload: message,
        });
        return { error: message };
    }
};

export const updateTwoFactorAuthentication =
    ({ sessionId, otp, operation, password }) =>
    async (dispatch) => {
        dispatch({ type: types.ENABLE_TWO_STEP_AUTHENTICATION_REQUEST });

        try {
            const response = await api.patch(
                "/api/users/two-factor/verify-otp",
                { sessionId, otp, operation, password },
                getAuthConfig()
            );
            dispatch({
                type: types.ENABLE_TWO_STEP_AUTHENTICATION_SUCCESS,
                payload: response.data,
            });
            dispatch({ type: types.GET_USER_SUCCESS, payload: response.data });
            return { success: true };
        } catch (error) {
            const message = getErrorMessage(error, "Unable to update two-step verification.");
            dispatch({
                type: types.ENABLE_TWO_STEP_AUTHENTICATION_FAILURE,
                payload: message,
            });
            return { error: message };
        }
    };

export const getUser = (jwt) => async (dispatch) => {
    dispatch({ type: types.GET_USER_REQUEST });

    try {
        const response = await api.get("/api/users/profile", getAuthConfig(jwt));
        dispatch({ type: types.GET_USER_SUCCESS, payload: response.data });
        return response.data;
    } catch (error) {
        dispatch({
            type: types.GET_USER_FAILURE,
            payload: getErrorMessage(error, "Unable to load your profile."),
        });
        return null;
    }
};

export const logout = () => (dispatch) => {
    localStorage.removeItem("jwt");
    dispatch({ type: types.LOGOUT });
};
