import axiosInstance from "../axiosInstance";

// get all users
export const getSessionBookingsApi = async () => {
  const response = await axiosInstance.get("/event/participants/");
  
  return response.data;
};

// fetch slot by date 
export const fetchBookedRescheduledApi = async (date) => {
  const response = await axiosInstance.get(
    `/event/handholding/booked-rescheduled/${date}/`
  );

  return response.data;
};

export const bookHandholdingSessionApi = async (payload) => {
  const response = await axiosInstance.post(
    "/event/handholding/book-session/",
    payload
  );
  return response.data;
};

export const rescheduleSessionApi = async (payload) => {
  const response = await axiosInstance.put(
    `/event/reschedule-session/`,
    payload
  );
  return response.data;
};

export const cancelSessionApi = async (payload) => {
  const response = await axiosInstance.put(
    "/event/cancel-session/",
    payload
  );
  return response.data;
};

export const markSessionCompletedApi = async (payload) => {
  const response = await axiosInstance.put(
    "/event/mark-session-completed/",
    payload
  );
  return response.data;
};

// ✅ NEW API - get sessions by participant
export const getParticipantSessionsApi = async (participantId) => {
  const response = await axiosInstance.get(
    `/event/single-participant/${participantId}/`
  );
  return response.data;
};


// send reminder API
export const sendHandholdingReminderApi = async (participantId, sessionNo) => {
  const response = await axiosInstance.post(
    `/event/send-handholding-reminder/${participantId}/${sessionNo}/`
  );
  return response.data;
};