
// import React, { useEffect, useState } from "react";
// import {
//   Modal,
//   Form,
//   Input,
//   Button,
//   Row,
//   Col,
//   Select,
//   message,
//   Upload,
//   Empty,
//   Card,
//   Divider,
//   Image,
//   Tooltip
// } from "antd";
// import { UploadOutlined, EyeOutlined, InfoCircleOutlined } from "@ant-design/icons";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   addUser,
//   updateUser,
//   fetchStudents,
// } from "../../../adminSlices/userSlice";
// import { fetchActivePrograms } from "../../../adminSlices/programSlice";
// import { fetchPackagesByProgram } from "../../../adminSlices/packageSlice";

// const { Option } = Select;

// /* ================= VALIDATION RULES ================= */
// const nameRules = [
//   { required: true, message: "This field is required" },
//   { min: 2, message: "Must be at least 2 characters" },
//   { pattern: /^[A-Za-z\s]+$/, message: "Only letters are allowed" },
// ];

// const emailRules = [
//   { required: true, message: "Email is required" },
//   { type: "email", message: "Enter a valid email address" },
// ];

// const phoneRules = [
//   { required: true, message: "Mobile number is required" },
//   { pattern: /^[0-9]{10}$/, message: "Mobile number must be 10 digits" },
// ];

// const classRules = [
//   { required: true, message: "Please select class / standard" },
// ];

// const amountRules = [
//   { required: true, message: "Please enter amount" },
//   { pattern: /^[0-9]+$/, message: "Amount must be numeric" },
// ];

// /* ================= COMPONENT ================= */
// const AddUserModal = ({ open, onClose, user, mode }) => {
//   const [form] = Form.useForm();
//   const dispatch = useDispatch();

//   const liveValues = Form.useWatch([], form);
//   const selectedPaymentType = Form.useWatch("payment_type", form);
//   const selectedProgramId = Form.useWatch("program", form);
//   const amount = Form.useWatch("amount", form);

//   const [fileList, setFileList] = useState([]);
//   const [previewUrl, setPreviewUrl] = useState(null);
//   const [uploadedFile, setUploadedFile] = useState(null);
//   const { activeList: programs = [], loading: programsLoading } = useSelector(
//     (state) => state.programs
//   );
//   const activePrograms = useSelector((state) => state.programs.activeList);

//   const { list: packages = [], loading: packagesLoading } = useSelector(
//     (state) => state.packages
//   );

//   const { loading } = useSelector((state) => state.users);

//   const modalMode = mode ?? (user ? "edit" : "add");
//   const isView = modalMode === "view";
//   const isEdit = modalMode === "edit";

//   const [classOptions] = useState([
//     "8",
//     "9",
//     "10",
//     "11",
//     "12",
//     "Engineering",
//     "Medical",
//     "Law",
//     "Design",
//     "Commerce",
//     "Arts",
//     "BBA",
//     "UG",
//     "PG",
//     "Others",
//   ]);

//   const selectedPackage = packages.find((p) => p.id === liveValues?.package);
//   const selectedProgram = programs.find((p) => p.id === selectedProgramId);
//   const isEngineeringProgram = selectedProgram?.name === "Engineering";
//   const totalPackageAmount = selectedPackage?.amount || selectedPackage?.price || selectedPackage?.total_amount || "";

//   useEffect(() => {
//     if (selectedPaymentType === "online") {
//       form.setFieldsValue({
//         method: "upi",
//       });
//     }

//     if (selectedPaymentType === "offline") {
//       form.setFieldsValue({
//         method: "cash",
//         transaction_id: undefined, // clear transaction id
//       });
//     }
//   }, [selectedPaymentType, form]);

//   // Auto-set payment type to online for Engineering program
//   useEffect(() => {
//     if (isEngineeringProgram) {
//       form.setFieldsValue({
//         payment_type: "online",
//         method: "upi",
//       });
//     }
//   }, [isEngineeringProgram, form]);

//   /* ================= UTILITY FUNCTIONS ================= */

//   // Extract name from "PE26 - Ravika" format
//   const extractName = (fullName) => {
//     if (!fullName) return "";

//     // Check if it contains " - " pattern
//     if (fullName.includes(" - ")) {
//       const parts = fullName.split(" - ");
//       // Return the last part (the actual name)
//       return parts[parts.length - 1].trim();
//     }

//     // If no pattern found, return as is
//     return fullName.trim();
//   };

//   /* ================= FETCH DATA ================= */
//   useEffect(() => {
//     if (open) {
//       dispatch(fetchActivePrograms());
//     }
//   }, [open, dispatch]);

//   /* ================= PREFILL FORM ================= */
//   useEffect(() => {
//     if (!open) {
//       form.resetFields();
//       setFileList([]);
//       setPreviewUrl(null);
//       setUploadedFile(null);
//       return;
//     }

//     if (user) {
//       console.log("📝 Prefilling form with user data...");

//       // Extract name from "PE26 - Ravika" format
//       const extractedFirstName = extractName(user.first_name);
//       const extractedLastName = user.last_name || ""; // Last name usually doesn't have prefix

//       // Extract payment data from multiple possible locations
//       const paymentData = {
//         amount: user.amount || user.profile?.amount || "",
//         payment_type: user.payment_type || user.profile?.payment_type || "",
//         method: user.method || user.profile?.method || "",
//         transaction_id: user.transaction_id || user.profile?.transaction_id || "",
//         proof_file: user.proof_file || user.profile?.proof_file || ""
//       };

//       console.log("💰 Extracted payment data:", paymentData);
//       console.log("👤 Name extracted:", {
//         original: user.first_name,
//         extracted: extractedFirstName,
//         last_name: extractedLastName
//       });

//       // Set form values with extracted name
//       const formValues = {
//         first_name: extractedFirstName,
//         last_name: extractedLastName,
//         email: user.email || "",
//         phone: user.phone || "",
//         study_class: user.study_class || undefined,
//         preferred_counselling_mode: user.preferred_counselling_mode || undefined,
//         amount: paymentData.amount || 0,
//         payment_type: paymentData.payment_type || "",
//         method: paymentData.method || "",
//         transaction_id: paymentData.transaction_id || "",
//         program: user.program_id || undefined,
//         package: user.package_id || undefined,
//       };

//       console.log("📋 Setting form values:", formValues);
//       form.setFieldsValue(formValues);

//       // Handle receipt file preview
//       if (paymentData.proof_file) {
//         console.log("📄 Setting receipt preview:", paymentData.proof_file);
//         setPreviewUrl(paymentData.proof_file);
//         setFileList([
//           {
//             uid: '-1',
//             name: 'receipt.jpg',
//             status: 'done',
//             url: paymentData.proof_file,
//           }
//         ]);
//       } else {
//         console.log("📄 No receipt file found");
//         setFileList([]);
//         setPreviewUrl(null);
//         setUploadedFile(null);
//       }

//       // Load packages if program exists
//       if (user.program_id) {
//         console.log("📦 Loading packages for program:", user.program_id);
//         dispatch(fetchPackagesByProgram(user.program_id));
//       }
//     } else {
//       console.log("🆕 No user data, resetting form for add mode");
//       form.resetFields();
//       setFileList([]);
//       setPreviewUrl(null);
//       setUploadedFile(null);
//     }
//   }, [open, user, dispatch, form]);

//   /* ================= CLEANUP PREVIEW ================= */
//   useEffect(() => {
//     return () => {
//       if (previewUrl && !previewUrl.startsWith('http')) {
//         URL.revokeObjectURL(previewUrl);
//       }
//     };
//   }, [previewUrl]);

//   /* ================= SUBMIT ================= */
//   const handleSubmit = (values) => {
//     const formData = new FormData();

//     console.log("🚀 Submitting form with values:", values);
//     console.log("📁 Uploaded file:", uploadedFile);
//     console.log("📋 File list:", fileList);

//     // Extract and clean first name (in case user entered prefix)
//     const cleanedFirstName = values.first_name.trim();
//     const cleanedLastName = values.last_name.trim();

//     console.log("👤 Names to submit:", {
//       first_name: cleanedFirstName,
//       last_name: cleanedLastName
//     });

//     // Normal fields - use cleaned names
//     formData.append("first_name", cleanedFirstName);
//     formData.append("last_name", cleanedLastName);
//     formData.append("email", values.email);
//     formData.append("phone", values.phone);
//     formData.append("study_class", values.study_class);
//     formData.append("program", values.program);
//     formData.append("package", values.package);
//     formData.append("preferred_counselling_mode", values.preferred_counselling_mode);
//     formData.append("amount", values.amount);
//     formData.append("payment_type", values.payment_type || "");
//     formData.append("method", values.method || "");

//     if (values.transaction_id) {
//       formData.append("transaction_id", values.transaction_id || "");
//     }

//     // ✅ FILE — Check both uploadedFile and fileList
//     let fileToUpload = null;

//     if (uploadedFile) {
//       // Use the file stored in state
//       fileToUpload = uploadedFile;
//       console.log("📤 Using uploadedFile from state:", uploadedFile.name);
//     } else if (fileList.length > 0 && fileList[0].originFileObj) {
//       // Use file from fileList
//       fileToUpload = fileList[0].originFileObj;
//       console.log("📤 Using file from fileList:", fileList[0].originFileObj.name);
//     }

//     if (fileToUpload) {
//       console.log("📎 Appending file to FormData:", fileToUpload.name);
//       formData.append("proof_file", fileToUpload);
//     } else {
//       console.log("📎 No file to upload");
//     }

//     // Debug: Log FormData contents
//     console.log("=== FormData Contents ===");
//     for (let [key, value] of formData.entries()) {
//       if (value instanceof File) {
//         console.log(`${key}:`, value.name, `(File, size: ${value.size} bytes)`);
//       } else {
//         console.log(`${key}:`, value);
//       }
//     }
//     console.log("=== End FormData ===");

//     const action = isEdit
//       ? updateUser({ id: user.id, payload: formData })
//       : addUser(formData);

//     dispatch(action)
//       .unwrap()
//       .then((response) => {
//         console.log("✅ API Response:", response);
//         message.success(
//           isEdit ? "User updated successfully" : "User added successfully"
//         );
//         dispatch(fetchStudents());
//         onClose();
//       })
//       .catch((error) => {
//         console.error("❌ Operation failed:", error);

//         // Check if errors object exists
//         if (error.errors) {
//           // Flatten all errors into a single string
//           const messages = Object.values(error.errors)
//             .flat()
//             .join(", "); // e.g., "Phone number already exists."

//           message.error(messages);
//         } else if (error.message) {
//           message.error(error.message);
//         } else {
//           message.error("Operation failed");
//         }
//       });
//   };

//   /* ================= HANDLE PROGRAM CHANGE ================= */
//   const handleProgramChange = (programId) => {
//     form.setFieldsValue({ package: undefined });
//     if (programId) dispatch(fetchPackagesByProgram(programId));
//   };

//   /* ================= FILE UPLOAD HANDLERS ================= */
//   const handleFileChange = ({ fileList: newFileList }) => {
//     console.log("📁 File change:", newFileList);
//     setFileList(newFileList);

//     if (newFileList.length > 0) {
//       const file = newFileList[0];
//       if (file.originFileObj) {
//         const url = URL.createObjectURL(file.originFileObj);
//         setPreviewUrl(url);
//         setUploadedFile(file.originFileObj);
//         console.log("📁 New file selected:", file.originFileObj.name);
//       } else if (file.url) {
//         setPreviewUrl(file.url);
//         setUploadedFile(null);
//         console.log("📁 Existing file URL:", file.url);
//       }
//     } else {
//       setPreviewUrl(null);
//       setUploadedFile(null);
//       console.log("🗑️ File removed");
//     }
//   };

//   const handleBeforeUpload = (file) => {
//     console.log("📁 Before upload:", file.name);
//     return false;
//   };

//   /* ================= UI ================= */
//   return (
//     <Modal
//       open={open}
//       onCancel={onClose}
//       footer={null}
//       // destroyOnClose
//       title={isEdit ? "Edit User" : isView ? "View User" : "Add User"}
//       width="100%"
//       style={{ maxWidth: 1100 }}

//     >

//       <Row gutter={[24, 24]}>
//         {/* LEFT SIDE FORM */}
//         <Col xs={24} lg={14}>
//           <div style={{ maxHeight: "75vh", overflowY: "auto", paddingRight: 8 }}>

//             <Form form={form} layout="vertical" onFinish={handleSubmit} >
//               <Row gutter={16}>
//                 <Col xs={24} md={12}>
//                   <Form.Item name="first_name" label="First Name" rules={isView ? [] : nameRules}>
//                     <Input disabled={isView} placeholder="Enter first name" />
//                   </Form.Item>
//                 </Col>

//                 <Col xs={24} md={12}>
//                   <Form.Item name="last_name" label="Last Name" rules={isView ? [] : nameRules}>
//                     <Input disabled={isView} placeholder="Enter last name" />
//                   </Form.Item>
//                 </Col>

//                 <Col xs={24} md={12}>
//                   <Form.Item name="email" label="Email" rules={isView ? [] : emailRules}>
//                     <Input disabled={isView} placeholder="Enter email address" />
//                   </Form.Item>
//                 </Col>

//                 <Col xs={24} md={12}>
//                   <Form.Item name="phone" label="Mobile Number(Whatsapp)" rules={isView ? [] : phoneRules}>
//                     <Input disabled={isView} placeholder="Enter 10-digit mobile number" maxLength={10} />
//                   </Form.Item>
//                 </Col>

//                 {/* CLASS DROPDOWN */}
//                 <Col xs={24} md={12}>
//                   <Form.Item name="study_class" label="Class / STD" rules={isView ? [] : classRules}>
//                     <Select disabled={isView} placeholder="Select class / standard">
//                       {classOptions.map((cls) => (
//                         <Option key={cls} value={cls}>
//                           {cls}
//                         </Option>
//                       ))}
//                     </Select>
//                   </Form.Item>
//                 </Col>

//                 <Col span={12}>
//                   <Form.Item
//                     label={
//                       <span>
//                         Program
//                         {isEdit && (
//                           <Tooltip title="Program cannot be changed in edit mode , please delete the user and recreate if you want to change program">
//                             <InfoCircleOutlined style={{ color: "#1890ff", cursor: "pointer", marginLeft: 6 }} />
//                           </Tooltip>
//                         )}
//                       </span>
//                     }
//                     name="program"
//                     rules={isView ? [] : [{ required: true, message: "Please select program" }]}
//                   >
//                     <Select
//                       placeholder={programsLoading ? "Loading..." : "Select program"}
//                       loading={programsLoading}
//                       onChange={handleProgramChange}
//                       allowClear
//                       disabled={isView || isEdit}
//                     >
//                       {programs.map((p) => (
//                         <Option key={p.id} value={p.id}>
//                           {p.name}
//                         </Option>
//                       ))}
//                     </Select>
//                   </Form.Item>
//                 </Col>

//                 <Col span={12}>
//                   <Form.Item
//                     label={
//                       <span>
//                         Counselling Services
//                         {isEdit && (
//                           <Tooltip title="Counselling service cannot be changed in edit mode , please delete the user and recreate if you want to change counselling service">
//                             <InfoCircleOutlined style={{ color: "#1890ff", cursor: "pointer", marginLeft: 6 }} />
//                           </Tooltip>
//                         )}
//                       </span>
//                     }
//                     name="package"
//                     rules={isView ? [] : [{ required: true, message: "Please select counselling service" }]}
//                   >
//                     <Select
//                       placeholder={packagesLoading ? "Loading..." : "Select counselling service"}
//                       loading={packagesLoading}
//                       allowClear
//                       disabled={isView || isEdit}
//                     >
//                       {packages.map((p) => (
//                         <Option key={p.id} value={p.id}>
//                           {p.name}
//                         </Option>
//                       ))}
//                     </Select>
//                   </Form.Item>
//                 </Col>

//                 <Col xs={24} md={12}>
//                   <Form.Item
//                     name="preferred_counselling_mode"
//                     label="Preferred Counselling Mode"
//                     initialValue="online"
//                     required
//                   >
//                     <Select disabled={isView} placeholder="Select counselling mode">
//                       <Option value="online">Online</Option>
//                       <Option value="offline">Offline</Option>
//                     </Select>
//                   </Form.Item>
//                 </Col>

//                 <Col xs={24} sm={12}>
//                   <Form.Item
//                     name="amount"
//                     label={
//                       <span>
//                         Fees Paid{" "}
//                         {isEdit && (
//                           <Tooltip title="If you want to update paid amount, you need to update in Payments module">
//                             <InfoCircleOutlined style={{ color: "#1890ff", cursor: "pointer" }} />
//                           </Tooltip>
//                         )}
//                       </span>
//                     }
//                     dependencies={["package"]}
//                     rules={[
//                       { required: true, message: "Please enter the amount paid" },
//                       {
//                         validator: (_, value) => {
//                           const numericValue = Number(value);

//                           if (!value && value !== 0) return Promise.resolve();

//                           if (isNaN(numericValue)) {
//                             return Promise.reject("Amount must be a valid number");
//                           }

//                           if (numericValue < 0) {
//                             return Promise.reject("Amount cannot be negative");
//                           }

//                           // For Engineering program, amount must equal package price exactly
//                           if (isEngineeringProgram) {
//                             if (numericValue !== totalPackageAmount) {
//                               return Promise.reject(
//                                 `For Engineering program, Fees Paid must be exactly ₹${totalPackageAmount}(service price)`
//                               );
//                             }
//                             return Promise.resolve();
//                           }

//                           if (numericValue !== 0 && numericValue % 100 !== 0) {
//                             return Promise.reject(
//                               "Amount must be ₹0 or in multiples of ₹100"
//                             );
//                           }

//                           if (numericValue > totalPackageAmount) {
//                             return Promise.reject(
//                               `Amount cannot exceed ₹${totalPackageAmount}`
//                             );
//                           }

//                           return Promise.resolve();
//                         },
//                       },
//                     ]}
//                   >
//                     <Input
//                       inputMode="numeric"
//                       disabled={isEdit}
//                       placeholder="Enter amount"
//                     />
//                   </Form.Item>
//                 </Col>

//               </Row>

//               {amount > 0 && (
//                 <>
//                   <Row gutter={16}>
//                     <Col xs={24} md={12}>
//                       <Form.Item name="payment_type" label="Payment Type" rules={isView ? [] : [{ required: true }]}>
//                         <Select disabled={isView} placeholder="Select payment type">
//                           {!isEngineeringProgram && <Option value="offline">Offline</Option>}
//                           <Option value="online">Online</Option>
//                         </Select>
//                       </Form.Item>
//                     </Col>

//                     <Col xs={24} md={12}>
//                       <Form.Item name="method" label="Payment Method" rules={isView ? [] : [{ required: true }]}>
//                         <Select disabled={isView} placeholder="Select payment method">
//                           <Option value="upi">UPI</Option>
//                           {!isEngineeringProgram && <Option value="cash">Cash</Option>}
//                         </Select>
//                       </Form.Item>
//                     </Col>

//                     {selectedPaymentType === "online" && (
//                       <Col xs={24}>
//                         <Form.Item
//                           name="transaction_id"
//                           label="Transaction ID"
//                         >
//                           <Input disabled={isView} placeholder="Enter transaction ID" />
//                         </Form.Item>
//                       </Col>
//                     )}

//                   </Row>

//                   <Form.Item label="Upload Receipt" name="receipt">
//                     <Upload
//                       beforeUpload={handleBeforeUpload}
//                       maxCount={1}
//                       fileList={fileList}
//                       onChange={handleFileChange}
//                       onRemove={() => {
//                         setFileList([]);
//                         setPreviewUrl(null);
//                         setUploadedFile(null);
//                         console.log("🗑️ File removed from upload");
//                       }}
//                       disabled={isView}
//                     >
//                       <Button icon={<UploadOutlined />} disabled={isView}>
//                         {fileList.length ? 'Change Receipt' : 'Upload Receipt'}
//                       </Button>
//                     </Upload>
//                     {/* {uploadedFile && (
//                 <div style={{ marginTop: 8, color: '#1890ff' }}>
//                   File selected: {uploadedFile.name}
//                 </div>
//               )} */}
//                   </Form.Item>
//                 </>
//               )}

//               {!isView && (
//                 <div style={{ textAlign: "right" }}>
//                   <Button type="primary" htmlType="submit" loading={loading}>
//                     {isEdit ? "Update User" : "Add User"}
//                   </Button>
//                 </div>
//               )}
//             </Form>
//           </div>
//         </Col>

//         {/* RIGHT SIDE LIVE PREVIEW */}
//         <Col xs={24} lg={10}>
//           <div style={{ maxHeight: "75vh", overflowY: "auto", paddingRight: 8 }}>
//             <Card title="Preview">
//               {(!form.getFieldValue('first_name') && !previewUrl) ? (
//                 <Empty description="Fill the form to see preview" />
//               ) : (
//                 <>
//                   <p><b>Name:</b> {form.getFieldValue('first_name')} {form.getFieldValue('last_name')}</p>
//                   <p><b>Email:</b> {form.getFieldValue('email')}</p>
//                   <p><b>Mobile:</b> {form.getFieldValue('phone')}</p>
//                   <p><b>Class:</b> {form.getFieldValue('study_class') || 'Not selected'}</p>

//                   <p><b>Program:</b> {
//                     programs.find(p => p.id === form.getFieldValue('program'))?.name || 'Not selected'
//                   }</p>
//                   <p><b>Counselling Services:</b> {
//                     packages.find(p => p.id === form.getFieldValue('package'))?.name || 'Not selected'
//                   }</p>

//                   <p><b>Amount:</b> ₹{form.getFieldValue('amount') || '0'} / ₹{totalPackageAmount}</p>

//                   <Divider />

//                   <p><b>Payment Type:</b> {form.getFieldValue('payment_type') || 'Not selected'}</p>
//                   <p><b>Method:</b> {form.getFieldValue('method') || 'Not selected'}</p>
//                   <p><b>Transaction ID:</b> {form.getFieldValue('transaction_id') || 'Not provided'}</p>

//                   <Divider />

//                   {previewUrl ? (
//                     <div>
//                       <p><b>Receipt:</b></p>
//                       <Image
//                         src={previewUrl}
//                         alt="Receipt"
//                         style={{
//                           width: "100%",
//                           maxHeight: 300,
//                           objectFit: 'contain',
//                           border: '1px solid #d9d9d9',
//                           borderRadius: 8
//                         }}
//                         preview={{
//                           mask: <><EyeOutlined /> View</>
//                         }}
//                       />
//                     </div>
//                   ) : (
//                     <Empty description="No receipt uploaded" />
//                   )}
//                 </>
//               )}
//             </Card>
//           </div>
//         </Col>
//       </Row>
//     </Modal>
//   );
// };

// export default AddUserModal;



import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Row,
  Col,
  Select,
  message,
  Upload,
  Empty,
  Card,
  Divider,
  Image,
  Tooltip,
} from "antd";
import { UploadOutlined, EyeOutlined, DeleteOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  addUser,
  updateUser,
  fetchStudents,
} from "../../../adminSlices/userSlice";
import { fetchProgramsExcludeHandholding } from "../../../adminSlices/programSlice";
import { fetchPackagesByProgram } from "../../../adminSlices/packageSlice";

const { Option } = Select;

const CLASS_OPTIONS = [
  "8", "9", "10", "11", "12",
  "Engineering", "Medical", "Law", "Design",
  "Commerce", "Arts", "BBA", "UG", "PG", "Others",
];

const ProgramCard = ({
  field,
  index,
  fields,
  form,
  programs,
  programsLoading,
  isView,
  isEdit,
  programPackages,
  programPkgLoading,
  watchedPrograms,
  onProgramChange,
  onRemoveRow,
  onAdd,
}) => {
  const rowData = watchedPrograms[index] || {};
  const pkgs = programPackages[index] || [];
  const pkgsLoading = programPkgLoading[index] || false;

  return (
    <Card
      style={{ marginBottom: 16, borderRadius: 8, border: "1px solid #e8e8e8" }}
      styles={{ body: { padding: "12px 16px 8px" } }}
      title={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 14, color: "#1677ff" }}>
            {index === 0 ? "Program 1" : `Program ${index + 1}`}
            {isEdit && (
              <Tooltip title="Program and counselling service cannot be changed in edit mode, please delete the user and recreate if you want to change program">
                <InfoCircleOutlined style={{ color: "#1890ff", cursor: "pointer" }} />
              </Tooltip>
            )}
          </span>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            {index === 0 && !isView && !isEdit && (
              <span
                onClick={onAdd}
                style={{ color: "#1677ff", cursor: "pointer", fontSize: 13, fontWeight: 500 }}
              >
                + Add Program
              </span>
            )}
            {fields.length > 1 && !isView && !isEdit && (
              <DeleteOutlined
                onClick={() => onRemoveRow(index, field.name)}
                style={{ color: "red", cursor: "pointer", fontSize: 14 }}
              />
            )}
          </div>
        </div>
      }
    >
      <Row gutter={[16, 0]}>

        {/* 1. Program */}
        <Col xs={24} sm={12}>
          <Form.Item
            {...field}
            name={[field.name, "program"]}
            label={
              <span>Program</span>
            }
            rules={isView ? [] : [{ required: true, message: "Please select program" }]}
          >
            <Select
              placeholder="Select program"
              loading={programsLoading}
              disabled={isView || isEdit}
              onChange={onProgramChange}
              allowClear
            >
              {programs.map((p) => (
                <Option key={p.id} value={p.id}>{p.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        {/* 2. Counselling Service */}
        <Col xs={24} sm={12}>
          <Form.Item
            {...field}
            name={[field.name, "package"]}
            label={
              <span>Counselling Service</span>
            }
            rules={isView ? [] : [{ required: true, message: "Please select service" }]}
          >
            <Select
              placeholder="Select counselling service"
              loading={pkgsLoading}
              disabled={isView || isEdit}
              allowClear
            >
              {/* {pkgs.map((p) => (
                <Option key={p.id} value={p.id}>{p.name}</Option>
              ))} */}
              {pkgs.map((p) => {
                const selectedPackages = (watchedPrograms || [])
                  .map((item) => item?.package)
                  .filter(Boolean);

                const isSelectedElsewhere =
                  selectedPackages.includes(p.id) &&
                  rowData?.package !== p.id;

                return (
                  <Option
                    key={p.id}
                    value={p.id}
                    disabled={isSelectedElsewhere}
                  >
                    {p.name}
                    {isSelectedElsewhere ? " " : ""}
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
        </Col>

      </Row>
    </Card>
  );
};

const AddUserModal = ({ open, onClose, user, mode }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  // Top-level watched fields for live preview
  const watchedFirstName = Form.useWatch("first_name", form);
  const watchedLastName = Form.useWatch("last_name", form);
  const watchedEmail = Form.useWatch("email", form);
  const watchedPhone = Form.useWatch("phone", form);
  const watchedPrograms = Form.useWatch("programs", form) || [];
  const watchedStudyClass = Form.useWatch("study_class", form);
  const watchedPreferredMode = Form.useWatch("preferred_counselling_mode", form);
  const watchedAmount = Form.useWatch("amount", form);
  const watchedPaymentType = Form.useWatch("payment_type", form);
  const watchedMethod = Form.useWatch("method", form);
  const watchedTransactionId = Form.useWatch("transaction_id", form);

  // Per-row state maps
  const [programPackages, setProgramPackages] = useState({});
  const [programPkgLoading, setProgramPkgLoading] = useState({});
  const [commonFileList, setCommonFileList] = useState([]);
  const [commonPreviewUrl, setCommonPreviewUrl] = useState(null);

  const lastFetchIdx = useRef(null);

  // Redux
  const { excludeHandholdingList: programs = [], loading: programsLoading } = useSelector((s) => s.programs);
  const { list: reduxPackages = [] } = useSelector((s) => s.packages);
  const { loading } = useSelector((s) => s.users);

  const modalMode = mode ?? (user ? "edit" : "add");
  const isView = modalMode === "view";
  const isEdit = modalMode === "edit";

  // ── Fetch packages for a row ─────────────────────────────────────────────
  const loadPackagesForIndex = (idx, programId) => {
    setProgramPkgLoading((prev) => ({ ...prev, [idx]: true }));
    dispatch(fetchPackagesByProgram(programId))
      .unwrap()
      .then((packages) => {
        setProgramPackages((prev) => ({
          ...prev,
          [idx]: packages,
        }));
      })
      .catch(() => {
        setProgramPackages((prev) => ({
          ...prev,
          [idx]: [],
        }));
      })
      .finally(() => {
        setProgramPkgLoading((prev) => ({ ...prev, [idx]: false }));
      });
  };

  // Fetch programs on open
  useEffect(() => {
    if (open) {
      dispatch(fetchProgramsExcludeHandholding());
    }
  }, [open, dispatch]);

  // Helper: strip "PE26 - " prefix from name
  const extractName = (fullName) => {
    if (!fullName) return "";
    if (fullName.includes(" - ")) {
      const parts = fullName.split(" - ");
      return parts[parts.length - 1].trim();
    }
    return fullName.trim();
  };

  // Reset / prefill on open
  useEffect(() => {
    if (!open) {
      form.resetFields();
      setCommonFileList([]);
      setCommonPreviewUrl(null);
      setProgramPackages({});
      lastFetchIdx.current = null;
      return;
    }

    if (user) {
      // ── Edit / View mode ────────────────────────────────────────────────
      const paymentData = {
        amount: user.amount || user.profile?.amount || 0,
        payment_type: user.payment_type || user.profile?.payment_type || "",
        method: user.method || user.profile?.method || "",
        transaction_id: user.transaction_id || user.profile?.transaction_id || "",
        proof_file: user.proof_file || user.profile?.proof_file || "",
        price: user.price || user.profile?.price || 0,
      };

      const mappedPrograms =
        Array.isArray(user.programs) && user.programs.length > 0
          ? user.programs.map((item) => ({
            program: item.program_id || item.program || undefined,
            package: item.package?.id || item.package_id || item.package || undefined,
          }))
          : [{
            program: user.program_id || undefined,
            package: user.package_id || undefined,
          }];

      form.setFieldsValue({
        first_name: extractName(user.first_name),
        last_name: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
        study_class: user.study_class || undefined,
        preferred_counselling_mode: user.preferred_counselling_mode || "online",
        amount: paymentData.amount,
        payment_type: paymentData.payment_type,
        method: paymentData.method,
        transaction_id: paymentData.transaction_id,
        programs: mappedPrograms,
      });

      // Load packages for each program slot
      mappedPrograms.forEach((row, idx) => {
        if (row.program) loadPackagesForIndex(idx, row.program);
      });

      // Set shared receipt preview
      if (paymentData.proof_file) {
        setCommonPreviewUrl(paymentData.proof_file);
        setCommonFileList([
          { uid: "-1", name: "receipt.jpg", status: "done", url: paymentData.proof_file },
        ]);
      }
    } else {
      // ── Add mode ─────────────────────────────────────────────────────────
      form.resetFields();
      form.setFieldsValue({ programs: [{}], preferred_counselling_mode: "online" });
      setCommonFileList([]);
      setCommonPreviewUrl(null);
      setProgramPackages({});
      lastFetchIdx.current = null;
    }
  }, [open, user]); // eslint-disable-line

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleProgramChangeForIndex = (idx, programId) => {
    const progs = form.getFieldValue("programs") || [];
    progs[idx] = { ...progs[idx], package: undefined };

    const selectedProgram = programs.find((p) => p.id === programId);
    const shouldDefaultOnline = selectedProgram?.name?.toLowerCase() === "engineering";

    const nextValues = { programs: [...progs] };
    if (shouldDefaultOnline) {
      const currentPaymentType = form.getFieldValue("payment_type");
      if (!currentPaymentType) {
        nextValues.payment_type = "online";
        if (!form.getFieldValue("method")) {
          nextValues.method = "upi";
        }
      }
    }

    form.setFieldsValue(nextValues);
    loadPackagesForIndex(idx, programId);
  };

  const handleFileChange = ({ fileList: newList }) => {
    setCommonFileList(newList);
    if (newList.length > 0 && newList[0].originFileObj) {
      setCommonPreviewUrl(URL.createObjectURL(newList[0].originFileObj));
    } else if (newList.length > 0 && newList[0].url) {
      setCommonPreviewUrl(newList[0].url);
    } else {
      setCommonPreviewUrl(null);
    }
  };

  const handleRemoveRow = (idx, removeFn, fieldName) => {
    removeFn(fieldName);
    setProgramPackages((prev) => { const n = { ...prev }; delete n[idx]; return n; });
    setProgramPkgLoading((prev) => { const n = { ...prev }; delete n[idx]; return n; });
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (values) => {
    const formData = new FormData();

    formData.append("first_name", values.first_name.trim());
    formData.append("last_name", values.last_name.trim());
    formData.append("email", values.email);
    formData.append("phone", values.phone);

    // Append repeated flat program/package fields instead of a JSON array
    (values.programs || []).forEach((p) => {
      if (p.program) {
        formData.append("program", p.program);
      }
      if (p.package) {
        formData.append("package", p.package);
      }
    });

    formData.append("study_class", values.study_class);
    formData.append("preferred_counselling_mode", values.preferred_counselling_mode);
    formData.append("amount", values.amount);
    formData.append("payment_type", values.payment_type || "");
    formData.append("method", values.method || "");
    formData.append("transaction_id", values.transaction_id || "");

    // Attach shared receipt file
    if (commonFileList?.[0]?.originFileObj) {
      formData.append("proof_file", commonFileList[0].originFileObj);
    }

    const action = isEdit
      ? updateUser({ id: user.id, payload: formData })
      : addUser(formData);

    dispatch(action)
      .unwrap()
      .then(() => {
        message.success(isEdit ? "User updated successfully" : "User added successfully");
        dispatch(fetchStudents());
        onClose();
      })
      .catch((error) => {
        if (error.errors) {
          message.error(Object.values(error.errors).flat().join(", "));
        } else if (error.message) {
          message.error(error.message);
        } else {
          message.error("Operation failed");
        }
      });
  };


  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      // destroyOnClose
      title={isEdit ? "Edit User" : isView ? "View User" : "Add User"}
      width="100%"
      style={{ width: "100%", maxWidth: 1100, overflowX: "hidden" }}
      bodyStyle={{ padding: 0, overflowX: "hidden" }}
    >
      <div style={{ maxHeight: "80vh", overflowY: "auto", overflowX: "hidden", paddingRight: 8, minWidth: 0 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={[24, 0]}>

            {/* ══════════════ LEFT COLUMN ══════════════ */}
            <Col xs={24} lg={14}>

              {/* Personal details */}
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="first_name" label="First Name"
                    rules={isView ? [] : [
                      { required: true, message: "This field is required" },
                      { min: 2, message: "Must be at least 2 characters" },
                      { pattern: /^[A-Za-z\s]+$/, message: "Only letters are allowed" },
                    ]}
                  >
                    <Input disabled={isView} placeholder="Enter first name" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="last_name" label="Last Name"
                    rules={isView ? [] : [
                      { required: true, message: "This field is required" },
                      { min: 2, message: "Must be at least 2 characters" },
                      { pattern: /^[A-Za-z\s]+$/, message: "Only letters are allowed" },
                    ]}
                  >
                    <Input disabled={isView} placeholder="Enter last name" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="email" label="Email"
                    rules={isView ? [] : [
                      { required: true, message: "Email is required" },
                      { type: "email", message: "Enter a valid email address" },
                    ]}
                  >
                    <Input disabled={isView || isEdit} placeholder="Enter email address" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="phone" label="Mobile Number (WhatsApp)"
                    rules={isView ? [] : [
                      { required: true, message: "Mobile number is required" },
                      { pattern: /^[0-9]{10}$/, message: "Mobile number must be 10 digits" },
                    ]}
                  >
                    <Input disabled={isView} placeholder="Enter 10-digit mobile number" maxLength={10} />
                  </Form.Item>
                </Col>
              </Row>

              <Divider style={{ margin: "4px 0 12px" }} />

              {/* Program cards */}
              <Form.List name="programs">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field, index) => (
                      <ProgramCard
                        key={field.key}
                        field={field}
                        index={index}
                        fields={fields}
                        form={form}
                        programs={programs}
                        programsLoading={programsLoading}
                        isView={isView}
                        isEdit={isEdit}
                        programPackages={programPackages}
                        programPkgLoading={programPkgLoading}
                        watchedPrograms={watchedPrograms}
                        onProgramChange={(programId) => handleProgramChangeForIndex(index, programId)}
                        onRemoveRow={(idx, fieldName) => handleRemoveRow(idx, remove, fieldName)}
                        onAdd={() => add({})}
                      />
                    ))}
                  </>
                )}
              </Form.List>

              <Divider style={{ margin: "12px 0 12px" }}></Divider>
              <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="study_class"
                    label="Class / STD"
                    rules={isView ? [] : [{ required: true, message: "Please select class" }]}
                  >
                    <Select placeholder="Select class / standard" disabled={isView}>
                      {CLASS_OPTIONS.map((c) => (
                        <Option key={c} value={c}>{c}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="preferred_counselling_mode"
                    label="Preferred Counselling Mode"
                    rules={isView ? [] : [{ required: true, message: "Please select mode" }]}
                  >
                    <Select placeholder="Select mode" disabled={isView}>
                      <Option value="online">Online</Option>
                      <Option value="offline">Offline</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="amount"
                    label={
                      <span>
                        Fees Paid
                        {isEdit && (
                          <Tooltip title="To update paid amount, use the Payments module">
                            <InfoCircleOutlined style={{ color: "#1890ff", cursor: "pointer", marginLeft: 6 }} />
                          </Tooltip>
                        )}
                      </span>
                    }
                    rules={
                      isView
                        ? []
                        : [
                          { required: true, message: "Please enter the amount paid" },
                          {
                            validator: (_, value) => {
                              const numericValue = Number(value);

                              if (
                                value === undefined ||
                                value === null ||
                                value === ""
                              ) {
                                return Promise.resolve();
                              }

                              if (isNaN(numericValue)) {
                                return Promise.reject("Amount must be a valid number");
                              }

                              if (numericValue < 0) {
                                return Promise.reject("Amount cannot be negative");
                              }

                              if (numericValue !== 0 && numericValue % 100 !== 0) {
                                return Promise.reject("Amount must be ₹0 or multiples of ₹100");
                              }

                              // Calculate total package amount
                              const totalPackageAmount = watchedPrograms.reduce((sum, prog, idx) => {
                                const pkgs = programPackages[idx] || [];
                                const price =
                                  pkgs.find((p) => p.id === prog?.package)?.price || 0;

                                return sum + Number(price);
                              }, 0);

                              // Check if Engineering program exists
                              const firstProgram = watchedPrograms?.[0];

                              const isFirstProgramEngineering =
                                programs.find(
                                  (p) => p.id === firstProgram?.program
                                )?.name === "Engineering";

                              // Engineering condition
                              if (isFirstProgramEngineering) {
                                if (numericValue !== totalPackageAmount) {
                                  return Promise.reject(
                                    `For Engineering program, Fees Paid must be exactly ₹${totalPackageAmount}`
                                  );
                                }

                                return Promise.resolve();
                              }

                              // Other programs condition
                              if (numericValue > totalPackageAmount) {
                                return Promise.reject(
                                  `Fees Paid cannot exceed total package price of ₹${totalPackageAmount}`
                                );
                              }

                              return Promise.resolve();
                            },
                          }
                        ]
                    }
                  >
                    <Input
                      type="text"
                      placeholder="Enter amount"
                      disabled={isView || isEdit}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="payment_type"
                    label="Payment Type"
                    rules={isView ? [] : [{
                      validator: (_, value) => {
                        if (Number(watchedAmount) > 0 && !value) {
                          return Promise.reject("Please select payment type");
                        }
                        return Promise.resolve();
                      },
                    }]}
                  >
                    <Select
                      placeholder="Select payment type"
                      disabled={isView}
                      onChange={(val) => {
                        form.setFieldsValue({
                          method: val === "online" ? "upi" : "cash",
                          transaction_id: val === "offline" ? "" : form.getFieldValue("transaction_id"),
                        });
                      }}
                    >
                      <Option value="online">Online</Option>
                      <Option value="offline">Offline</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="method"
                    label="Payment Method"
                    rules={isView ? [] : [{
                      validator: (_, value) => {
                        if (Number(watchedAmount) > 0 && !value) {
                          return Promise.reject("Please select method");
                        }
                        return Promise.resolve();
                      },
                    }]}
                  >
                    <Select placeholder="Select payment method" disabled={isView || !watchedPaymentType}>
                      {watchedPaymentType === "online" && <Option value="upi">UPI</Option>}
                      {watchedPaymentType === "offline" && <Option value="cash">Cash</Option>}
                    </Select>
                  </Form.Item>
                </Col>

                {watchedPaymentType === "online" && (
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="transaction_id"
                      label="Transaction ID"
                      rules={[
                        {
                          required: true,
                          message: "Please enter transaction ID",
                        },
                      ]}
                    >
                      <Input placeholder="Enter transaction ID" disabled={isView} />
                    </Form.Item>
                  </Col>
                )}

                <Col xs={24}>
                  <Form.Item label="Upload Receipt">
                    <Upload
                      beforeUpload={() => false}
                      maxCount={1}
                      fileList={commonFileList}
                      onChange={handleFileChange}
                      onRemove={() => handleFileChange({ fileList: [] })}
                      accept="image/*,application/pdf"
                      disabled={isView}
                    >
                      <Button icon={<UploadOutlined />} disabled={isView} block>
                        {commonFileList.length ? "Change Receipt" : "Upload Receipt"}
                      </Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>

              {!isView && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                  <Button type="primary" htmlType="submit" loading={loading} style={{ width: 140 }}>
                    {isEdit ? "Update User" : "Add User"}
                  </Button>
                </div>
              )}
            </Col>

            {/* ══════════════ RIGHT PREVIEW ══════════════ */}
            <Col xs={24} lg={10}>
              <Card
                title="Live Preview"
                style={{ position: "sticky", top: 0 }}
                styles={{ body: { padding: 16 } }}
              >
                {!watchedFirstName ? (
                  <Empty description="Fill the form to see preview" />
                ) : (
                  <>
                    <p><b>Name:</b>   {watchedFirstName} {watchedLastName}</p>
                    <p><b>Email:</b>  {watchedEmail}</p>
                    <p><b>Mobile:</b> {watchedPhone}</p>

                    {watchedPrograms.map((prog, idx) => {
                      const pkgs = programPackages[idx] || [];
                      const progName = programs.find((p) => p.id === prog?.program)?.name;
                      const pkgName = pkgs.find((p) => p.id === prog?.package)?.name;
                      const pkgPrice = pkgs.find((p) => p.id === prog?.package)?.price;

                      return (
                        <div key={idx}>
                          <Divider
                            orientation="left"
                            plain
                            style={{ fontSize: 13, color: "#888", margin: "10px 0" }}
                          >
                            {idx === 0 ? "Program 1" : `Program ${idx + 1}`}
                          </Divider>
                          <p><b>Program:</b>  {progName || "-"}</p>
                          <p><b>Service:</b>  {pkgName || "-"}</p>
                          <p><b>Price:</b> ₹{pkgPrice || "0"}</p>
                        </div>
                      );
                    })}

                    <Divider
                      orientation="left"
                      plain
                      style={{ fontSize: 13, color: "#888", margin: "10px 0" }}
                    >

                    </Divider>
                    <p><b>Class:</b> {watchedStudyClass || "-"}</p>
                    <p><b>Mode:</b> {watchedPreferredMode || "-"}</p>
                    <p>
                      <b>Amount:</b> ₹{watchedAmount || "0"} / ₹{
                        watchedPrograms.reduce((sum, prog, idx) => {
                          const pkgs = programPackages[idx] || [];
                          const price = pkgs.find((p) => p.id === prog?.package)?.price || 0;
                          return sum + Number(price);
                        }, 0)
                      }
                    </p>
                    {Number(watchedAmount) > 0 && (
                      <>
                        <p><b>Payment Type:</b>   {watchedPaymentType || "-"}</p>
                        <p><b>Payment Method:</b> {watchedMethod || "-"}</p>
                        {watchedTransactionId && (
                          <p><b>Transaction ID:</b> {watchedTransactionId}</p>
                        )}
                      </>
                    )}
                    <p><b>Payment Receipt:</b></p>
                    {commonPreviewUrl ? (
                      <Image
                        src={commonPreviewUrl}
                        style={{
                          width: "100%",
                          maxHeight: 160,
                          borderRadius: 6,
                          objectFit: "contain",
                          marginTop: 4,
                          border: "1px solid #d9d9d9",
                        }}
                        preview={{ mask: <EyeOutlined /> }}
                      />
                    ) : (
                      <Empty description="No receipt uploaded" imageStyle={{ height: 40 }} />
                    )}
                  </>
                )}
              </Card>
            </Col>

          </Row>
        </Form>
      </div>
    </Modal>
  );
};

export default AddUserModal;