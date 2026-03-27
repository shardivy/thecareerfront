import axiosInstance from "../axiosInstance";

// ================= UPLOAD CONTENT API =================
export const uploadContentApi = async (formData) => {
  const response = await axiosInstance.post(
    "/content/upload-content/",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

// ================= GET CONTENT LIST API =================
export const getContentListApi = async () => {
  const response = await axiosInstance.get(
    "/content/upload-content/"
  );

  return response.data;
};

// ================= UPDATE CONTENT API =================
export const updateContentApi = async (id, formData) => {
  const response = await axiosInstance.put(
    `/content/upload-content/${id}/`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};


// ================= DELETE CONTENT API =================
export const deleteContentApi = async (id) => {
  const response = await axiosInstance.delete(
    `/content/upload-content/${id}/`
  );

  return response.data;
};

// ================= GET CONTENT COUNT (STATS) =================
export const getContentCountApi = async () => {
  const response = await axiosInstance.get(
    "/content/count/"
  );

  return response.data;
};

// ================= INCREMENT DOWNLOAD COUNT API =================
export const incrementDownloadCountApi = async (id) => {
  const response = await axiosInstance.get(`/content/download/${id}/`);
  return response.data;
};

// ================= GET CONTENT BY PROGRAM =================
export const getProgramContentApi = async (programId) => {
  const response = await axiosInstance.get(
    `/content/program-content/?program_id=${programId}`
  );

  return response.data;
};