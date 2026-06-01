import axiosInstance from "../axiosInstance";

/* ---------- ADD USER ---------- */
// export const addUserApi = async (payload) => {
//   const response = await axiosInstance.post(
//     "/lead-registeration/add-users/",
//     payload
//   );
//   return response.data;
// };

/* ---------- ADD USER ---------- */
export const addUserApi = async (payload) => {
  // Check if payload is FormData
  const isFormData = payload instanceof FormData;
  
  const config = isFormData 
    ? {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    : {};
    
  const response = await axiosInstance.post(
    "/lead-registeration/add-users/",
    payload,
    config
  );
  return response.data;
};

/* ---------- UPDATE USER ---------- */
export const updateUserApi = async (id, payload) => {
  // Check if payload is FormData
  const isFormData = payload instanceof FormData;
  
  const config = isFormData 
    ? {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    : {};
    
  const response = await axiosInstance.put(
    `/lead-registeration/add-users/${id}/`,
    payload,
    config
  );
  return response.data;
};


// /* ---------- UPDATE USER ---------- */
// export const updateUserApi = async (id, payload) => {
//   const response = await axiosInstance.put(
//     `/lead-registeration/add-users/${id}/`,
//     payload
//   );
//   return response.data;
// };

/* ---------- FETCH STUDENTS ---------- */
export const fetchStudentsApi = async () => {
  const response = await axiosInstance.get("/only-students/");
  return response.data;
};

/* ---------- DELETE USER ---------- */
// export const deleteUserApi = async (id) => {
//   const response = await axiosInstance.delete(`/users/${id}/`);
//   return response.data;
// };

/* ---------- DELETE USER ---------- */
export const deleteUserApi = async (id) => {
  const response = await axiosInstance.delete(
    `/lead-registeration/add-users/${id}/`
  );

  return response.data;
};

/* ---------- FETCH STUDENT JOURNEY ---------- */
export const fetchStudentJourneyApi = async (studentId) => {
  const response = await axiosInstance.get(
    `/lead-registeration/student/${studentId}/journey/`
  );
  return response.data;
};
