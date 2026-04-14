import axiosInstance from "../axiosInstance";

// ✅ Fetch all handholding users
export const fetchHandholdingUsersApi = async () => {
  const response = await axiosInstance.get("/all-users/");
  return response.data;
};