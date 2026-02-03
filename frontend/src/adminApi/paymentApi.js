import axiosInstance from "../axiosInstance";

// ================= CREATE PAYMENT =================
export const submitPaymentApi = async (payload) => {
  const response = await axiosInstance.post(
    "/payment/payments/",
    payload,
    {
      headers: {
        "Content-Type": "multipart/form-data", // for receipt upload
      },
    }
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
    `/payment/update-payments/${id}/`,
    payload,
    {
      headers: {
        "Content-Type": "multipart/form-data", // needed if receipt is updated
      },
    }
  );
  return response.data;
};