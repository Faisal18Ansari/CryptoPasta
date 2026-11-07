import api from "@/config/app";
import { ADD_PAYMENT_DETAILS_FAILURE, ADD_PAYMENT_DETAILS_REQUEST, ADD_PAYMENT_DETAILS_SUCCESS, GET_PAYMENT_DETAILS_FAILURE, GET_PAYMENT_DETAILS_REQUEST, GET_PAYMENT_DETAILS_SUCCESS, GET_WITHDRAWAL_HISTORY_FAILURE, GET_WITHDRAWAL_HISTORY_REQUEST, GET_WITHDRAWAL_HISTORY_SUCCESS, GET_WITHDRAWAL_REQUEST_FAILURE, GET_WITHDRAWAL_REQUEST_REQUEST, GET_WITHDRAWAL_REQUEST_SUCCESS, WITHDRAWAL_FAILURE, WITHDRAWAL_PROCEED_FAILURE, WITHDRAWAL_PROCEED_REQUEST, WITHDRAWAL_PROCEED_SUCCESS, WITHDRAWAL_REQUEST, WITHDRAWAL_SUCCESS } from "./ActionType";

const getAuthConfig = (jwt = localStorage.getItem("jwt")) => ({
  headers: jwt ? { Authorization: `Bearer ${jwt}` } : {}
});

const getErrorMessage = (error, fallback) => {
  const responseData = error.response?.data;
  const message = responseData?.detail ?? responseData?.message ?? responseData?.error;
  return typeof message === "string" ? message : error.message || fallback;
};

export const withdrawalRequest = ({ amount, jwt }) => async dispatch => {
  dispatch({ type: WITHDRAWAL_REQUEST });

  try {
    const response = await api.post(
      `/api/withdrawal/${amount}`,
      null,
      getAuthConfig(jwt)
    );

    dispatch({
      type: WITHDRAWAL_SUCCESS,
      payload: response.data
    });

    return response.data;
  } catch (error) {
    const responseData = error.response?.data;
    const message =
      responseData?.detail ??
      responseData?.message ??
      responseData?.error ??
      error.message;

    dispatch({
      type: WITHDRAWAL_FAILURE,
      payload: typeof message === "string" ? message : "Withdrawal request failed."
    });

    return null;
  }
};

export const proceedWithdrawal = ({ id, jwt, accept }) => async dispatch => {
  dispatch({ type: WITHDRAWAL_PROCEED_REQUEST });
  try {
    const response = await api.patch(
      `/api/admin/withdrawal/${id}/proceed/${accept}`,
      null,
      getAuthConfig(jwt)
    );

    console.log("proceed withdrawal ---- ", response.data)
    dispatch({
      type: WITHDRAWAL_PROCEED_SUCCESS,
      payload: response.data
    });
    return response.data;
  } catch (error) {
    dispatch({
      type: WITHDRAWAL_PROCEED_FAILURE,
      payload: getErrorMessage(error, "Unable to process this withdrawal.")
    });
    return null;
  }
};

export const getWithdrawalHistory = jwt => async dispatch => {
  dispatch({ type: GET_WITHDRAWAL_HISTORY_REQUEST });
  try {
    const response = await api.get('/api/withdrawal', getAuthConfig(jwt));

    console.log("get withdrawal history ---- ", response.data)
    dispatch({
      type: GET_WITHDRAWAL_HISTORY_SUCCESS,
      payload: response.data
    });
  } catch (error) {
    dispatch({
      type: GET_WITHDRAWAL_HISTORY_FAILURE,
      payload: error.message
    });
  }
};

export const getAllWithdrawalRequest = jwt => async dispatch => {
  dispatch({ type: GET_WITHDRAWAL_REQUEST_REQUEST });
  try {
    const response = await api.get('/api/admin/withdrawal', getAuthConfig(jwt));

    console.log("get withdrawal requests ---- ", response.data)
    dispatch({
      type: GET_WITHDRAWAL_REQUEST_SUCCESS,
      payload: response.data
    });
  } catch (error) {
    console.log("error ", error)
    dispatch({
      type: GET_WITHDRAWAL_REQUEST_FAILURE,
      payload: getErrorMessage(error, "Unable to load withdrawal requests.")
    });
  }
};

export const getPaymentDetails = ({ jwt }) => async dispatch => {
  dispatch({ type: GET_PAYMENT_DETAILS_REQUEST });
  try {
    const response = await api.get(`/api/payment-details`, getAuthConfig(jwt));

    console.log("get payment details ---- ", response.data)
    dispatch({
      type: GET_PAYMENT_DETAILS_SUCCESS,
      payload: response.data
    });
  } catch (error) {
    console.log(error)
    dispatch({
      type: GET_PAYMENT_DETAILS_FAILURE,
      payload: error.message
    });
  }
};

export const addPaymentDetails = ({ paymentDetails, jwt }) => async dispatch => {
  dispatch({ type: ADD_PAYMENT_DETAILS_REQUEST });
  try {
    const response = await api.post(`/api/payment-details`, paymentDetails, getAuthConfig(jwt));

    console.log("add payment Details ---- ", response.data)
    dispatch({
      type: ADD_PAYMENT_DETAILS_SUCCESS,
      payload: response.data
    });
  } catch (error) {
    console.log(error)
    dispatch({
      type: ADD_PAYMENT_DETAILS_FAILURE,
      payload: error.message
    });
  }
};