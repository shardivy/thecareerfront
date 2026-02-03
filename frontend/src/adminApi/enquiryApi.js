import axiosInstance from "../axiosInstance";

//get enquiries
export const getEnquiriesApi = async () => {
  const response = await axiosInstance.get(
    "/lead-registeration/all-leads/"
  );
  return response.data;
};

//add enquiry
export const addEnquiryApi = async (payload) => {
  const response = await axiosInstance.post(
    "/lead-registeration/add-enquiry/",
    payload
  );
  return response.data;
};

// Convert enquiry to user
export const convertEnquiryApi = async (id) => {
  const response = await axiosInstance.post(
    `/lead-registeration/leads/${id}/convert/`
  );
  return response.data;
};

// updateEnquiryApi.js
export const updateEnquiryApi = async (payload) => {
  const { id, ...data } = payload;
  const response = await axiosInstance.patch(`/lead-registeration/leads/${id}/`, data);
  return response.data;
};
