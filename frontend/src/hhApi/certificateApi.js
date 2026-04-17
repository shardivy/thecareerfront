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