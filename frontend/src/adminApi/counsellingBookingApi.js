import axiosInstance from "../axiosInstance";

// Book a counselling slot
export const bookCounsellingSlotApi = async (payload) => {
  const response = await axiosInstance.post(
    "/counselling_slot/booking/",
    payload
  );
  return response.data;
};

