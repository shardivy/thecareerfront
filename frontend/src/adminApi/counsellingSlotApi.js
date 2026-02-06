import axiosInstance from "../axiosInstance";

// GET slots by date & counsellor
export const getSlotsByDateApi = async (date, counsellorId) => {
  const response = await axiosInstance.get(
    `/counselling_slot/slots/${date}/${counsellorId}/`
  );
  return response.data; // should be array
};


// ✅ DELETE slot by slot ID
export const deleteSlotApi = async (slotId) => {
  const response = await axiosInstance.delete(
    `/counselling_slot/slots/${slotId}/`
  );
  return response.data;
};

// ✅ CREATE slots
export const createSlotsApi = async (date, counsellorId, payload) => {
  const response = await axiosInstance.post(
    `/counselling_slot/slots/${date}/${counsellorId}/`,
    payload
  );
  return response.data;
};
