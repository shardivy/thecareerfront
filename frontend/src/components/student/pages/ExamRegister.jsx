import React from "react";
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Row,
  Col,
  Typography,
} from "antd";

const { Title, Text } = Typography;

const qualificationOptions = [
  "8th",
  "9th",
  "10th",
  "11th",
  "12th",
  "Diploma",
  "Graduate",
  "Post Graduate",
];


const interestOptions = [
  "Engineering",
  "Medical",
  "Commerce",
  "Arts",
  "Management",
  "Law",
  "Design",
  "Hotel Management",
  "Architecture",
  "Civil Services",
  "Defence",
  "Study Abroad",
  "Others",
];

const ExamRegister = () => {
  const onFinish = (values) => {
    console.log(values);
  };

  return (
    <Row
      justify="center"
      align="middle"
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        padding: "30px 15px",
      }}
    >
      <Col xs={24} sm={22} md={20} lg={16} xl={14}>
        <Card bordered={false}>
          <div style={{ textAlign: "center", marginBottom: 25 }}>
            <Title level={2}>Exam Registration</Title>
            <Text type="secondary">
              Register yourself to start the aptitude examination.
            </Text>
          </div>

          <Form layout="vertical" onFinish={onFinish}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Full Name"
                  name="name"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="Enter full name" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true },
                    { type: "email" },
                  ]}
                >
                  <Input placeholder="Enter email address" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Password"
                  name="password"
                  rules={[{ required: true }]}
                >
                  <Input.Password placeholder="Enter password" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Confirm Password"
                  name="confirmPassword"
                  dependencies={["password"]}
                  rules={[
                    { required: true },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (
                          !value ||
                          getFieldValue("password") === value
                        ) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("Passwords do not match")
                        );
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="Confirm password" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Qualification"
                  name="qualification"
                  rules={[{ required: true }]}
                >
                  <Select
                    placeholder="Select qualification"
                    options={qualificationOptions.map((item) => ({
                      value: item,
                      label: item,
                    }))}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Result Status"
                  name="resultStatus"
                  rules={[{ required: true }]}
                >
                  <Select
                    placeholder="Select status"
                    options={[
                      {
                        value: "Pass",
                        label: "Pass",
                      },
                      {
                        value: "Appearing",
                        label: "Appearing",
                      },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
             
              <Col xs={24} md={12}>
                <Form.Item
                  label="Interested In"
                  name="interest"
                  rules={[{ required: true }]}
                >
                  <Select
                    placeholder="Select interest"
                    options={interestOptions.map((item) => ({
                      value: item,
                      label: item,
                    }))}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item style={{ marginTop: 15 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
              >
                Register
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default ExamRegister;