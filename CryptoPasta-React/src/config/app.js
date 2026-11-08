import axios from "axios";

export const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5454"
).replace(/\/+$/, "");

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json"
    }
});

api.interceptors.request.use((config) => {
    const isAuthEndpoint = config.url?.startsWith("/auth/");
    const existingAuthorization =
        config.headers?.Authorization ?? config.headers?.get?.("Authorization");
    const jwt = !isAuthEndpoint && localStorage.getItem("jwt");

    if (!existingAuthorization && jwt) {
        config.headers.Authorization = `Bearer ${jwt}`;
    }

    config._authenticatedRequest = Boolean(existingAuthorization || jwt);
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && error.config?._authenticatedRequest) {
            localStorage.removeItem("jwt");
            window.dispatchEvent(new Event("auth:session-expired"));
        }

        return Promise.reject(error);
    }
);

export default api;