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

// forgot password VERIFY OTP
export const verifyOtpApi = async (payload) => {
  const response = await axiosInstance.post("/verify-otp/", payload);
  return response.data;
};

// RESET PASSWORD
export const resetPasswordApi = async (payload) => {
  const response = await axiosInstance.post("/reset-password/", payload);
  return response.data;
};

//Registration API
// Send OTP for parent mobile
export const sendOtpApi = async (payload) => {
  const response = await axiosInstance.post("/lead-registeration/send-parent-otp/", payload);
  return response.data;
};

// Verify OTP for registration
export const verifyOtpRegisterApi = async (payload) => {
  const response = await axiosInstance.post("/lead-registeration/verify-parent-otp/", payload);
  return response.data;
};

// Student Registration API
export const studentRegisterApi = async (payload) => {
  const response = await axiosInstance.post("/lead-registeration/student/register/", payload);
  return response.data;
};