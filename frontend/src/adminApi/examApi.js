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
// export const approveUserExamApi = async (id) => {
//   const response = await axiosInstance.post(
//     `/exam/user-exams/${id}/approve/`
//   );
//   return response.data;
// };

export const approveUserExamApi = async (id, description) => {
  const response = await axiosInstance.post(
    `/exam/user-exams/${id}/approve/`,
    {
      description, // ✅ send comment in body
    }
  );
  return response.data;
};

// REJECT USER EXAM
export const rejectUserExamApi = async (id, description) => {
  const response = await axiosInstance.post(
    `/exam/user-exams/${id}/reject/`,
    {
      description, // ✅ now properly passed
    }
  );
  return response.data;
};

//Student dashboard
// SEND STUDENT EXAM FOR APPROVAL
export const sendExamForApprovalApi = async (studentId) => {
  const response = await axiosInstance.post(
    `/exam/student/${studentId}/send-for-approval/`
  );
  return response.data;
};

// GET EXAM TRACK STATUS (Student)
export const getExamTrackerApi = async (
  studentId,
  programId,
  packageId
) => {
  const response = await axiosInstance.get(
    `/exam/exam-tracker/student/${studentId}/`,
    {
      params: {
        program_id: programId,
        package_id: packageId,
      },
    }
  );

  return response.data;
};

// START EXAM
export const startExamApi = async (
  studentId,
  programId,
  packageId
) => {
  const response = await axiosInstance.post(
    `/exam/start-exam/${studentId}/?program_id=${programId}&package_id=${packageId}`
  );

  return response.data;
};

// GET EXAM STATUS (Student)
export const getExamStatusApi = async (
  studentId,
  programId,
  packageId
) => {

  const response = await axiosInstance.get(
    `/exam/exam-status/${studentId}/?program_id=${programId}&package_id=${packageId}`
  );

  return response.data;
};

// SAVE CAREER FUTURA DETAILS
export const saveExamRegisterApi = async (studentId, payload) => {
  const response = await axiosInstance.post(
    `/exam/save-career-futura-details/${studentId}/`,
    payload
  );

  return response.data;
};

// LAUNCH TEST
export const launchTestApi = async (studentId, type) => {
  const response = await axiosInstance.get(
    `/exam/launch-test/${studentId}/${type}/`
  );

  return response.data;
};