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

//* Fetch Reena Bhutada's counselling slots 
export const fetchReenaCounsellorApi = async () => {
  const response = await axiosInstance.get(
    "/counselling_slot/reena-bhutada-counsellor/"
  );

  return response.data;
};

export const fetchLeadCounsellorsApi = async () => {
  const response = await axiosInstance.get("/counselling_slot/counsellors/");
  return response.data;
};

/*** Fetch all counsellors */
export const fetchAllCounsellorsApi = async () => {
  const response = await axiosInstance.get(
    "/counselling_slot/counsellors/all/"
  );

  return response.data;
};

// Fetch my students from the new endpoint
export const getMyStudentsNewApi = async () => {
  const response = await axiosInstance.get(
    "/counselling_slot/counsellor/my-students/"
  );
  return response.data; 
};

export const getMyStudentsApi = async () => {
  const response = await axiosInstance.get(
    "/counselling_slot/counsellor/completed-bookings/"
  );

  return response.data; 
};


/*** Fetch counsellor bookings (session history UIUX) */
export const fetchCounsellorBookingsApi = async () => {
  const response = await axiosInstance.get(
    "/counselling_slot/counsellor-bookings/"
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

// Update counselling note
export const updateCounsellingNoteApi = async (
  bookingId,
  noteId,
  payload
) => {
  const response = await axiosInstance.put(
    `/counselling_slot/booking/${bookingId}/notes/${noteId}/`,
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
  return response.data; 
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

// Delete a file from a counselling note
export const deleteCounsellingFileApi = async (bookingId, noteId, fileKey) => {
  const response = await axiosInstance.delete(
    `/counselling_slot/counselling-note/${bookingId}/${noteId}/delete-file/${fileKey}/`
  );
  return response.data;
};