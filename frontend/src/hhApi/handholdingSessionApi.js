import axiosInstance from "../axiosInstance";

/* ================= CREATE SESSION ================= */
export const createHHSessionApi = async (payload) => {
  const response = await axiosInstance.post(
    "/event/handholding-session/",
    payload
  );

  return response.data;
};

/* ================= UPDATE SESSION ================= */
export const updateHHSessionApi = async (id, payload) => {
  const response = await axiosInstance.put(
    `/event/handholding-session/${id}/`,
    payload
  );

  return response.data;
};

/* ================= DELETE SESSION ================= */
export const deleteHHSessionApi = async (id) => {
  const response = await axiosInstance.delete(
    `/event/handholding-session/${id}/`
  );

  return response.data;
};

/* ================= GET ALL SESSIONS ================= */
export const getHHSessionApi = async () => {
  const response = await axiosInstance.get(
    "/event/handholding-session/"
  );

  return response.data;
};