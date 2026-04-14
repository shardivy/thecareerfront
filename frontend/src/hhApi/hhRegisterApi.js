import axiosInstance from "../axiosInstance";

export const registerHHApi = async (formData) => {
  const response = await axiosInstance.post(
    "/event/handholding/register/",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};