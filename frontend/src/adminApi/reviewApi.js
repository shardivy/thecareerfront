import axiosInstance from "../axiosInstance";

// START REVIEW BY STUDENT
export const startReviewByStudentApi = async (payload) => {
  const response = await axiosInstance.post(
    "/report/review/start-by-student/",
    payload
  );
  return response.data;
};

// GET REVIEW STATUS
export const getReviewStatusApi = async (studentId) => {
  const response = await axiosInstance.get(
    `/report/review/status/${studentId}/`
  );
  return response.data;
};

// SUBMIT REVIEW
export const submitReviewByStudentApi = async (reviewId) => {
  const response = await axiosInstance.put(
    `/report/review/submit/${reviewId}/`
  );
  return response.data;
};