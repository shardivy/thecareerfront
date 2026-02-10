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