import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  message,
} from "antd";
import { useDispatch } from "react-redux";
import { createStream, fetchStreams, updateStream } from "../../../adminSlices/streamSlice";

const { Option } = Select;

const AddStreamModal = ({
  visible,
  onClose,
  initialValues,
  viewMode = false,
  programs = [],
}) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        name: initialValues.name,
        programs:
          initialValues.program_details?.map(
            (program) => program.id
          ) || [],
      });
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  const handleFinish = async (values) => {
    try {
      const payload = {
        name: values.name,
        programs: values.programs,
      };

      if (initialValues?.id) {
        await dispatch(
          updateStream({
            id: initialValues.id,
            payload,
          })
        ).unwrap();

        message.success("Stream updated successfully");
      } else {
        await dispatch(createStream(payload)).unwrap();

        message.success("Stream created successfully");
      }

      await dispatch(fetchStreams());

      form.resetFields();
      onClose();
    } catch (error) {
      message.error(
        error?.message ||
        error?.detail ||
        "Failed to save stream"
      );
    }
  };

  return (
    <Modal
      open={visible}
      title={
        viewMode
          ? "View Stream"
          : initialValues
            ? "Edit Stream"
            : "Add Stream"
      }
      onCancel={onClose}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Stream Name"
              name="name"
              rules={[
                {
                  required: true,
                  message: "Please enter stream name",
                },
              ]}
            >
              <Input
                placeholder="Enter Stream Name"
                disabled={viewMode}
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              label="Select Program(s)"
              name="programs"   // ✅ changed
              rules={[
                {
                  required: true,
                  message: "Please select at least one program",
                },
              ]}
            >
              <Select
                mode="multiple"
                placeholder="Select Program(s)"
                disabled={viewMode}
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {programs.map((program) => (
                  <Option
                    key={program.id}
                    value={program.id}
                  >
                    {program.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {!viewMode && (
          <div style={{ textAlign: "right" }}>
            <Button
              style={{ marginRight: 8 }}
              onClick={onClose}
            >
              Cancel
            </Button>

            <Button type="primary" htmlType="submit">
              {initialValues ? "Update Stream" : "Add Stream"}
            </Button>
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default AddStreamModal;