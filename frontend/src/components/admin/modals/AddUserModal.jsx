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
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  addUser,
  updateUser,
  fetchStudents,
} from "../../../adminSlices/userSlice";
import { fetchPrograms } from "../../../adminSlices/programSlice";
import { fetchPackages } from "../../../adminSlices/packageSlice";

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

  const [fileList, setFileList] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);

  const { list: programs } = useSelector((state) => state.programs);
  const { list: packages } = useSelector((state) => state.packages);
  const { loading } = useSelector((state) => state.users);

  const modalMode = mode ?? (user ? "edit" : "add");
  const isView = modalMode === "view";
  const isEdit = modalMode === "edit";

  
const [classOptions, setClassOptions] = useState([
  "8",
  "9",
  "10",
  "11",
  "12",
]);

const [classSearch, setClassSearch] = useState("");


  const hasAnyValue =
    liveValues &&
    Object.values(liveValues).some(
      (v) => v !== undefined && v !== null && v !== ""
    );

  const selectedPackage = packages.find(
    (p) => p.id === liveValues?.package
  );

  const totalPackageAmount =
    selectedPackage?.amount ||
    selectedPackage?.price ||
    selectedPackage?.total_amount ||
    "";

  /* ================= FETCH DATA ================= */

  useEffect(() => {
    if (open) {
      dispatch(fetchPrograms());
      dispatch(fetchPackages());
    }
  }, [open, dispatch]);

  /* ================= PREFILL FORM ================= */

  useEffect(() => {
    if (user) {
      const programId =
        user.program_id ??
        programs.find(
          (p) => p.name?.toLowerCase() === user.program?.toLowerCase()
        )?.id ??
        null;

      const packageId =
        user.package_id ??
        packages.find(
          (p) => p.name?.toLowerCase() === user.package?.toLowerCase()
        )?.id ??
        null;

      form.setFieldsValue({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        class_std: user.class_std,
        amount: user.amount,
        paymentType: user.paymentType,
        paymentMethod: user.paymentMethod,
        transactionId: user.transactionId,
        program: programId,
        package: packageId,
      });
    } else {
      form.resetFields();
      setFileList([]);
      setPreviewUrl(null);
    }
  }, [user, form, programs, packages]);

  /* ================= CLEANUP PREVIEW ================= */

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  /* ================= SUBMIT ================= */

  const handleSubmit = (values) => {
    const receiptFile = values.receipt?.[0]?.originFileObj;

    const payload = {
      ...values,
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      receipt: receiptFile,
    };

    const action = isEdit
      ? updateUser({ id: user.id, payload })
      : addUser(payload);

    dispatch(action)
      .unwrap()
      .then(() => {
        message.success(
          isEdit ? "User updated successfully" : "User added successfully"
        );
        dispatch(fetchStudents());
        onClose();
      })
      .catch(() => message.error("Operation failed"));
  };

  /* ================= UI ================= */

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      title={isEdit ? "Edit User" : "Add User"}
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
                  <Input disabled={isView} />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="last_name" label="Last Name" rules={isView ? [] : nameRules}>
                  <Input disabled={isView} />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="email" label="Email" rules={isView ? [] : emailRules}>
                  <Input disabled={isView} />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="phone" label="Mobile Number(Whatsapp)" rules={isView ? [] : phoneRules}>
                  <Input
                    disabled={isView}
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                </Form.Item>
              </Col>

              {/* CLASS DROPDOWN */}
<Col xs={24} md={12}>
  <Form.Item
    name="class_std"
    label="Class / STD"
    rules={isView ? [] : classRules}
  >
    <Select
      disabled={isView}
      placeholder="Select or type class & press Enter"
      showSearch
      value={form.getFieldValue("class_std")}
      onSearch={(value) => setClassSearch(value)}
      onInputKeyDown={(e) => {
        if (e.key === "Enter" && classSearch) {
          e.preventDefault();

          if (!classOptions.includes(classSearch)) {
            setClassOptions((prev) => [...prev, classSearch]);
          }

          form.setFieldsValue({ class_std: classSearch });
          setClassSearch("");
        }
      }}
      filterOption={(input, option) =>
        option?.children
          ?.toString()
          .toLowerCase()
          .includes(input.toLowerCase())
      }
    >
      {classOptions.map((cls) => (
        <Option key={cls} value={cls}>
          {cls}
        </Option>
      ))}
    </Select>
  </Form.Item>
</Col>



              <Col xs={24} md={12}>
                <Form.Item name="program" label="Program" rules={[{ required: !isView }]}>
                  <Select disabled={isView}>
                    {programs.map((p) => (
                      <Option key={p.id} value={p.id}>
                        {p.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
<Col xs={24} md={12}>
  <Form.Item
    name="package"
    label="Package"
    rules={[{ required: true }]}
  >
    <Select disabled={isView}>
      {packages.map((p) => (
        <Select.Option key={p.id} value={p.id}>
          {p.name.charAt(0).toUpperCase() + p.name.slice(1)}
        </Select.Option>
      ))}
    </Select>
  </Form.Item>
</Col>


              <Col xs={24} md={12}>
                <Form.Item name="amount" label="Amount" rules={isView ? [] : amountRules}>
                  <Input disabled={isView} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="paymentType" label="Payment Type" rules={[{ required: true }]}>
                  <Select disabled={isView}>
                    <Option value="online">Online</Option>
                    <Option value="offline">Offline</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="paymentMethod" label="Payment Method" rules={[{ required: true }]}>
                  <Select disabled={isView}>
                    <Option value="upi">UPI</Option>
                    <Option value="cash">Cash</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item name="transactionId" label="Transaction ID">
                  <Input disabled={isView} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Upload Receipt" name="receipt">
              <Upload
                beforeUpload={() => false}
                maxCount={1}
                showUploadList={false}
                fileList={fileList}
                onChange={({ fileList }) => {
                  setFileList(fileList);
                  setPreviewUrl(
                    fileList.length
                      ? URL.createObjectURL(fileList[0].originFileObj)
                      : null
                  );
                  form.setFieldsValue({ receipt: fileList });
                }}
              >
                <Button icon={<UploadOutlined />}>Upload Receipt</Button>
              </Upload>
            </Form.Item>

            <div style={{ textAlign: "right" }}>
              <Button type="primary" htmlType="submit" loading={loading}>
                {isEdit ? "Update User" : "Add User"}
              </Button>
            </div>
          </Form>
        </Col>

        {/* RIGHT SIDE LIVE PREVIEW */}
        <Col xs={24} lg={10}>
          <Card title="Live Preview">
            {!hasAnyValue && !previewUrl ? (
              <Empty description="Fill the form to see preview" />
            ) : (
              <>
                <p><b>Name:</b> {liveValues?.first_name} {liveValues?.last_name}</p>
                <p><b>Email:</b> {liveValues?.email}</p>
                <p><b>Mobile Number:</b> {liveValues?.phone}</p>
                <p><b>Class:</b> {liveValues?.class_std}</p>
                <p><b>Amount:</b> ₹{liveValues?.amount} / ₹{totalPackageAmount}</p>

                <Divider />

                <p><b>Payment Type:</b> {liveValues?.paymentType}</p>
                <p><b>Method:</b> {liveValues?.paymentMethod}</p>

                <Divider />

                {previewUrl ? (
                  <img src={previewUrl} alt="Receipt" style={{ width: "100%" }} />
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
