import axiosInstance from "../axiosInstance";

// 📥 Get College List Analysis (User Requests)
export const getCollegeListAnalysisApi = async ({
  studentId,
  tab,
  programId,
  packageId,
} = {}) => {
  let url = "/program-package/college-list-analysis/";

  if (
    tab === "draft" &&
    studentId &&
    programId &&
    packageId
  ) {
    url += `?tab=draft&student_id=${studentId}&program_id=${programId}&package_id=${packageId}`;
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
export const startCollegeAnalysisApi = async (
  studentId,
  programId,
  packageId
) => {
  const response = await axiosInstance.put(
    `/program-package/college-analysis/start/${studentId}/?program_id=${programId}&package_id=${packageId}`
  );

  return response.data;
};

// ✏️ UPDATE ANSWERS API
export const updateAnswersApi = async ({ studentId, answers }) => {
  const response = await axiosInstance.put(
    `/program-package/answers/update/${studentId}/`, 
    {
      answers, 
    }
  );
  return response.data;
};

// 📊 GET STATUS API
export const getCollegeAnalysisStatusApi = async (
  studentId,
  programId,
  packageId
) => {
  const response = await axiosInstance.get(
    `/program-package/college-analysis/status/${studentId}/`,
    {
      params: {
        program_id: programId,
        package_id: packageId,
      },
    }
  );

  return response.data;
};


// 📤 UPLOAD REPORT API
export const uploadAnalysisReportApi = async (id, formData) => {
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
export const updateAnalysisReportApi = async (id, formData) => {
    const response = await axiosInstance.put(
        `/report/engineering/upload/${id}/`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
};


// 📊 DASHBOARD STATS API
export const getAnalysisDashboardApi = async () => {
  const response = await axiosInstance.get(
    "/program-package/engineering-analysis/dashboard/"
  );
  return response.data;
};


export const uploadEngineeringV3ReportApi = async (reportId, payload) => {
  const response = await axiosInstance.post(
    `/report/engineering-v2/upload/${reportId}/`,
    payload,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};