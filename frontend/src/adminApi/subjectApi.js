import axiosInstance from "../axiosInstance";

// Get all subjects
export const getSubjectsApi = async () => {
  const response = await axiosInstance.get("/lead-registeration/subjects/");
  return response.data;
};