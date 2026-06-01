import axiosInstance from "../axiosInstance";

// CREATE Advertisement
export const createAdvertisementApi = async (payload) => {
  const response = await axiosInstance.post(
    "/event/advertisement/",
    payload
  );

  return response.data;
};

// GET Advertisements
export const getAdvertisementsApi = async () => {
  const response = await axiosInstance.get(
    "/event/advertisement/"
  );

  return response.data;
};

// UPDATE Advertisement
export const updateAdvertisementApi = async (id, payload) => {
  const response = await axiosInstance.put(
    `/event/advertisement/${id}/`,
    payload
  );

  return response.data;
};


// GET STATS
export const getAdvertisementStatsApi = async () => {
  const response = await axiosInstance.get(
    "/event/stats/"
  );

  return response.data;
};