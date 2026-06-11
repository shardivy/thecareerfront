import axiosInstance from "../axiosInstance";

// ================= CREATE PAYMENT =================
// export const submitPaymentApi = async (payload) => {
//   const response = await axiosInstance.post(
//     "/payment/payments/",
//     payload,
//     {
//       headers: {
//         "Content-Type": "multipart/form-data", // for receipt upload
//       },
//     }
//   );
//   return response.data;
// };


export const submitPaymentApi = async (formData) => {
  const response = await axiosInstance.post(
    "/payment/payments/",
    formData
  );
  return response.data;
};


// ================= FETCH PAYMENT STATS =================
export const fetchPaymentStatsApi = async () => {
  const response = await axiosInstance.get(
    "/payment/payments-count/"
  );
  return response.data;
};

// ================= FETCH PAYMENT LIST =================
export const fetchPaymentsApi = async () => {
  const response = await axiosInstance.get(
    "/payment/list-payments/"
  );
  return response.data;
};

// ================= VERIFY PAYMENT =================
export const verifyPaymentApi = async (id, payload) => {
  const response = await axiosInstance.post(`/payment/verify-payment/${id}/`, payload);
  return response.data;
};

// ================= UPDATE PAYMENT =================
export const updatePaymentApi = async (id, payload) => {
  const response = await axiosInstance.put(
    `/payment/payments/${id}/`,
    payload,
    {
      headers: {
        "Content-Type": "multipart/form-data", 
      },
    }
  );
  return response.data;
};

// ================= STUDENT PAYMENT  REMAINING AMT =================
export const fetchStudentPaymentSummaryApi = async (
  studentId,
  packageId
) => {
  const response = await axiosInstance.get(
    `/payment/student-payment-summary/${studentId}/${packageId}/`
  );
  return response.data;
};


// ================= FETCH STUDENT PAYMENT HISTORY =================
export const fetchStudentPaymentHistoryApi = async (studentId) => {
  const response = await axiosInstance.get(
    `/payment/payments/student/${studentId}/`
  );
  return response.data;
};

// ================= FETCH STUDENT PAYMENT PROGRESS =================
export const fetchStudentPaymentProgressApi = async (studentId) => {
  const response = await axiosInstance.get(
    `/payment/student/${studentId}/payment-progress/`
  );
  return response.data;
};


// ================= FETCH PENDING PAYMENT STUDENTS =================
export const fetchPendingPaymentStudentsApi = async () => {
  const response = await axiosInstance.get(
    "/payment/pending-payments/"
  );
  return response.data;
};

// ================= SEND PAYMENT REMINDER =================
export const sendPaymentReminderApi = async (studentId) => {
  const response = await axiosInstance.post(
    `/payment/students/${studentId}/payment-reminder/`
  );
  return response.data;
};

// ================= FETCH RECEIPT BY STUDENT =================
export const fetchPaymentReceiptApi = async (studentId) => {
  const response = await axiosInstance.get(
    `/payment/receipt/${studentId}/`,
    {
      responseType: "blob", 
    }
  );
  return response.data;
};

// ================= SUBMIT PAYMENT by STUDENT  =================
export const submitStudentPaymentApi = async (studentId, formData) => {
  const response = await axiosInstance.post(
    `/payment/payment/create/student/${studentId}/`,
    formData
  );
  return response.data;
};