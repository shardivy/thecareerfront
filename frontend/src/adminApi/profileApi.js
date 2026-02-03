import axiosInstance from "../axiosInstance"; 

// Get profile details
export const getProfileApi = async () => {
  const response = await axiosInstance.get("/profile/");
  return response.data;
};

// Update profile details
export const updateProfileApi = async (payload) => {
  const response = await axiosInstance.put("/profile/", payload);
  return response.data;
};
