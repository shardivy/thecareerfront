import React, { useState, useEffect } from "react";
import {
  Modal,
  Row,
  Col,
  Card,
  Typography,
  Divider,
  Input,
  message,
  Button,
  Space,
  Select,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import { updateStudentProfile } from "../../../adminSlices/profileSlice";
import { fetchSubjects } from "../../../adminSlices/subjectSlice";
import { fetchHobbies } from "../../../adminSlices/hobbySlice";


const { Title, Text } = Typography;

const StudentProfileModal = ({ open, onClose, student, loading }) => {
  const dispatch = useDispatch();

  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({});
  const { subjectList } = useSelector((state) => state.subjects);
  const { hobbyList } = useSelector((state) => state.hobbies);


  useEffect(() => {
    dispatch(fetchSubjects());
    dispatch(fetchHobbies());
  }, [dispatch]);

  /* ================= SET DATA ================= */
  useEffect(() => {
    if (student) {
      setFormData({

        // ✅ personal
        first_name: student.first_name || "",
        last_name: student.last_name || "",
        email: student.email || "",
        phone: student.phone || "",
        dob: student.dob || "",

        liked_subjects: student?.liked_subjects?.map((s) => s.id) || [],
        disliked_subjects: student?.disliked_subjects?.map((s) => s.id) || [],
        moderate_subjects: student?.moderate_subjects?.map((s) => s.id) || [],
        improvement_areas: student?.improvement_areas || "",
        hobbies: student?.hobbies?.map((h) => h.id) || [],
      });
    }
  }, [student]);

  /* ================= HANDLE CHANGE ================= */
  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    try {
      const payload = {
        liked_subject_ids: formData.liked_subjects,
        disliked_subject_ids: formData.disliked_subjects,
        moderate_subject_ids: formData.moderate_subjects,
        improvement_areas: formData.improvement_areas,
        hobby_ids: formData.hobbies,
      };

      await dispatch(
        updateStudentProfile({
          studentId: student.student_id,
          data: payload,
        })
      ).unwrap();

      message.success("Student profile updated successfully");

      setIsEdit(false);

      // ✅ CLOSE MODAL HERE
      onClose();

    } catch (err) {
      message.error(err?.message || "Update failed");
    }
  };

  return (
    <Modal
      title={null}
      open={open}
      centered
      onCancel={onClose}
      footer={
        !isEdit ? (
          <Button type="primary" onClick={() => setIsEdit(true)}>
            Edit
          </Button>
        ) : (
          <Space>
            <Button onClick={() => setIsEdit(false)}>
              Cancel
            </Button>
            <Button type="primary" onClick={handleSave} loading={loading}>
              Save
            </Button>
          </Space>
        )
      }
      width={900}
      confirmLoading={loading}
       
    >
      {/* HEADER */}
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          View Student Profile
        </Title>


      </div>

      <div style={{ maxHeight: "75vh", overflowY: "auto", paddingRight: 8 }}>
        {/* ================= PERSONAL INFORMATION ================= */}
        <Card title="Personal Information" bordered={false}>
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>First Name</Text>
              <Input
                value={formData.first_name}
                disabled
                onChange={(e) =>
                  handleChange("first_name", e.target.value)
                }
              />
            </Col>

            <Col span={12}>
              <Text strong>Last Name</Text>
              <Input
                value={formData.last_name}
                disabled
                onChange={(e) =>
                  handleChange("last_name", e.target.value)
                }
              />
            </Col>

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Email</Text>
              <Input
                value={formData.email}
                disabled
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </Col>

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Mobile Number</Text>
              <Input
                value={formData.phone}
                disabled
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </Col>

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Date of Birth</Text>
              <Input
                value={formData.dob}
                disabled
                onChange={(e) => handleChange("dob", e.target.value)}
              />
            </Col>

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Program</Text>
              <Input
                value={
                  student?.program_packages?.length
                    ? student.program_packages.map(p => p.program_name).join(", ")
                    : "-"
                }
                disabled
              />
            </Col>

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Package / Service</Text>
              <Input
                value={
                  student?.program_packages?.length
                    ? student.program_packages.map(p => p.package_name).join(", ")
                    : "-"
                }
                disabled
              />
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
              <Input
                value={student?.previous_class_percentage || "-"}
                disabled
              />
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
              <Select
                mode="multiple"
                value={
                  isEdit
                    ? formData.liked_subjects
                    : student?.liked_subjects?.map((s) => s.id)
                }
                disabled={!isEdit}
                style={{ width: "100%" }}
                onChange={(v) => handleChange("liked_subjects", v)}
              >
                {subjectList?.map((sub) => (
                  <Select.Option key={sub.id} value={sub.id}>
                    {sub.name}
                  </Select.Option>
                ))}
              </Select>
            </Col>

            <Col span={12}>
              <Text strong>Disliked Subjects</Text>
              <Select
                mode="multiple"
                value={
                  isEdit
                    ? formData.disliked_subjects
                    : student?.disliked_subjects?.map((s) => s.id)
                }
                disabled={!isEdit}
                style={{ width: "100%" }}
                onChange={(v) => handleChange("disliked_subjects", v)}
              >
                {subjectList?.map((sub) => (
                  <Select.Option key={sub.id} value={sub.id}>
                    {sub.name}
                  </Select.Option>
                ))}
              </Select>
            </Col>

            <Col span={12} style={{ marginTop: 15 }}>
              <Text strong>Moderate Subjects</Text>
              <Select
                mode="multiple"
                value={
                  isEdit
                    ? formData.moderate_subjects
                    : student?.moderate_subjects?.map((s) => s.id)
                }
                disabled={!isEdit}
                style={{ width: "100%" }}
                onChange={(v) => handleChange("moderate_subjects", v)}
              >
                {subjectList?.map((sub) => (
                  <Select.Option key={sub.id} value={sub.id}>
                    {sub.name}
                  </Select.Option>
                ))}
              </Select>
            </Col>

            <Col span={24} style={{ marginTop: 15 }}>
              <Text strong>Improvement Areas</Text>
              <Input.TextArea
                rows={3}
                value={
                  isEdit
                    ? formData.improvement_areas
                    : student?.improvement_areas || "-"
                }
                disabled={!isEdit}
                onChange={(e) =>
                  handleChange("improvement_areas", e.target.value)
                }
              />
            </Col>
          </Row>
        </Card>

        <Divider />

        {/* ================= HOBBIES ================= */}
        <Card title="Hobbies" bordered={false}>
          <Select
            mode="multiple"
            value={
              isEdit
                ? formData.hobbies
                : student?.hobbies?.map((h) => h.id)
            }
            disabled={!isEdit}
            style={{ width: "100%" }}
            onChange={(v) => handleChange("hobbies", v)}
          >
            {hobbyList?.map((hobby) => (
              <Select.Option key={hobby.id} value={hobby.id}>
                {hobby.name}
              </Select.Option>
            ))}
          </Select>
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
              <Input value={student?.parent?.location || "-"} disabled />
            </Col>

            <Col span={24} style={{ marginTop: 15 }}>
              <Text strong>Expectations</Text>
              <Input.TextArea
                rows={3}
                value={
                  student?.parent?.expectations_from_student || "-"
                }
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