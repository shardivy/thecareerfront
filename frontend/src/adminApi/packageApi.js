import axiosInstance from "../axiosInstance";

// Get all packages
export const getPackagesApi = async () => {
  const response = await axiosInstance.get(
    "/program-package/get-packages/"
  );
  return response.data;
};

/* GET PACKAGES BY PROGRAM ID */
export const getPackagesByProgramApi = async (programId) => {
  const response = await axiosInstance.get(
    `/program-package/programs/${programId}/packages/`
  );
  return response.data;
};


/* GET PACKAGES BY MULTIPLE PROGRAMS */
export const getPackagesByMultipleProgramsApi = async (programIds) => {
  const response = await axiosInstance.post(
    "/program-package/multiple-program-packages/",
    {
      program_ids: programIds,
    }
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

// GET SINGLE PACKAGE BY PROGRAM + PACKAGE ID + amount
export const getProgramPackageDetailsApi = async (programId, packageId) => {
  const response = await axiosInstance.get(
    `/program-package/programs/${programId}/packages/${packageId}/`
  );
  return response.data;
};


