import axiosInstance from "../axiosInstance";

// 🔔 GET SUPERADMIN NOTIFICATIONS
export const getSuperadminNotificationsApi = async () => {
  const response = await axiosInstance.get(
    "/notification/superadmin-notifications/"
  );
  return response.data;
};