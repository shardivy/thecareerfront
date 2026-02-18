import axiosInstance from "../axiosInstance";

// GET COMPLETED EXAM REPORTS
export const getCompletedExamReportsApi = async () => {
  const response = await axiosInstance.get(
    "/report/reports/completed-exams/"
  );
  return response.data;
};

// GET COMPLETED EXAM REPORTS BY STUDENT ID
export const getCompletedExamReportsByStudentApi = async (studentId) => {
  const response = await axiosInstance.get(
    `/report/reports/completed-exams/${studentId}/`
  );
  return response.data;
};



export const uploadReportApi = async (reportId, payload) => {
  const response = await axiosInstance.post(
    `/report/upload/${reportId}/`,
    payload,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};


// GET REPORT STATUS COUNT
export const getReportStatusCountApi = async () => {
  const response = await axiosInstance.get("/report/reports/status-count/");
  return response.data;
};

// UPDATE REPORT
export const updateReportApi = async (reportId, payload) => {
  const response = await axiosInstance.put(
    `/report/upload/${reportId}/`, // same endpoint as POST
    payload,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};
