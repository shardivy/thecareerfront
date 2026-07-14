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

// FETCH STUDENT COUNSELLING NOTES
export const getStudentCounsellingNotesApi = async (
  studentId,
  programId,
  packageId
) => {
  const response = await axiosInstance.get(
    `/counselling_slot/student-counselling-notes/${studentId}/`,
    {
      params: {
        program_id: programId,
        package_id: packageId,
      },
    }
  );

  return response.data;
};

// ================= GET FILTERED CONTENT (counsellor dashboard) =================
export const getFilteredContentApi = async (
  programId,
  packageId,
  streamIds
) => {
  const response = await axiosInstance.get(
    "/content/contents/",
    {
      params: {
        program_id: programId,
        package_id: packageId,
        stream_ids: Array.isArray(streamIds)
          ? streamIds.join(",")
          : streamIds,
      },
    }
  );

  return response.data;
};

// ================= ASSIGN STREAM CONTENT (counsellor dashboard) =================
export const assignStreamContentApi = async (payload) => {
  const response = await axiosInstance.post(
    "/content/assign-stream-content/",
    payload
  );

  return response.data;
};

// ================= GET STUDENT CONTENT =================
export const getStudentContentApi = async (studentId) => {
  const response = await axiosInstance.get(
    `/content/student-content/${studentId}/`
  );

  return response.data;
};

// ================= UPDATE STREAM CONTENT (counsellor dashboard) =================
export const updateStreamContentApi = async (payload) => {
  const response = await axiosInstance.put(
    "/content/assign-stream-content/",
    payload
  );
 
  return response.data;
};