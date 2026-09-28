import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("campusleave_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log(
      "[CampusLeave API]",
      config.method?.toUpperCase(),
      `${config.baseURL}${config.url}`
    );

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    console.log(
      "[CampusLeave API Response]",
      response.status,
      response.config.url
    );

    return response;
  },
  (error) => {
    console.error("[CampusLeave API Error]", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });

    return Promise.reject(error);
  }
);

export default api;