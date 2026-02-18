import React from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Select,
  DatePicker,
} from "antd";
import dayjs from "dayjs";

const { Option } = Select;

const EditProfileModal = ({ visible, onCancel, profileData, onSave }) => {
  const [form] = Form.useForm();

  return (
    <Modal
      title="Edit Profile"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
      centered
    >
      <Form
        layout="vertical"
        form={form}
        initialValues={{
          ...profileData,
          dob: profileData.dob ? dayjs(profileData.dob) : null,
        }}
        onFinish={(values) => {
          values.dob = values.dob
            ? values.dob.format("YYYY-MM-DD")
            : null;
          onSave(values);
        }}
      >
        <Form.Item label="Name" name="name">
          <Input />
        </Form.Item>

        <Form.Item label="Email" name="email">
          <Input />
        </Form.Item>

        <Form.Item label="Phone" name="phone">
          <Input />
        </Form.Item>

        <Form.Item label="Date of Birth" name="dob">
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item label="Study Class" name="study_class">
          <Select>
            <Option value="8th">8th</Option>
            <Option value="9th">9th</Option>
            <Option value="10th">10th</Option>
            <Option value="11th">11th</Option>
            <Option value="12th">12th</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Preferred Counselling Mode"
          name="preferred_counselling_mode"
        >
          <Select>
            <Option value="online">Online</Option>
            <Option value="offline">Offline</Option>
          </Select>
        </Form.Item>

        <Form.Item label="School" name="school">
          <Input />
        </Form.Item>

        <Form.Item label="City" name="city">
          <Input />
        </Form.Item>

        <Form.Item label="Stream" name="stream">
          <Select>
            <Option value="Engineering">Engineering</Option>
            <Option value="Medical">Medical</Option>
            <Option value="Design">Design</Option>
            <Option value="Commerce">Commerce</Option>
          </Select>
        </Form.Item>

        <Form.Item label="Liked Subjects" name="liked_subjects">
          <Select mode="multiple">
            <Option value="Maths">Maths</Option>
            <Option value="Physics">Physics</Option>
            <Option value="Chemistry">Chemistry</Option>
            <Option value="Biology">Biology</Option>
          </Select>
        </Form.Item>

        <Form.Item label="Disliked Subjects" name="disliked_subjects">
          <Select mode="multiple">
            <Option value="History">History</Option>
            <Option value="Civics">Civics</Option>
          </Select>
        </Form.Item>

        <Form.Item label="Hobbies" name="hobbies">
          <Select mode="multiple">
            <Option value="Painting">Painting</Option>
            <Option value="Cricket">Cricket</Option>
            <Option value="Music">Music</Option>
            <Option value="Reading">Reading</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Save Changes
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditProfileModal;
