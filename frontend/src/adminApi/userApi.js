import axiosInstance from "../axiosInstance";

/* ---------- ADD USER ---------- */
export const addUserApi = async (payload) => {
  const response = await axiosInstance.post(
    "/lead-registeration/add-users/",
    payload
  );
  return response.data;
};

/* ---------- UPDATE USER ---------- */
export const updateUserApi = async (id, payload) => {
  const response = await axiosInstance.put(
    `/lead-registeration/add-users/${id}/`,
    payload
  );
  return response.data;
};

/* ---------- FETCH STUDENTS ---------- */
export const fetchStudentsApi = async () => {
  const response = await axiosInstance.get("/only-students/");
  return response.data;
};

/* ---------- DELETE USER ---------- */
export const deleteUserApi = async (id) => {
  const response = await axiosInstance.delete(`/users/${id}/`);
  return response.data;
};
