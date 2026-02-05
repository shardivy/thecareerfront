import axiosInstance from "../axiosInstance";

// CREATE EXAM
export const createExamApi = async (payload) => {
  const response = await axiosInstance.post("/exam/package-exams/", payload);
  return response.data;
};

// UPDATE EXAM
export const updateExamApi = async (id, payload) => {
  const response = await axiosInstance.put(`/exam/package-exams/${id}/`, payload);
  return response.data;
};

// GET EXAMS
export const getExamsApi = async () => {
  const response = await axiosInstance.get("/exam/package-exams/");
  return response.data;
};


// GET USER EXAMS 
export const getUserExamsApi = async () => {
  const response = await axiosInstance.get("/exam/user-exams/");
  return response.data;
};

// APPROVE USER EXAM
export const approveUserExamApi = async (id) => {
  const response = await axiosInstance.post(
    `/exam/user-exams/${id}/approve/`
  );
  return response.data;
};

// REJECT USER EXAM
export const rejectUserExamApi = async (id) => {
  const response = await axiosInstance.post(
    `/exam/user-exams/${id}/reject/`
  );
  return response.data;
};
