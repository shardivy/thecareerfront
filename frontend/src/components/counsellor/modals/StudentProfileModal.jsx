import React from "react";
import {
  Modal,
  Row,
  Col,
  Card,
  Typography,
  Divider,
  Avatar,
  Tag,
  Input,
  Select,
} from "antd";
import { UserOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const StudentProfileModal = ({ open, onClose, student }) => {
  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
    >
      {/* HEADER */}
      <div>
        <h2 style={{ margin: 0,}}>View Student Profile</h2>
      </div>

      {/* PERSONAL INFORMATION */}
      <Card title="Personal Information" bordered={false}>
        <Row gutter={16}>
          <Col span={12}>
            <Text strong>Name</Text>
            <Input value={student?.studentName} disabled />
          </Col>

          <Col span={12}>
            <Text strong>Email</Text>
            <Input value={student?.email} disabled />
          </Col>

          <Col span={12} style={{ marginTop: 15 }}>
            <Text strong>Mobile Number</Text>
            <Input value={student?.phone} disabled />
          </Col>

          <Col span={12} style={{ marginTop: 15 }}>
            <Text strong>Date of Birth</Text>
            <Input value="Select Date" disabled />
          </Col>

          <Col span={12} style={{ marginTop: 15 }}>
            <Text strong>Program</Text>
            <Input disabled />
          </Col>

          <Col span={12} style={{ marginTop: 15 }}>
            <Text strong>Counselling Service</Text>
            <Input disabled />
          </Col>

          <Col span={12} style={{ marginTop: 15 }}>
            <Text strong>Joined On</Text>
            <Input value="2026-01-21" disabled />
          </Col>
        </Row>
      </Card>

      <Divider />

      {/* ACADEMIC DETAILS */}
      <Card title="Academic Details" bordered={false}>
        <Row gutter={16}>
          <Col span={12}>
            <Text strong>Class</Text>
            <Select disabled style={{ width: "100%" }} />
          </Col>

          <Col span={12}>
            <Text strong>Current Academic Year</Text>
            <Input disabled />
          </Col>

          <Col span={12} style={{ marginTop: 15 }}>
            <Text strong>School / College</Text>
            <Input disabled />
          </Col>

          <Col span={12} style={{ marginTop: 15 }}>
            <Text strong>City</Text>
            <Input disabled />
          </Col>
        </Row>
      </Card>

      <Divider />

      {/* STREAM */}
      <Card title="Stream" bordered={false}>
        <Select disabled style={{ width: "100%" }} />
      </Card>

      <Divider />

      {/* SUBJECT PREFERENCES */}
      <Card title="Subject Preferences" bordered={false}>
        <Row gutter={16}>
          <Col span={12}>
            <Text strong>Liked Subjects</Text>
            <Select disabled style={{ width: "100%" }} />
          </Col>
          <Col span={12}>
            <Text strong>Disliked Subjects</Text>
            <Select disabled style={{ width: "100%" }} />
          </Col>
        </Row>
      </Card>

      <Divider />

      {/* HOBBIES */}
      <Card title="Hobbies" bordered={false}>
        <Select disabled style={{ width: "100%" }} />
      </Card>

      <Divider />

      {/* PARENT DETAILS */}
      <Card title="Parent Details" bordered={false}>
        <Row gutter={16}>
          <Col span={12}>
            <Text strong>Profession</Text>
            <Input disabled />
          </Col>
          <Col span={12}>
            <Text strong>Organization</Text>
            <Input disabled />
          </Col>

          <Col span={12} style={{ marginTop: 15 }}>
            <Text strong>Education Level</Text>
            <Input disabled />
          </Col>

          <Col span={12} style={{ marginTop: 15 }}>
            <Text strong>Background</Text>
            <Select disabled style={{ width: "100%" }} />
          </Col>

          <Col span={12} style={{ marginTop: 15 }}>
            <Text strong>Annual Income Range</Text>
            <Select disabled style={{ width: "100%" }} />
          </Col>

          <Col span={24} style={{ marginTop: 15 }}>
            <Text strong>Expectations From Student</Text>
            <Input.TextArea rows={3} disabled />
          </Col>
        </Row>
      </Card>
    </Modal>
  );
};

export default StudentProfileModal;