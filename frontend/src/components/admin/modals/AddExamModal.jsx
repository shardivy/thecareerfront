import React from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
} from "antd";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

const AddExamModal = ({ open, onCancel, onCreate, editingExam, mode }) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (editingExam && (mode === "edit" || mode === "view")) {
      form.setFieldsValue({
        name: editingExam.name,
        program: editingExam.program,
        link: editingExam.link,
        instructions: editingExam.instructions,
        package: editingExam.package, // ✅ NEW
      });
    } else {
      form.resetFields();
    }
  }, [editingExam, mode, form]);

  const handleOk = () => {
    form.validateFields().then((values) => {
      onCreate({
        ...values,
      });
      form.resetFields();
    });
  };

  return (
    <Modal
      title={mode === "edit" ? "Edit Exam" : "Add Exam"}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText={mode === "edit" ? "Update" : "Add"}
    >
      <Form layout="vertical" form={form}>
        {/* Row 1: Exam Name & Program */}
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Exam Name"
              name="name"
              rules={[{ required: true, message: "Please enter exam name" }]}
            >
              <Input />
            </Form.Item>
          </Col>

          {/* <Col span={12}>
            <Form.Item
              label="Program"
              name="program"
              rules={[{ required: true, message: "Please select program" }]}
            >
              <Select placeholder="Select program">
                <Option value="Mathematics">Mathematics</Option>
                <Option value="Physics">Physics</Option>
                <Option value="Chemistry">Chemistry</Option>
                <Option value="Biology">Biology</Option>
              </Select>
            </Form.Item>
          </Col> */}
        </Row>

        {/* Row 2: Package (NEW) */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Program"
              name="program"
              rules={[{ required: true, message: "Please select program" }]}
            >
              <Select placeholder="Select program">
                <Option value="Mathematics">Mathematics</Option>
                <Option value="Physics">Physics</Option>
                <Option value="Chemistry">Chemistry</Option>
                <Option value="Biology">Biology</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Package"
              name="package"
              rules={[{ required: true, message: "Please select a package" }]}
            >
              <Select placeholder="Select package">
                <Option value="Free">Free</Option>
                <Option value="Basic">Basic</Option>
                <Option value="Premium">Premium</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Row 3: Exam Link */}
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Exam Link"
              name="link"
              rules={[
                { required: true, message: "Please enter exam link" },
                { type: "url", message: "Please enter a valid URL" },
              ]}
            >
              <Input placeholder="https://example.com/exam" />
            </Form.Item>
          </Col>
        </Row>

        {/* Row 4: Instructions */}
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Instructions"
              name="instructions"
              rules={[
                { required: true, message: "Please enter exam instructions" },
              ]}
            >
              <TextArea
                rows={4}
                placeholder="Enter exam instructions here..."
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default AddExamModal;
