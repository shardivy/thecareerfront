import React, { useEffect, useState } from "react";
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
} from "antd";
import { UploadOutlined, EyeOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  addUser,
  updateUser,
  fetchStudents,
} from "../../../adminSlices/userSlice";
import { fetchActivePrograms } from "../../../adminSlices/programSlice";
import { fetchPackagesByProgram } from "../../../adminSlices/packageSlice";

const { Option } = Select;

/* ================= VALIDATION RULES ================= */
const nameRules = [
  { required: true, message: "This field is required" },
  { min: 2, message: "Must be at least 2 characters" },
  { pattern: /^[A-Za-z\s]+$/, message: "Only letters are allowed" },
];

const emailRules = [
  { required: true, message: "Email is required" },
  { type: "email", message: "Enter a valid email address" },
];

const phoneRules = [
  { required: true, message: "Mobile number is required" },
  { pattern: /^[0-9]{10}$/, message: "Mobile number must be 10 digits" },
];

const classRules = [
  { required: true, message: "Please select class / standard" },
];

const amountRules = [
  { required: true, message: "Please enter amount" },
  { pattern: /^[0-9]+$/, message: "Amount must be numeric" },
];

/* ================= COMPONENT ================= */
const AddUserModal = ({ open, onClose, user, mode }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const liveValues = Form.useWatch([], form);
  const selectedPaymentType = Form.useWatch("payment_type", form);


  const [fileList, setFileList] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
 const { activeList: programs = [], loading: programsLoading } = useSelector(
  (state) => state.programs
);
  const activePrograms = useSelector((state) => state.programs.activeList);
  
  const { list: packages = [], loading: packagesLoading } = useSelector(
    (state) => state.packages
  );

  const { loading } = useSelector((state) => state.users);

  const modalMode = mode ?? (user ? "edit" : "add");
  const isView = modalMode === "view";
  const isEdit = modalMode === "edit";

  const [classOptions] = useState([
    "8",
    "9",
    "10",
    "11",
    "12",
    "Engineering",
    "Medical",
    "Law",
    "Design",
    "Commerce",
    "Arts",
    "BBA",
    "UG",
    "Others",
  ]);


  const selectedPackage = packages.find((p) => p.id === liveValues?.package);
  const totalPackageAmount = selectedPackage?.amount || selectedPackage?.price || selectedPackage?.total_amount || "";

  useEffect(() => {
    if (selectedPaymentType === "online") {
      form.setFieldsValue({
        method: "upi",
      });
    }

    if (selectedPaymentType === "offline") {
      form.setFieldsValue({
        method: "cash",
        transaction_id: undefined, // clear transaction id
      });
    }
  }, [selectedPaymentType, form]);


  /* ================= UTILITY FUNCTIONS ================= */

  // Extract name from "PE26 - Ravika" format
  const extractName = (fullName) => {
    if (!fullName) return "";

    // Check if it contains " - " pattern
    if (fullName.includes(" - ")) {
      const parts = fullName.split(" - ");
      // Return the last part (the actual name)
      return parts[parts.length - 1].trim();
    }

    // If no pattern found, return as is
    return fullName.trim();
  };

  // /* ================= DEBUG USER PROP ================= */
  // useEffect(() => {
  //   if (open && user) {
  //     console.log("🔍 DEBUG - User prop received in modal:");
  //     console.log("Full user object:", user);
  //     console.log("Original first_name:", user.first_name);
  //     console.log("Extracted first name:", extractName(user.first_name));
  //     console.log("Payment fields check:");
  //     console.log("- amount:", user.amount);
  //     console.log("- payment_type:", user.payment_type);
  //     console.log("- method:", user.method);
  //     console.log("- transaction_id:", user.transaction_id);
  //     console.log("- proof_file:", user.proof_file);
  //     console.log("- program_id:", user.program_id);
  //     console.log("- package_id:", user.package_id);

  //     // Check if the user object has the payment fields
  //     console.log("All user keys:", Object.keys(user));

  //     // Check profile object too
  //     if (user.profile) {
  //       console.log("Profile object:", user.profile);
  //       console.log("Profile payment fields:");
  //       console.log("- profile.amount:", user.profile.amount);
  //       console.log("- profile.payment_type:", user.profile.payment_type);
  //       console.log("- profile.method:", user.profile.method);
  //       console.log("- profile.transaction_id:", user.profile.transaction_id);
  //       console.log("- profile.proof_file:", user.profile.proof_file);
  //     }
  //   }
  // }, [open, user]);

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    if (open) {
      dispatch(fetchActivePrograms());
    }
  }, [open, dispatch]);

  /* ================= PREFILL FORM ================= */
  useEffect(() => {
    if (!open) {
      form.resetFields();
      setFileList([]);
      setPreviewUrl(null);
      setUploadedFile(null);
      return;
    }

    if (user) {
      console.log("📝 Prefilling form with user data...");

      // Extract name from "PE26 - Ravika" format
      const extractedFirstName = extractName(user.first_name);
      const extractedLastName = user.last_name || ""; // Last name usually doesn't have prefix

      // Extract payment data from multiple possible locations
      const paymentData = {
        amount: user.amount || user.profile?.amount || "",
        payment_type: user.payment_type || user.profile?.payment_type || "",
        method: user.method || user.profile?.method || "",
        transaction_id: user.transaction_id || user.profile?.transaction_id || "",
        proof_file: user.proof_file || user.profile?.proof_file || ""
      };

      console.log("💰 Extracted payment data:", paymentData);
      console.log("👤 Name extracted:", {
        original: user.first_name,
        extracted: extractedFirstName,
        last_name: extractedLastName
      });

      // Set form values with extracted name
      const formValues = {
        first_name: extractedFirstName,
        last_name: extractedLastName,
        email: user.email || "",
        phone: user.phone || "",
        study_class: user.study_class || undefined,
        preferred_counselling_mode: user.preferred_counselling_mode || undefined,
        amount: paymentData.amount,
        payment_type: paymentData.payment_type || undefined,
        method: paymentData.method || undefined,
        transaction_id: paymentData.transaction_id,
        program: user.program_id || undefined,
        package: user.package_id || undefined,
      };

      console.log("📋 Setting form values:", formValues);
      form.setFieldsValue(formValues);

      // Handle receipt file preview
      if (paymentData.proof_file) {
        console.log("📄 Setting receipt preview:", paymentData.proof_file);
        setPreviewUrl(paymentData.proof_file);
        setFileList([
          {
            uid: '-1',
            name: 'receipt.jpg',
            status: 'done',
            url: paymentData.proof_file,
          }
        ]);
      } else {
        console.log("📄 No receipt file found");
        setFileList([]);
        setPreviewUrl(null);
        setUploadedFile(null);
      }

      // Load packages if program exists
      if (user.program_id) {
        console.log("📦 Loading packages for program:", user.program_id);
        dispatch(fetchPackagesByProgram(user.program_id));
      }
    } else {
      console.log("🆕 No user data, resetting form for add mode");
      form.resetFields();
      setFileList([]);
      setPreviewUrl(null);
      setUploadedFile(null);
    }
  }, [open, user, dispatch, form]);

  /* ================= CLEANUP PREVIEW ================= */
  useEffect(() => {
    return () => {
      if (previewUrl && !previewUrl.startsWith('http')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  /* ================= SUBMIT ================= */
  const handleSubmit = (values) => {
    const formData = new FormData();

    console.log("🚀 Submitting form with values:", values);
    console.log("📁 Uploaded file:", uploadedFile);
    console.log("📋 File list:", fileList);

    // Extract and clean first name (in case user entered prefix)
    const cleanedFirstName = values.first_name.trim();
    const cleanedLastName = values.last_name.trim();

    console.log("👤 Names to submit:", {
      first_name: cleanedFirstName,
      last_name: cleanedLastName
    });

    // Normal fields - use cleaned names
    formData.append("first_name", cleanedFirstName);
    formData.append("last_name", cleanedLastName);
    formData.append("email", values.email);
    formData.append("phone", values.phone);
    formData.append("study_class", values.study_class);
    formData.append("program", values.program);
    formData.append("package", values.package);
    formData.append("preferred_counselling_mode", values.preferred_counselling_mode);
    formData.append("amount", values.amount);
    formData.append("payment_type", values.payment_type);
    formData.append("method", values.method);

    if (values.transaction_id) {
      formData.append("transaction_id", values.transaction_id);
    }

    // ✅ FILE — Check both uploadedFile and fileList
    let fileToUpload = null;

    if (uploadedFile) {
      // Use the file stored in state
      fileToUpload = uploadedFile;
      console.log("📤 Using uploadedFile from state:", uploadedFile.name);
    } else if (fileList.length > 0 && fileList[0].originFileObj) {
      // Use file from fileList
      fileToUpload = fileList[0].originFileObj;
      console.log("📤 Using file from fileList:", fileList[0].originFileObj.name);
    }

    if (fileToUpload) {
      console.log("📎 Appending file to FormData:", fileToUpload.name);
      formData.append("proof_file", fileToUpload);
    } else {
      console.log("📎 No file to upload");
    }

    // Debug: Log FormData contents
    console.log("=== FormData Contents ===");
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}:`, value.name, `(File, size: ${value.size} bytes)`);
      } else {
        console.log(`${key}:`, value);
      }
    }
    console.log("=== End FormData ===");

    const action = isEdit
      ? updateUser({ id: user.id, payload: formData })
      : addUser(formData);

    dispatch(action)
      .unwrap()
      .then((response) => {
        console.log("✅ API Response:", response);
        message.success(
          isEdit ? "User updated successfully" : "User added successfully"
        );
        dispatch(fetchStudents());
        onClose();
      })
      .catch((error) => {
        console.error("❌ Operation failed:", error);
        console.error("❌ Error response:", error.response);
        message.error(error.message || "Operation failed");
      });
  };

  /* ================= HANDLE PROGRAM CHANGE ================= */
  const handleProgramChange = (programId) => {
    form.setFieldsValue({ package: undefined });
    if (programId) dispatch(fetchPackagesByProgram(programId));
  };

  /* ================= FILE UPLOAD HANDLERS ================= */
  const handleFileChange = ({ fileList: newFileList }) => {
    console.log("📁 File change:", newFileList);
    setFileList(newFileList);

    if (newFileList.length > 0) {
      const file = newFileList[0];
      if (file.originFileObj) {
        const url = URL.createObjectURL(file.originFileObj);
        setPreviewUrl(url);
        setUploadedFile(file.originFileObj);
        console.log("📁 New file selected:", file.originFileObj.name);
      } else if (file.url) {
        setPreviewUrl(file.url);
        setUploadedFile(null);
        console.log("📁 Existing file URL:", file.url);
      }
    } else {
      setPreviewUrl(null);
      setUploadedFile(null);
      console.log("🗑️ File removed");
    }
  };

  const handleBeforeUpload = (file) => {
    console.log("📁 Before upload:", file.name);
    return false;
  };

  /* ================= UI ================= */
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      title={isEdit ? "Edit User" : isView ? "View User" : "Add User"}
      width="100%"
      style={{ maxWidth: 1100 }}
    >
      <Row gutter={[24, 24]}>
        {/* LEFT SIDE FORM */}
        <Col xs={24} lg={14}>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="first_name" label="First Name" rules={isView ? [] : nameRules}>
                  <Input disabled={isView} placeholder="Enter first name" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="last_name" label="Last Name" rules={isView ? [] : nameRules}>
                  <Input disabled={isView} placeholder="Enter last name" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="email" label="Email" rules={isView ? [] : emailRules}>
                  <Input disabled={isView} />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="phone" label="Mobile Number(Whatsapp)" rules={isView ? [] : phoneRules}>
                  <Input disabled={isView} maxLength={10} />
                </Form.Item>
              </Col>

              {/* CLASS DROPDOWN */}
              <Col xs={24} md={12}>
                <Form.Item name="study_class" label="Class / STD" rules={isView ? [] : classRules}>
                  <Select disabled={isView}>
                    {classOptions.map((cls) => (
                      <Option key={cls} value={cls}>
                        {cls}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>


              <Col span={12}>
                <Form.Item
                  label="Program"
                  name="program"
                  rules={isView ? [] : [{ required: true, message: "Please select program" }]}
                >
                  <Select
                    placeholder={programsLoading ? "Loading..." : "Select program"}
                    loading={programsLoading}
                    onChange={handleProgramChange}
                    allowClear
                    disabled={isView}
                  >
                    {programs.map((p) => (
                      <Option key={p.id} value={p.id}>
                        {p.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label="Counselling Services"
                  name="package"
                  rules={isView ? [] : [{ required: true, message: "Please select counselling service" }]}
                >
                  <Select
                    placeholder={packagesLoading ? "Loading..." : "Select service"}
                    loading={packagesLoading}
                    allowClear
                    disabled={isView}
                  >
                    {packages.map((p) => (
                      <Option key={p.id} value={p.id}>
                        {p.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="preferred_counselling_mode"
                  label="Preferred Counselling Mode"
                  required
                >
                  <Select disabled={isView} placeholder="Select mode">
                    <Option value="online">Online</Option>
                    <Option value="offline">Offline</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="amount"
                  label="Fees Paid"
                  rules={[
                    { required: true, message: "Please enter amount" },
                    {
                      validator: (_, value) => {
                        if (!value) return Promise.resolve();

                        const numericValue = Number(value);

                        if (isNaN(numericValue)) {
                          return Promise.reject("Amount must be a number");
                        }

                        if (numericValue < 500) {
                          return Promise.reject("Minimum amount should be ₹500");
                        }

                        if (totalPackageAmount && numericValue > totalPackageAmount) {
                          return Promise.reject(`Amount cannot exceed ₹${totalPackageAmount}`);
                        }

                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input type="number" min={0} disabled={isView} />
                </Form.Item>

              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="payment_type" label="Payment Type" rules={isView ? [] : [{ required: true }]}>
                  <Select disabled={isView}>
                    <Option value="online">Online</Option>
                    <Option value="offline">Offline</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="method" label="Payment Method" rules={isView ? [] : [{ required: true }]}>
                  <Select disabled={isView}>
                    <Option value="upi">UPI</Option>
                    <Option value="cash">Cash</Option>
                  </Select>
                </Form.Item>
              </Col>

              {selectedPaymentType === "online" && (
                <Col xs={24}>
                  <Form.Item
                    name="transaction_id"
                    label="Transaction ID"
                  >
                    <Input disabled={isView} />
                  </Form.Item>
                </Col>
              )}

            </Row>

            <Form.Item label="Upload Receipt" name="receipt">
              <Upload
                beforeUpload={handleBeforeUpload}
                maxCount={1}
                fileList={fileList}
                onChange={handleFileChange}
                onRemove={() => {
                  setFileList([]);
                  setPreviewUrl(null);
                  setUploadedFile(null);
                  console.log("🗑️ File removed from upload");
                }}
                disabled={isView}
              >
                <Button icon={<UploadOutlined />} disabled={isView}>
                  {fileList.length ? 'Change Receipt' : 'Upload Receipt'}
                </Button>
              </Upload>
              {/* {uploadedFile && (
                <div style={{ marginTop: 8, color: '#1890ff' }}>
                  File selected: {uploadedFile.name}
                </div>
              )} */}
            </Form.Item>

            {!isView && (
              <div style={{ textAlign: "right" }}>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {isEdit ? "Update User" : "Add User"}
                </Button>
              </div>
            )}
          </Form>
        </Col>

        {/* RIGHT SIDE LIVE PREVIEW */}
        <Col xs={24} lg={10}>
          <Card title="Preview">
            {(!form.getFieldValue('first_name') && !previewUrl) ? (
              <Empty description="Fill the form to see preview" />
            ) : (
              <>
                <p><b>Name:</b> {form.getFieldValue('first_name')} {form.getFieldValue('last_name')}</p>
                <p><b>Email:</b> {form.getFieldValue('email')}</p>
                <p><b>Mobile:</b> {form.getFieldValue('phone')}</p>
                <p><b>Class:</b> {form.getFieldValue('study_class') || 'Not selected'}</p>

                <p><b>Program:</b> {
                  programs.find(p => p.id === form.getFieldValue('program'))?.name || 'Not selected'
                }</p>
                <p><b>Counselling Services:</b> {
                  packages.find(p => p.id === form.getFieldValue('package'))?.name || 'Not selected'
                }</p>

                <p><b>Amount:</b> ₹{form.getFieldValue('amount') || '0'} / ₹{totalPackageAmount}</p>

                <Divider />

                <p><b>Payment Type:</b> {form.getFieldValue('payment_type') || 'Not selected'}</p>
                <p><b>Method:</b> {form.getFieldValue('method') || 'Not selected'}</p>
                <p><b>Transaction ID:</b> {form.getFieldValue('transaction_id') || 'Not provided'}</p>

                <Divider />

                {previewUrl ? (
                  <div>
                    <p><b>Receipt:</b></p>
                    <Image
                      src={previewUrl}
                      alt="Receipt"
                      style={{
                        width: "100%",
                        maxHeight: 300,
                        objectFit: 'contain',
                        border: '1px solid #d9d9d9',
                        borderRadius: 8
                      }}
                      preview={{
                        mask: <><EyeOutlined /> View</>
                      }}
                    />
                  </div>
                ) : (
                  <Empty description="No receipt uploaded" />
                )}
              </>
            )}
          </Card>
        </Col>
      </Row>
    </Modal>
  );
};

export default AddUserModal;