// src/adminApi/programApi.js
import axiosInstance from "../axiosInstance";

// Get Programs API
export const getProgramsApi = async () => {
  const response = await axiosInstance.get(
    "/program-package/get-programs/"
  );
  return response.data;
};

// Add Program API
export const addProgramApi = async (payload) => {
  const response = await axiosInstance.post(
    "/program-package/add-programs/",
    payload
  );
  return response.data;
};

// Update Program API
export const updateProgramApi = async (id, payload) => {
  const response = await axiosInstance.put(
    `/program-package/update-program/${id}/`,
    payload
  );
  return response.data;
};

// Get Program Stats API
export const getProgramStatsApi = async () => {
  const response = await axiosInstance.get("/program-package/dashboard/counts/");
  return response.data; 
};