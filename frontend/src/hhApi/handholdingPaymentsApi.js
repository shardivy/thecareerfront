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