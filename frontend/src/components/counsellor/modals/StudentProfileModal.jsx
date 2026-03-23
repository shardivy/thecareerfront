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

      <div style={{ maxHeight: "75vh", overflowY: "auto", paddingRight: 8 }}>

        {/* ================= PERSONAL INFORMATION ================= */}
        <Card title="Personal Information" bordered={false}>
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Name</Text>
              <Input
                value={
                  student
                    ? `${student.first_name || ""} ${student.last_name || ""}`
                    : "-"
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
              <Text strong>Program</Text>
              <Input value={student?.program || "-"} disabled />
            </Col>

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Counselling Service</Text>
              <Input value={student?.counselling_service || "-"} disabled />
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

        {/* ================= ACADEMIC DETAILS ================= */}
        <Card title="Academic Details" bordered={false}>
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Current Class</Text>
              <Input value={student?.study_class || "-"} disabled />
            </Col>

            <Col span={12}>
              <Text strong>Specialization</Text>
              <Input value={student?.specialization || "-"} disabled />
            </Col>

            <Col span={12}>
              <Text strong>Previous Class Percentage</Text>
              <Input value={student?.previous_class_percentage || "-"} disabled />
            </Col>

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Year of Board Exam</Text>
              <Input value={student?.board_exam_year || "-"} disabled />
            </Col>

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>School / College</Text>
              <Input value={student?.school_college || "-"} disabled />
            </Col>

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>City</Text>
              <Input value={student?.city || "-"} disabled />
            </Col>

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Suggested Stream</Text>
              <Input
                value={student?.stream?.stream_name || "-"}
                disabled
              />
            </Col>
          </Row>
        </Card>

        <Divider />

        {/* ================= SUBJECT PREFERENCES ================= */}
        <Card title="Subject Preferences" bordered={false}>
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Liked Subjects</Text>
              <Input
                value={
                  student?.liked_subjects?.length
                    ? student.liked_subjects.map((s) => s.name).join(", ")
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
                    ? student.disliked_subjects.map((s) => s.name).join(", ")
                    : "-"
                }
                disabled
              />
            </Col>

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Moderate Subjects</Text>
              <Input
                value={
                  student?.moderate_subjects?.length
                    ? student.moderate_subjects.map((s) => s.name).join(", ")
                    : "-"
                }
                disabled
              />
            </Col>

            <Col span={24} style={{ marginTop: 15 }}>
              <Text strong>Improvement Areas</Text>
              <Input.TextArea
                rows={3}
                value={student?.improvement_areas || "-"}
                disabled
              />
            </Col>
          </Row>
        </Card>

        <Divider />

        {/* ================= HOBBIES ================= */}
        <Card title="Hobbies" bordered={false}>
          <Input
            value={
              student?.hobbies?.length
                ? student.hobbies.map((h) => h.name).join(", ")
                : "-"
            }
            disabled
          />
        </Card>

        <Divider />

        {/* ================= PARENT DETAILS ================= */}
        <Card title="Parent Details" bordered={false}>
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Parent Name</Text>
              <Input value={student?.parent?.parent_name || "-"} disabled />
            </Col>

            <Col span={12}>
              <Text strong>Profession</Text>
              <Input value={student?.parent?.profession || "-"} disabled />
            </Col>

            {/* <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Organization</Text>
              <Input
                value={student?.parent?.organization_name || "-"}
                disabled
              />
            </Col> */}

            {/* <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Education Level</Text>
              <Input
                value={student?.parent?.education_level || "-"}
                disabled
              />
            </Col> */}

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Father Background</Text>
              <Input
                value={student?.parent?.father_background || "-"}
                disabled
              />
            </Col>

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Mother Background</Text>
              <Input
                value={student?.parent?.mother_background || "-"}
                disabled
              />
            </Col>

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Location (Area)</Text>
              <Input
                value={student?.parent?.parent_area || "-"}
                disabled
              />
            </Col>

            {/* <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Annual Income Range</Text>
              <Input
                value={student?.parent?.annual_income_range || "-"}
                disabled
              />
            </Col> */}

            <Col span={24} style={{ marginTop: 15 }}>
              <Text strong>Expectations From Student / Parent</Text>
              <Input.TextArea
                rows={3}
                value={student?.parent?.expectations_from_student || "-"}
                disabled
              />
            </Col>
          </Row>
        </Card>

      </div>
    </Modal>
  );
};

export default StudentProfileModal;