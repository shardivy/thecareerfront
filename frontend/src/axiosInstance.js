import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://192.168.82.38:8000/api",

  // baseURL: "https://staging.abhinavcareerscope.com/api",


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
          console.log("Outgoing request:", config.url, "Token:", accessToken);
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
