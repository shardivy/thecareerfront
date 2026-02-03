import axiosInstance from "../axiosInstance";

// Get all packages
export const getPackagesApi = async () => {
  const response = await axiosInstance.get(
    "/program-package/get-packages/"
  );
  return response.data;
};

// Create a new package
export const createPackageApi = async (payload) => {
  const response = await axiosInstance.post(
    "/program-package/create-packages/",
    payload
  );
  return response.data;
};

// Update an existing package
export const updatePackageApi = async (id, payload) => {
  const response = await axiosInstance.put(
    `/program-package/packages/${id}/`,
    payload
  );
  return response.data;
};