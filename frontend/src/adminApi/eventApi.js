import axiosInstance from "../axiosInstance";

// CREATE EVENT API
export const createEventApi = async (data) => {
  const response = await axiosInstance.post("/event/events/", data);
  return response.data;
};

// GET ALL EVENTS
export const getEventsApi = async () => {
  const response = await axiosInstance.get("/event/events/");
  return response.data;
};

// UPDATE EVENT API
export const updateEventApi = async (id, data) => {
  const response = await axiosInstance.put(`/event/events/${id}/`, data);
  return response.data;
};

// SEND REMINDER API
export const sendReminderApi = async (id) => {
  const response = await axiosInstance.post(`/event/send-reminder/${id}/`);
  return response.data;
};

// GET DASHBOARD COUNT
export const getEventDashboardCountApi = async () => {
  const response = await axiosInstance.get("/event/event-dashboard-count/");
  return response.data;
};

export const markEventCompletedApi = async (id) => {
  const response = await axiosInstance.put(
    `/event/mark-event-completed/${id}/`
  );
  return response.data;
};