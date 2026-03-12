import axiosInstance from "../axiosInstance";

export const getHobbiesApi = async () => {
  const response = await axiosInstance.get(
    "/lead-registeration/hobbies/"
  );

  return response.data.data;
};