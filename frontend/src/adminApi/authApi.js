import axiosInstance from "../axiosInstance";

// LOGIN API
export const loginApi = async (payload) => {
  const response = await axiosInstance.post("/login/", payload);
  return response.data;
};

// FORGOT PASSWORD
export const forgotPasswordApi = async (payload) => {
  const response = await axiosInstance.post("/forgot-password/", payload);
  return response.data;
};

// VERIFY OTP
export const verifyOtpApi = async (payload) => {
  const response = await axiosInstance.post("/verify-otp/", payload);
  return response.data;
};

// RESET PASSWORD
export const resetPasswordApi = async (payload) => {
  const response = await axiosInstance.post("/reset-password/", payload);
  return response.data;
};