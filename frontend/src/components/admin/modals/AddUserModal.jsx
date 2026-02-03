import React, { useEffect } from "react";
import { Modal, Form, Input, Button, Row, Col, Select, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { addUser, updateUser, fetchStudents } from "../../../adminSlices/userSlice";
import { fetchPrograms } from "../../../adminSlices/programSlice";
import { fetchPackages } from "../../../adminSlices/packageSlice";

const { Option } = Select;

/* ================= VALIDATION RULES ================= */

const nameRules = [
  { required: true, message: "This field is required" },
  { min: 2, message: "Must be at least 2 characters" },
  {
    pattern: /^[A-Za-z\s]+$/,
    message: "Only letters are allowed",
  },
];

const emailRules = [
  { required: true, message: "Email is required" },
  { type: "email", message: "Enter a valid email address" },
];

const phoneRules = [
  { required: true, message: "Phone number is required" },
  {
    pattern: /^[0-9]{10}$/,
    message: "Phone number must be exactly 10 digits",
  },
];

/* ================= COMPONENT ================= */

const AddUserModal = ({ open, onClose, user, mode }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const { list: programs } = useSelector((state) => state.programs);
  const { list: packages } = useSelector((state) => state.packages);
  const { loading } = useSelector((state) => state.users);

  // mode: add | edit | view
  const modalMode = mode ?? (user ? "edit" : "add");
  const isView = modalMode === "view";
  const isEdit = modalMode === "edit";

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
      const programName = user.program || user.program_name || "";
      const packageName = user.package || user.package_name || "";

      const programId =
        user.program_id ??
        programs.find(
          (p) => p.name?.toLowerCase() === programName.toLowerCase()
        )?.id ??
        null;

      const packageId =
        user.package_id ??
        packages.find(
          (p) => p.name?.toLowerCase() === packageName.toLowerCase()
        )?.id ??
        null;

      form.setFieldsValue({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        program: programId,
        package: packageId,
      });
    } else {
      form.resetFields();
    }
  }, [user, form, programs, packages]);

  /* ================= SUBMIT ================= */

  const handleSubmit = (values) => {
    const payload = {
      ...values,
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
    };

    const action = isEdit
      ? updateUser({ id: user.id, payload })
      : addUser(payload);

    dispatch(action)
      .unwrap()
      .then(() => {
        message.success(isEdit ? "User updated successfully" : "User added successfully");
        dispatch(fetchStudents());
        onClose();
      })
      .catch(() => {
        message.error("Operation failed");
      });
  };

  /* ================= UI ================= */

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      title={isEdit ? "Edit User" : "Add User"}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="first_name"
              label="First Name"
              rules={isView ? [] : nameRules}
            >
              <Input disabled={isView} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="last_name"
              label="Last Name"
              rules={isView ? [] : nameRules}
            >
              <Input disabled={isView} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={isView ? [] : emailRules}
            >
              <Input disabled={isView} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="phone"
              label="Phone"
              rules={isView ? [] : phoneRules}
            >
              <Input
                disabled={isView}
                maxLength={10}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="program"
              label="Program"
              rules={
                isView
                  ? []
                  : [{ required: true, message: "Please select a program" }]
              }
            >
              <Select disabled={isView} placeholder="Select program">
                {programs.map((p) => (
                  <Option key={p.id} value={p.id}>
                    {p.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="package" label="Package">
              <Select disabled={isView} placeholder="Select package">
                {packages.map((p) => (
                  <Option key={p.id} value={p.id}>
                    {p.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <div style={{ textAlign: "right" }}>
          {!isView ? (
            <>
              <Button type="primary" htmlType="submit" loading={loading}>
                {isEdit ? "Update User" : "Add User"}
              </Button>
              <Button onClick={onClose} style={{ marginLeft: 8 }}>
                Cancel
              </Button>
            </>
          ) : (
            <Button type="primary" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </Form>
    </Modal>
  );
};

export default AddUserModal;
