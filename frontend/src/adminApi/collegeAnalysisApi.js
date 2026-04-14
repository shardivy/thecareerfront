import axiosInstance from "../axiosInstance";

// 📥 Get College List Analysis (User Requests)
export const getCollegeListAnalysisApi = async ({ studentId, tab } = {}) => {
  let url = "/program-package/college-list-analysis/";

  // ✅ add query params only when needed
  if (tab === "draft" && studentId) {
    url += `?tab=draft&student_id=${studentId}`;
  }

  const response = await axiosInstance.get(url);
  return response.data;
};

// 📤 Submit Answers API
export const submitAnswersApi = async (payload) => {
  const response = await axiosInstance.post(
    "/program-package/submit-answers/",
    payload
  );
  return response.data;
};

// 🚀 Start Questionnaire update API
export const startCollegeAnalysisApi = async (studentId) => {
  const response = await axiosInstance.put(
    `/program-package/college-analysis/start/${studentId}/`
  );
  return response.data;
};


// ✏️ UPDATE ANSWERS API
export const updateAnswersApi = async ({ studentId, answers }) => {
  const response = await axiosInstance.put(
    `/program-package/answers/update/${studentId}/`, // ✅ FIXED
    {
      answers, // ✅ ONLY answers in body
    }
  );
  return response.data;
};

// 📊 GET STATUS API
export const getCollegeAnalysisStatusApi = async (studentId) => {
  const response = await axiosInstance.get(
    `/program-package/college-analysis/status/${studentId}/`
  );
  return response.data;
};


// 📤 UPLOAD REPORT API
export const uploadAnalysisReportApi = async (id, file) => {
  const formData = new FormData();
   formData.append("file_path", file);

  const response = await axiosInstance.post(
    `/report/engineering/upload/${id}/`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

// 📊 GET COMPLETED EXAMS REPORTS
export const getCompletedReportsApi = async () => {
  const response = await axiosInstance.get(
    "/report/engineering/reports/completed-exams/"
  );
  return response.data;
};

// ✏️ UPDATE REPORT API (PUT)
export const updateAnalysisReportApi = async (id, file, isExisting) => {
  let payload;

  if (isExisting) {
    // ✅ send existing file path (NO FormData)
    payload = {
      file_path: file, // existing URL
    };

    const response = await axiosInstance.put(
      `/report/engineering/upload/${id}/`,
      payload
    );

    return response.data;
  } else {
    // ✅ send new file
    const formData = new FormData();
    formData.append("file_path", file);

    const response = await axiosInstance.put(
      `/report/engineering/upload/${id}/`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  }
};


// 📊 DASHBOARD STATS API
export const getAnalysisDashboardApi = async () => {
  const response = await axiosInstance.get(
    "/program-package/engineering-analysis/dashboard/"
  );
  return response.data;
};