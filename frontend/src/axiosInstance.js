 import axios from "axios";

const axiosInstance = axios.create({
  // baseURL: "http://192.168.1.6:8000/api/",
  // baseURL: "http://192.168.40.38:8000/api",
  // baseURL: "http://10.235.252.38:8000/api",
  // baseURL: "https://fares-seek-adam-interracial.trycloudflare.com/api",

  baseURL: "https://staging.abhinavcareerscope.com/api",


});

// 👇 PUBLIC ENDPOINTS
const publicEndpoints = [
  "/forgot-password/",
  "/login/", 
  "/reset-password/",
  "/verify-otp/",
  // "/program-package/get-programs/",
  // "/lead-registeration/send-otp/",      
  // "/lead-registeration/verify-otp-register/",
  // "/lead-registeration/student/      register/",

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
          // console.log("Outgoing request:", config.url, "Token:", accessToken);
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
    const status = error.response?.status;
    const url = error.config?.url || "";

    // console.log("❌ API Error:", status, url);

    // ✅ DO NOT redirect for login API
    if (status === 401 && url.includes("login")) {
      return Promise.reject(error);
    }

    // ✅ Redirect only for protected APIs
    if (status === 401) {
      localStorage.clear();
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
