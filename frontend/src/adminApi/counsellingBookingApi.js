import axiosInstance from "../axiosInstance";

// Book a counselling slot
export const bookCounsellingSlotApi = async (payload) => {
  const response = await axiosInstance.post(
    "/counselling_slot/bookings/create/",
    payload
  );
  return response.data;
};

// Get all counselling bookings
export const getCounsellingBookingsApi = async () => {
  const response = await axiosInstance.get(
    "/counselling_slot/bookings/create/"
  );
  return response.data;
};

// Update a counselling booking
export const updateCounsellingBookingApi = async (id, payload) => {
  const response = await axiosInstance.put(
    `/counselling_slot/bookings/${id}/`,
    payload
  );
  return response.data;
};

// Get counselling session count for stats
export const getCounsellingSessionCountApi = async (period = "monthly") => {
  const response = await axiosInstance.get(
    `/counselling_slot/session-count/?period=${period}`
  );
  return response.data;
};

// Delete a counselling booking
export const deleteCounsellingBookingApi = async (id) => {
  const response = await axiosInstance.delete(
    `/counselling_slot/bookings/${id}/`
  );
  return response.data;
};


// Mark counselling booking as completed
export const markCounsellingBookingCompletedApi = async (id) => {
  const response = await axiosInstance.put(
    `/counselling_slot/bookings/${id}/mark-completed/`
  );
  return response.data;
};


// Get counselling bookings by student ID
export const getStudentCounsellingBookingsApi = async (studentId) => {
  const response = await axiosInstance.get(
    `/counselling_slot/student/${studentId}/bookings/`
  );
  return response.data;
};

// Cancel counselling booking 
export const cancelCounsellingBookingApi = async (id) => {
  const response = await axiosInstance.post(
    `/counselling_slot/bookings/${id}/cancel/`
  );
  return response.data;
};

// Send reminder for counselling booking
export const sendCounsellingReminderApi = async (id) => {
  const response = await axiosInstance.post(
    `/counselling_slot/send-reminder/${id}/`
  );
  return response.data;
};