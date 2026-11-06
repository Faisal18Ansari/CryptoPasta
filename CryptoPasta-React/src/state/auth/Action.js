import axios from "axios"
import { REGISTER_FAILURE, REGISTER_REQUEST, REGISTER_SUCCESS, LOGIN_REQUEST, LOGIN_SUCCESS, LOGIN_FAILURE, GET_USER_REQUEST, GET_USER_SUCCESS, GET_USER_FAILURE, LOGOUT } from "./ActionType"

export const register = (userData) => async (dispatch) => {
    dispatch({ type: REGISTER_REQUEST })

    const baseURL = "http://localhost:5454"

    try {
        await axios.post(`${baseURL}/auth/signup`, userData)

        // Signup should not sign the user in automatically.
        dispatch({ type: REGISTER_SUCCESS })
        return true
    } catch (error) {
        dispatch({
            type: REGISTER_FAILURE,
            payload: error.response?.data || error.message || "Signup failed."
        })
        return false
    }
}

export const login = (userData) => async (dispatch) => {
    dispatch({ type: LOGIN_REQUEST })
    const baseURL = "http://localhost:5454"
    try {
        const response = await axios.post(`${baseURL}/auth/signin`, userData.data);
        const user = response.data;
        dispatch({ type: LOGIN_SUCCESS, payload: user.jwt });
        localStorage.setItem("jwt", user.jwt);
        userData.navigate("/");
    } catch (error) {
        console.error("Login status:", error.response?.status);
        console.error("Login response:", error.response?.data);

        dispatch({
            type: LOGIN_FAILURE,
            payload: error.response?.data || error.message
        });
    }
}
    export const getUser = (jwt) => async (dispatch) => {

        dispatch({ type: GET_USER_REQUEST })

        const baseUrl = "http://localhost:5454"

        try {
            const response = await axios.get(`${baseUrl}/api/users/profile`, {
                headers: {
                    Authorization: `Bearer ${jwt}`
                }
            });
            const user = response.data;
            console.log(user);

            dispatch({ type: GET_USER_SUCCESS, payload: user })

        } catch (error) {
            dispatch({ type: GET_USER_FAILURE, payload: error.message })
            console.log(error);
        }

    }

    export const logout = () => (dispatch) => {
        localStorage.removeItem("jwt");
        dispatch({ type: LOGOUT });
    }