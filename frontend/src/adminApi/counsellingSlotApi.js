import axiosInstance from "../axiosInstance";


// GET slots by date & counsellor
export const getSlotsByDateApi = async (date, counsellorId) => {
  const response = await axiosInstance.get(
    `/counselling_slot/slots/${date}/${counsellorId}/`
  );
  return response.data; // should be array
};


// ✅ GET slots counsellor-wise (TABLE VIEW)
export const getSlotsCounsellorWiseApi = async () => {
  const response = await axiosInstance.get(
    "/counselling_slot/slots/counsellor-wise/"
  );
  return response.data;
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

// ✅ UPDATE COUNSELLOR STATUS
export const updateCounsellorStatusApi = async (payload) => {
  /**
   * payload = {
   *   counsellor_id,
   *   date,
   *   counsellor_is_active
   * }
   */
  const response = await axiosInstance.put(
    "/counselling_slot/slots/counsellor-wise/",
    payload
  );
  return response.data;
};