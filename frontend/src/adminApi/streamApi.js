import axiosInstance from "../axiosInstance";

// GET Streams
export const getStreamsApi = async () => {
  const response = await axiosInstance.get(
    "/lead-registeration/streams/"
  );
  return response.data;
};

// tab apis
// CREATE Stream
export const createStreamApi = async (payload) => {
  const response = await axiosInstance.post(
    "/lead-registeration/streams/",
    payload
  );

  return response.data;
};

// UPDATE
export const updateStreamApi = async (id, payload) => {
  const response = await axiosInstance.put(
    `/lead-registeration/streams/${id}/`,
    payload
  );

  return response.data;
};

// DELETE Stream
export const deleteStreamApi = async (id) => {
  const response = await axiosInstance.delete(
    `/lead-registeration/streams/${id}/`
  );

  return response.data;
};