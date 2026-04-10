import axiosInstance from "../axiosInstance";

// ➕ Add Question API
export const addQuestionApi = async (payload) => {
  const response = await axiosInstance.post(
    "/program-package/questions/",
    payload
  );
  return response.data;
};

// ✏️ Update Question API
export const updateQuestionApi = async (id, payload) => {
  const response = await axiosInstance.put(
    `/program-package/questions/${id}/`,
    payload
  );
  return response.data;
};

// 📥 Get Questions API
export const getQuestionsApi = async () => {
  const response = await axiosInstance.get(
    "/program-package/questions/"
  );
  return response.data;
};

// ❌ Delete Question API
export const deleteQuestionApi = async (id) => {
  const response = await axiosInstance.delete(
    `/program-package/questions/${id}/`
  );
  return response.data;
};