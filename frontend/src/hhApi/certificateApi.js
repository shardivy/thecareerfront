import axiosInstance from "../axiosInstance";

// ✅ GET CERTIFICATE TEMPLATES
export const getCertificateTemplatesApi = async () => {
  const response = await axiosInstance.get(
    "/event/certificate-template/"
  );

  return response.data;
};

// ✅ NEW: Pending certificates students API
export const getPendingCertificatesApi = async () => {
  const response = await axiosInstance.get("/event/pending-certificates/");
  return response.data;
};

// ================= GENERATE CERTIFICATES =================
export const generateCertificatesApi = async (payload) => {
  const response = await axiosInstance.post(
    "/event/generate-certificates/",
    payload
  );

  return response.data;
};

// ✅ NEW: Issued certificates API
export const getIssuedCertificatesApi = async (params) => {
  const response = await axiosInstance.get("/event/issued-certificates/", {
    params, // for pagination (page, page_size)
  });

  return response.data;
};

  // ✅ CREATE CERTIFICATE TEMPLATE
export const createCertificateTemplateApi = async (formData) => {
  const response = await axiosInstance.post(
    "/event/certificate-template/",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};


export const getParticipantCertificateApi = async (participantId) => {
  const response = await axiosInstance.get(
    `/event/certificates/participant/${participantId}/`
  );
  return response.data;
};

// ✅ CERTIFICATE STATS API
export const getCertificateStatsApi = async () => {
  const response = await axiosInstance.get("/event/certificate-stats/");
  return response.data;
};