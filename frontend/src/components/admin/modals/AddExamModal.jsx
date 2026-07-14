import React, { useEffect } from "react";
import { Modal, Form, Input, Select, Row, Col, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchActivePrograms } from "../../../adminSlices/programSlice";
import {
  fetchPackagesByProgram,
  clearPackages,
} from "../../../adminSlices/packageSlice";
import { createExam, updateExam } from "../../../adminSlices/examSlice";

const { Option } = Select;
const { TextArea } = Input;

const AddExamModal = ({ open, mode, editingExam, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  // Redux state
  const { activeList: programs = [], loading: programsLoading } = useSelector(
    (state) => state.programs
  );
  const { list: packages = [], loading: packagesLoading } = useSelector(
    (state) => state.packages
  );
  const { loading: examsLoading } = useSelector((state) => state.exam);

  // Fetch programs when modal opens
  useEffect(() => {
    if (open) dispatch(fetchActivePrograms());
  }, [open, dispatch]);

  // Populate form if editing or viewing
  useEffect(() => {
    if ((mode === "edit" || mode === "view") && editingExam) {
      form.setFieldsValue({
        exam_name: editingExam.exam_name,
        program: editingExam.program_id,
        package: editingExam.package_id,
        instructions: editingExam.instructions,
        exam_link: editingExam.exam_link,
      });

      if (editingExam.program_id) {
        dispatch(fetchPackagesByProgram(editingExam.program_id));
      }
    } else {
      form.resetFields();
      dispatch(clearPackages());
    }
  }, [mode, editingExam, form, dispatch]);

  // Handle program change
  const handleProgramChange = (programId) => {
    form.setFieldsValue({ package: undefined });
    if (programId) dispatch(fetchPackagesByProgram(programId));
    else dispatch(clearPackages());
  };

  // Handle form submission
  const handleOk = async () => {
    if (mode === "view") return;

    try {
      const values = await form.validateFields();
      const payload = {
        exam_name: values.exam_name,
        program: values.program,
        package: values.package,
        instructions: values.instructions,
        exam_link: values.exam_link,
      };

      if (mode === "edit" && editingExam) {
        const response = await dispatch(
          updateExam({ id: editingExam.id, payload })
        ).unwrap();
        message.success(response.message || "Exam updated successfully!");
      } else {
        const response = await dispatch(createExam(payload)).unwrap();
        message.success(response.message || "Exam created successfully!");
      }

      onCancel();
      form.resetFields();
      onSuccess?.();
    } catch (err) {
      // console.log("Error:", err);
      message.error(err.message || "Failed to save exam");
    }
  };

  const isViewMode = mode === "view";

  return (
    <Modal
      open={open}
      title={
        mode === "create"
          ? "Add Exam"
          : isViewMode
          ? "View Exam"
          : "Edit Exam"
      }
      onCancel={onCancel}
      onOk={isViewMode ? null : handleOk} // hide OK button in view mode
      okText={mode === "create" ? "Add" : "Update"}
      confirmLoading={examsLoading}
      cancelText={isViewMode ? "Close" : "Cancel"}
    >
      <Form form={form} layout="vertical">
        {/* Exam Name */}
        <Form.Item
          label="Exam Name"
          name="exam_name"
          rules={[{ required: true, message: "Please enter exam name" }]}
        >
          <Input placeholder="Enter exam name" disabled={isViewMode} />
        </Form.Item>

        {/* Program & Package on same line */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Program"
              name="program"
              rules={[{ required: true, message: "Please select program" }]}
            >
              <Select
                placeholder={programsLoading ? "Loading..." : "Select program"}
                loading={programsLoading}
                onChange={handleProgramChange}
                allowClear
                disabled={isViewMode}
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
              rules={[{ required: true, message: "Please select counselling service" }]}
            >
              <Select
                placeholder={packagesLoading ? "Loading..." : "Select counselling service"}
                loading={packagesLoading}
                allowClear
                disabled={isViewMode}
              >
                {packages.map((p) => (
                  <Option key={p.id} value={p.id}>
                    {p.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Instruction */}
        <Form.Item label="Instruction" name="instructions">
          <TextArea
            placeholder="Enter exam instructions"
            rows={3}
            disabled={isViewMode}
          />
        </Form.Item>

        {/* Exam Link */}
        <Form.Item label="Exam Link" name="exam_link">
          <Input
            placeholder="Enter exam link"
            disabled={isViewMode}
            addonAfter={
              isViewMode && form.getFieldValue("exam_link") ? (
                <a
                  href={form.getFieldValue("exam_link")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open
                </a>
              ) : null
            }
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddExamModal;
