import axiosInstance from "../axiosInstance";

export const getHandholdingPaymentDetailsApi = async (participantId) => {
  const response = await axiosInstance.get(
    `/payment/payments/participant/${participantId}/`
  );

  return response.data;
};