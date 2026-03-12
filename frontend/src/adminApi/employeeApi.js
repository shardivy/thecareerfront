// src/adminApi/employeeApi.js

import axiosInstance from "../axiosInstance";

export const registerUserApi = async (data) => {
  const response = await axiosInstance.post("/register/", data);
  return response.data;
};

export const updateUserApi = async (userId, data) => {
  const response = await axiosInstance.put(`/register/${userId}/`, data);
  return response.data;
};

export const getRegisteredUsersApi = async () => {
  const response = await axiosInstance.get("/register/");
  return response.data;
};

// DELETE USER
export const deleteUserApi = async (userId) => {
  const response = await axiosInstance.delete(`/register/${userId}/`);
  return response.data;
};