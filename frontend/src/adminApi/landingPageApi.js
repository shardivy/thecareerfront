import axiosInstance from "../axiosInstance";

/* ---------------- CREATE LANDING PAGE ---------------- */
export const createLandingPageApi = async (data) => {
  const response = await axiosInstance.post(
    "/program-package/landing-page/",
    data, // 👈 already FormData
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

/* ---------------- GET LANDING PAGES ---------------- */
export const getLandingPagesApi = async () => {
  const response = await axiosInstance.get(
    "/program-package/landing-page/"
  );

  return response.data.data; 
};

/* ---------------- UPDATE LANDING PAGE ---------------- */
export const updateLandingPageApi = async (id, data) => {
  const response = await axiosInstance.put(
    `/program-package/landing-page/${id}/`, 
    data,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};


/* ---------------- DELETE LANDING PAGE ---------------- */
export const deleteLandingPageApi = async (id) => {
  const response = await axiosInstance.delete(
    `/program-package/landing-page/${id}/`
  );

  return response.data;
};

/* ---------------- GET LANDING PAGE BY PACKAGE ID ---------------- */
export const getLandingPageByPackageApi = async (packageId) => {
  const response = await axiosInstance.get(
    `/program-package/landing-page/package/${packageId}/`
  );

  return response.data;
};