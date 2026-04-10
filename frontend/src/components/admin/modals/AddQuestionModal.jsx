import React, { useEffect } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { addQuestion, updateQuestion } from "../../../adminSlices/questionSlice";
import { fetchQuestions } from "../../../adminSlices/questionSlice";

const AddQuestionModal = ({
  open,
  onCancel,
  editingRecord,
}) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.questions);
  const { addLoading, updateLoading } = useSelector((state) => state.questions);

  useEffect(() => {
    if (open) {   // ✅ ADD THIS CONDITION
      if (editingRecord) {
        form.setFieldsValue({
          question: editingRecord.question,
        });
      } else {
        form.resetFields();
      }
    }
  }, [editingRecord, open, form]);

  const handleSubmit = async (values) => {
    try {
      let res;

      if (editingRecord) {
        // ✏️ UPDATE
        res = await dispatch(
          updateQuestion({
            id: editingRecord.id,
            payload: { question: values.question },
          })
        ).unwrap();
      } else {
        // ➕ ADD
        res = await dispatch(
          addQuestion({ question: values.question })
        ).unwrap();
      }

      // ✅ Show backend message
      message.success(res.message);

      // ✅ Refresh list
      dispatch(fetchQuestions());

      form.resetFields();
      onCancel();
    } catch (err) {
      message.error(err?.message || "Something went wrong");
    }
  };

  return (
    <Modal
      open={open}
      title={editingRecord ? "Edit Question" : "Add Question"}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={editingRecord ? updateLoading : addLoading}
          onClick={() => form.submit()}
        >
          {editingRecord ? "Update" : "Add"}
        </Button>,
      ]}
      destroyOnClose
      centered
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="question"
          label="Question"
          rules={[{ required: true, message: "Please enter question" }]}
        >
          <Input placeholder="Enter question" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddQuestionModal;