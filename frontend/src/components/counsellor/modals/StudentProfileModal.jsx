import React from "react";
import {
  Modal,
  Row,
  Col,
  Card,
  Typography,
  Divider,
  Input,
} from "antd";

const { Title, Text } = Typography;

const StudentProfileModal = ({ open, onClose, student, loading }) => {
  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      confirmLoading={loading}
    >
      {/* HEADER */}
      <div style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>
          View Student Profile
        </Title>
      </div>

      {/* PERSONAL INFORMATION */}
      <Card title="Personal Information" bordered={false}>
        <Row gutter={16}>
          <Col span={12}>
            <Text strong>Name</Text>
            <Input
              value={
                student
                  ? `${student.first_name || ""} ${student.last_name || ""}`
                  : ""
              }
              disabled
            />
          </Col>

          <Col span={12}>
            <Text strong>Email</Text>
            <Input value={student?.email || "-"} disabled />
          </Col>

          <Col span={12} style={{ marginTop: 15 }}>
            <Text strong>Mobile Number</Text>
            <Input value={student?.phone || "-"} disabled />
          </Col>

          <Col span={12} style={{ marginTop: 15 }}>
            <Text strong>Date of Birth</Text>
            <Input value={student?.dob || "-"} disabled />
          </Col>

          <Col span={12} style={{ marginTop: 15 }}>
            <Text strong>Preferred Counselling Mode</Text>
            <Input
              value={student?.preferred_counselling_mode || "-"}
              disabled
            />
          </Col>

          <Col span={12} style={{ marginTop: 15 }}>
            <Text strong>Joined On</Text>
            <Input
              value={
                student?.created_at
                  ? new Date(student.created_at).toLocaleDateString()
                  : "-"
              }
              disabled
            />
          </Col>
        </Row>
      </Card>

      <Divider />

      {/* ACADEMIC DETAILS */}
      <Card title="Academic Details" bordered={false}>
        <Row gutter={16}>
          <Col span={12}>
            <Text strong>Class</Text>
            <Input value={student?.study_class || "-"} disabled />
          </Col>

          <Col span={12}>
            <Text strong>Current Academic Year</Text>
            <Input
              value={student?.current_academic_year || "-"}
              disabled
            />
          </Col>

          <Col span={12} style={{ marginTop: 15 }}>
            <Text strong>School / College</Text>
            <Input value={student?.school_college || "-"} disabled />
          </Col>

          <Col span={12} style={{ marginTop: 15 }}>
            <Text strong>City</Text>
            <Input value={student?.city || "-"} disabled />
          </Col>
        </Row>
      </Card>

      <Divider />

      {/* STREAM */}
      <Card title="Stream" bordered={false}>
        <Input value={student?.stream || "-"} disabled />
      </Card>

      <Divider />

      {/* SUBJECT PREFERENCES */}
      <Card title="Subject Preferences" bordered={false}>
        <Row gutter={16}>
          <Col span={12}>
            <Text strong>Liked Subjects</Text>
            <Input
              value={
                student?.liked_subjects?.length
                  ? student.liked_subjects.join(", ")
                  : "-"
              }
              disabled
            />
          </Col>

          <Col span={12}>
            <Text strong>Disliked Subjects</Text>
            <Input
              value={
                student?.disliked_subjects?.length
                  ? student.disliked_subjects.join(", ")
                  : "-"
              }
              disabled
            />
          </Col>
        </Row>
      </Card>

      <Divider />

      {/* HOBBIES */}
      <Card title="Hobbies" bordered={false}>
        <Input
          value={
            student?.hobbies?.length
              ? student.hobbies.join(", ")
              : "-"
          }
          disabled
        />
      </Card>

      <Divider />

      {/* PARENT DETAILS */}
<Card title="Parent Details" bordered={false}>
  <Row gutter={16}>
    <Col span={12}>
      <Text strong>Parent Name</Text>
      <Input
        value={student?.parent?.parent_name || "-"}
        disabled
      />
    </Col>

    <Col span={12}>
      <Text strong>Profession</Text>
      <Input
        value={student?.parent?.profession || "-"}
        disabled
      />
    </Col>

    <Col span={12} style={{ marginTop: 15 }}>
      <Text strong>Organization</Text>
      <Input
        value={student?.parent?.organization || "-"}
        disabled
      />
    </Col>

    <Col span={12} style={{ marginTop: 15 }}>
      <Text strong>Education Level</Text>
      <Input
        value={student?.parent?.education_level || "-"}
        disabled
      />
    </Col>

    <Col span={12} style={{ marginTop: 15 }}>
      <Text strong>Background</Text>
      <Input
        value={student?.parent?.background || "-"}
        disabled
      />
    </Col>

    <Col span={12} style={{ marginTop: 15 }}>
      <Text strong>Annual Income Range</Text>
      <Input
        value={student?.parent?.annual_income_range || "-"}
        disabled
      />
    </Col>

    <Col span={24} style={{ marginTop: 15 }}>
      <Text strong>Expectations From Student</Text>
      <Input.TextArea
        rows={3}
        value={student?.parent?.expectations_from_student || "-"}
        disabled
      />
    </Col>
  </Row>
</Card>
    </Modal>
  );
};

export default StudentProfileModal;