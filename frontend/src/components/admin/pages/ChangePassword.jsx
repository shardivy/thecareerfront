import React from "react";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { resetPassword } from "../../../adminSlices/resetPasswordSlice";

const { Title } = Typography;

const ChangePassword = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const { user } = useSelector((state) => state.auth);
  const { loading } = useSelector((state) => state.resetPassword);

  const onFinish = (values) => {
    dispatch(
      resetPassword({
        email: user?.email,
        new_password: values.new_password,
        confirm_password: values.confirm_password,
      })
    )
      .unwrap()
      .then(() => {
        message.success("Password updated successfully");

        // redirect to login again
        window.location.href = "/";
      })
      .catch((err) => {
        message.error(err);
      });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Card style={{ width: 420 }}>
        <Title level={3}>Change Password</Title>

        <Form layout="vertical" form={form} onFinish={onFinish}>
          <Form.Item
            label="New Password"
            name="new_password"
            rules={[{ required: true, min: 8 }]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>

          <Form.Item
            label="Confirm Password"
            name="confirm_password"
            dependencies={["new_password"]}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (value !== getFieldValue("new_password")) {
                    return Promise.reject("Passwords do not match");
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>

          <Button type="primary" block htmlType="submit" loading={loading}>
            Update Password
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default ChangePassword;