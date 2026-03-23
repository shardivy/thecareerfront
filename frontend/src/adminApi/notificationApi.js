import axiosInstance from "../axiosInstance";

// 🔔 GET SUPERADMIN NOTIFICATIONS
export const getSuperadminNotificationsApi = async () => {
  const response = await axiosInstance.get(
    "/notification/superadmin-notifications/"
  );
  return response.data;
};

// 🔔 MARK AS READ API
export const markNotificationAsReadApi = async (id) => {
  const response = await axiosInstance.put(
    `/notification/superadmin/notifications/${id}/`
  );
  return response.data;
};