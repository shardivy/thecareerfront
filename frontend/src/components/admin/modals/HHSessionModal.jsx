import React, { useEffect } from "react";
import { Modal, Form, Input, Select } from "antd";

const HHSessionModal = ({
    open,
    onCancel,
    onSubmit,
    initialValues,
}) => {
    const [form] = Form.useForm();

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
        form
            .validateFields()
            .then((values) => {
                onSubmit(values);
                form.resetFields();
            })
            .catch(() => { });
    };

    return (
        <Modal
            title={initialValues ? "Edit Session" : "Add Session"}
            open={open}
            onCancel={onCancel}
            onOk={handleOk}
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