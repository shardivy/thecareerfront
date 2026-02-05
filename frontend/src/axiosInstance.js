import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://192.168.206.38:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// 👇 PUBLIC ENDPOINTS (NO TOKEN)
const publicEndpoints = [
  "/forgot-password/",
  "/login/",
  "/reset-password/",
  "/verify-otp/",
];

// ================= REQUEST =================
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");

    const isPublic = publicEndpoints.some((url) =>
      config.url?.includes(url)
    );

    // ✅ Attach token ONLY for protected APIs
    if (accessToken && !isPublic) {
      config.headers.Authorization = `Bearer ${accessToken}`;
      console.log("Request:", config.url, config.headers.Authorization);

    } else {
      // 🔥 Make 100% sure it's removed
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ================= RESPONSE =================
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !window.location.pathname.includes("/")
    ) {
      localStorage.clear();
      window.location.replace("/");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
