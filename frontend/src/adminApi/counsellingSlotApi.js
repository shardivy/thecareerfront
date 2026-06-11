import axiosInstance from "../axiosInstance";


// GET slots by date & counsellor
export const getSlotsByDateApi = async (date, counsellorId) => {
  const response = await axiosInstance.get(
    `/counselling_slot/slots/${date}/${counsellorId}/`
  );
  return response.data; 
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
   const response = await axiosInstance.put(
    "/counselling_slot/slots/counsellor-wise/",
    payload
  );
  return response.data;
};


// ✅ GET slots for selected date
export const getSlotsForSelectedDateApi = async (date) => {
  const response = await axiosInstance.get(
    `/counselling_slot/counsellor-slots/${date}/`
  );
  return response.data; 
};


// ✅ UPDATE SLOT AVAILABILITY
export const updateSlotAvailabilityApi = async (slotId, payload) => {
  const response = await axiosInstance.put(
    `/counselling_slot/slots/${slotId}/availability/`,
    payload
  );
  return response.data;
};

//scheduler page api
export const getCounsellorBookingsApi = async (year, month) => {
  const response = await axiosInstance.get(
    `/counselling_slot/counsellor-bookings-all-list/?year=${year}&month=${month}`
  );

  return response.data.data;
};