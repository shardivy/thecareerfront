import axiosInstance from "../axiosInstance";

/*** Fetch all lead counsellors */
export const fetchLeadCounsellorsApi = async () => {
  const response = await axiosInstance.get("/counselling_slot/lead-counsellors/");
  return response.data;
};

/*** Fetch all normal counsellors */
export const fetchNormalCounsellorsApi = async () => {
  const response = await axiosInstance.get("/counselling_slot/normal-counsellors/");
  return response.data;
};
