import axiosInstance from "../axiosInstance";

/*** Fetch all lead counsellors */
// export const fetchLeadCounsellorsApi = async () => {
//   const response = await axiosInstance.get("/counselling_slot/lead-counsellors/");
//   return response.data;
// };


/*** Fetch all normal counsellors */
// export const fetchNormalCounsellorsApi = async () => {
//   const response = await axiosInstance.get("/counselling_slot/normal-counsellors/");
//   return response.data;
// };

export const fetchLeadCounsellorsApi = async () => {
  const response = await axiosInstance.get("/counselling_slot/counsellors/");
  return response.data;
};

export const getMyStudentsApi = async () => {
  const response = await axiosInstance.get(
    "/counselling_slot/counsellor/my-students/"
  );

  return response.data; 
};

//* Create counselling note for a specific booking */
export const createCounsellingNoteApi = async (
  bookingId,
  payload
) => {
  const response = await axiosInstance.post(
    `/counselling_slot/counselling-note/create/${bookingId}/`,
    payload,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

// Fetch counselling note for a specific booking
export const fetchCounsellingNoteApi = async (bookingId) => {
  const response = await axiosInstance.get(
    `/counselling_slot/counselling-note/create/${bookingId}/`
  );
  return response.data; // expected { notes: string, uploadedFiles: [{name, url, type}] }
};


export const fetchCounsellorDashboardCountApi = async (period) => {
  const response = await axiosInstance.get(
    "/counselling_slot/counsellor/dashboard-count/",
    {
      params: { period }, // weekly | monthly | yearly
    }
  );

  return response.data;
};