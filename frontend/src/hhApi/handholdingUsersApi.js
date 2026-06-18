import axiosInstance from "../axiosInstance";

// ✅ Fetch all handholding users
export const fetchHandholdingUsersApi = async () => {
  const response = await axiosInstance.get("/all-users/");
  return response.data;
};

export const getHandholdingParticipantsApi = async () => {
  const response = await axiosInstance.get(
    "/event/handholding-participants/"
  );

  return response.data;
};

// payment 
export const getPendingParticipantsApi = async () => {
  const response = await axiosInstance.get(
    "/payment/handholding/pending-participants/"
  );
  return response.data;
};


// ✅ NEW API: Session journey + history
export const getParticipantSessionsApi = async (participantId) => {
  const response = await axiosInstance.get(
    `/event/participant-sessions/${participantId}/`
  );
  return response.data;
};

// UPDATE HH USER (EDIT API)
export const updateHandholdingParticipantApi = async (id, payload) => {
  const response = await axiosInstance.put(
    `/event/handholding-participants/${id}/`,
    payload
  );
  return response.data;
};

// ✅ NEW: Card Stats API
export const getCardStatsApi = async () => {
  const response = await axiosInstance.get("/event/card-count/");
  return response.data;
};

// ✅ Dashboard Stats API (NEW)
export const getDashboardStatsApi = async (participantId) => {
  const response = await axiosInstance.get(
    `/event/participant-session-progress/${participantId}/`
  );
  return response.data;
};

// CREATE HH USER
export const createHandholdingParticipantApi = async (payload) => {
  const response = await axiosInstance.post(
    "/event/add-handholding/",
    payload,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};