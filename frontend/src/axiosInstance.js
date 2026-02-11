import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://192.168.0.108:8000/api",
  // ❌ DO NOT set Content-Type here
});

// 👇 PUBLIC ENDPOINTS
const publicEndpoints = [
  "/forgot-password/",
  "/login/",
  "/reset-password/",
  "/verify-otp/",
];

// ================= REQUEST INTERCEPTOR =================
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");

    const isPublic = publicEndpoints.some((url) =>
      config.url?.includes(url)
    );

    if (accessToken && !isPublic) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    } else {
      delete config.headers.Authorization;
    }

    // ✅ CRITICAL FIX FOR FILE UPLOAD
    if (config.data instanceof FormData) {
      // let browser set multipart boundary
      delete config.headers["Content-Type"];
    } else {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ================= RESPONSE =================
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.replace("/");
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
