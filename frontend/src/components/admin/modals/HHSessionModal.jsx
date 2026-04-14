import React, { useEffect } from "react";
import { Modal, Form, Input, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
    createHHSession,
    updateHHSession,
} from "../../../hhSlices/handholdingSessionSlice";

const HHSessionModal = ({
    open,
    onCancel,
    initialValues,
}) => {
    const [form] = Form.useForm();
    const dispatch = useDispatch();
    const { loading } = useSelector((state) => state.hhSession);

    useEffect(() => {
        if (open) {
            form.setFieldsValue(
                initialValues || {
                    title: "",
                    description: "",
                    status: "pending",
                }
            );
        }
    }, [open, initialValues, form]);

    const handleOk = () => {
        form.validateFields().then(async (values) => {
            try {
                if (initialValues?.id) {
                    await dispatch(
                        updateHHSession({
                            id: initialValues.id,
                            payload: values,
                        })
                    ).unwrap();

                    message.success("Session updated successfully");
                } else {
                    await dispatch(createHHSession(values)).unwrap();

                    message.success("Session created successfully");
                }

                form.resetFields();
                onCancel();
            } catch (err) {
                message.error(err?.message || "Something went wrong");
            }
        });
    };

    return (
        <Modal
            title={initialValues ? "Edit Session" : "Add Session"}
            open={open}
            onCancel={onCancel}
            onOk={handleOk}
            confirmLoading={loading}
            okText={initialValues ? "Update" : "Create"}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="title"
                    label="Title"
                    rules={[{ required: true, message: "Enter title" }]}
                >
                    <Input placeholder="Enter title" />
                </Form.Item>

                <Form.Item
                    name="description"
                    label="Description"
                >
                    <Input.TextArea placeholder="Enter description" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default HHSessionModal;
