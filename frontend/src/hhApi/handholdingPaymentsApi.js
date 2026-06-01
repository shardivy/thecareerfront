import axiosInstance from "../axiosInstance";

export const getHandholdingPaymentDetailsApi = async (participantId) => {
  const response = await axiosInstance.get(
    `/payment/payments/participant/${participantId}/`
  );

  return response.data;
};

export const getHandholdingSummaryApi = async (
  participantId,
  packageId
) => {
  const response = await axiosInstance.get(
    `/payment/participant-payment-summary/${participantId}/${packageId}/`
  );

  return response.data;
};


export const getPaymentProgressApi = async (participantId) => {
  const response = await axiosInstance.get(
    `/payment/participant/${participantId}/payment-progress/`
  );
  return response.data;
};

export const sendHandholdingPaymentReminderApi = async (participantId) => {
  const response = await axiosInstance.post(
    `/payment/handholding/${participantId}/payment-reminder/`
  );

  return response.data;
};

// ================= FETCH HANDHOLDING RECEIPT =================
export const getHandholdingReceiptApi = async (participantId) => {
  const response = await axiosInstance.get(
    `/payment/handholding/receipt/${participantId}/`,
    {
      responseType: "blob", // ✅ IMPORTANT for PDF
    }
  );
  return response.data;
};