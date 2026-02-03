import React, { useEffect } from "react";
import { Modal, Form, Input, InputNumber, Button, Row, Col } from "antd"; // Form included here
import { message } from "antd"; // separate import for message
import { useDispatch } from "react-redux";
import { addProgram, updateProgram, fetchPrograms } from "../../../adminSlices/programSlice";


const AddProgramModal = ({ visible, onClose, initialValues, viewMode = false }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  // ---------------- PREFILL FORM ----------------
  useEffect(() => {
    if (visible) {
      if (initialValues) {
        form.setFieldsValue(initialValues);
      } else {
        form.resetFields();
      }
    }
  }, [initialValues, visible, form]);

  // ---------------- CLOSE HANDLER ----------------
  const handleClose = () => {
    form.resetFields();   // 👈 reset on close
    onClose();
  };

  // ---------------- SUBMIT ----------------
// ---------------- SUBMIT ----------------
const handleFinish = async (values) => {
  try {
    let res;

    if (initialValues && initialValues.id) {
      // EDIT MODE: call updateProgram API
      res = await dispatch(
        updateProgram({ id: initialValues.id, payload: values })
      ).unwrap();
      message.success(res?.message || "Program updated successfully", 3);
    } else {
      // ADD MODE: call addProgram API
      res = await dispatch(addProgram(values)).unwrap();
      message.success(res?.message || "Program saved successfully", 3);
    }

    // Refresh program list
    dispatch(fetchPrograms());
    form.resetFields();

    setTimeout(() => {
      handleClose();
    }, 1000);
  } catch (error) {
    message.error(error || "Failed to save program");
  }
};


  return (
    <Modal
      title={
        viewMode
          ? "View Program"
          : initialValues
          ? "Edit Program"
          : "Create New Program"
      }
      open={visible}
      onCancel={handleClose}
      footer={null}
      centered
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          label="Program Name"
          name="name"
          rules={[{ required: true, message: "Enter program name" }]}
        >
          <Input readOnly={viewMode} placeholder="Enter program name" />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
          rules={[{ required: true, message: "Enter description" }]}
        >
          <Input.TextArea
            rows={4}
            readOnly={viewMode}
            placeholder="Enter program description"
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Duration"
              name="duration"
              rules={[{ required: true, message: "Enter duration" }]}
            >
              <Input readOnly={viewMode} placeholder="e.g. 3 Months" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Sessions"
              name="session"
              rules={[{ required: true, message: "Enter sessions" }]}
            >
              <InputNumber
                min={1}
                style={{ width: "100%" }}
                readOnly={viewMode}
                placeholder="Total sessions"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <div style={{ textAlign: "right" }}>
            {/* Always show Close button */}
            <Button onClick={handleClose}>
              {viewMode ? "Close" : "Cancel"}
            </Button>

            {/* Submit only in add/edit mode */}
            {!viewMode && (
              <Button
                type="primary"
                htmlType="submit"
                style={{ marginLeft: 8 }}
              >
                Submit
              </Button>
            )}
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddProgramModal;
