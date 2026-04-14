import axiosInstance from "../axiosInstance";

// GET DASHBOARD STATS
export const getDashboardStatsApi = async () => {
  const response = await axiosInstance.get("/dashboard/");
  return response.data;
};


// GET LEAD STATS
export const getLeadStatsApi = async (period = "monthly") => {
  // period can be weekly, monthly, yearly
  const response = await axiosInstance.get(`/lead-stats/?period=${period}`);
  return response.data;
};

// ✅ GET ACTIVITY LOGS
export const getActivityLogsApi = async () => {
  const response = await axiosInstance.get("/activity/activity-logs/");
  return response.data;
};