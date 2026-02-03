import axiosInstance from "../axiosInstance";

// CREATE counselling slot
export const createCounsellingSlotApi = async (payload) => {
  const response = await axiosInstance.post(
    "/counselling_slot/slots/",
    payload
  );
  return response.data;
};

// GET all slots (optional – for later use)
export const getCounsellingSlotsApi = async () => {
  const response = await axiosInstance.get(
    "/counselling_slot/slots/"
  );
  return response.data;
};

// UPDATE slot
export const updateCounsellingSlotApi = async (id, payload) => {
  const response = await axiosInstance.put(
    `/counselling_slot/slots/${id}/`,
    payload
  );
  return response.data;
};

// DELETE slot
export const deleteCounsellingSlotApi = async (id) => {
  const response = await axiosInstance.delete(
    `/counselling_slot/slots/${id}/`
  );
  return response.data;
};
