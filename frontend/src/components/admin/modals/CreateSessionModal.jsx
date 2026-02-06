import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Modal,
  Form,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
  Space,
  Typography,
  ConfigProvider,
  message,
} from "antd";
import dayjs from "dayjs";
import { bookCounsellingSlot } from "../../../adminSlices/counsellingBookingSlice";
import { fetchStudents } from "../../../adminSlices/userSlice";
import { fetchLeadCounsellors } from "../../../adminSlices/counsellorSlice";

const { Option } = Select;
const { Text } = Typography;

const timeSlots = [
  "09:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "02:00 PM - 03:00 PM",
  "04:00 PM - 05:00 PM",
];

const mobileStyles = `
  @media (max-width: 576px) {
    .session-modal .ant-modal-footer {
      justify-content: flex-start !important;
    }
  }
`;

const CreateSessionModal = ({
  visible,
  onClose,
  onSave,
  sessionData,
  bookedSlots = [],
  mode = "create",
}) => {
  const [form] = Form.useForm();
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [filter, setFilter] = useState("All");
  const dispatch = useDispatch();
  const isView = mode === "view";

  // ===== Redux selectors =====
  const students = useSelector((state) => state.users.list ?? []);
  const studentsLoading = useSelector((state) => state.users.loading);

  const counsellors = useSelector((state) => state.counsellors?.list ?? []);
  const counsellorsLoading = useSelector((state) => state.counsellors?.loading ?? false);

  const bookingLoading = useSelector((state) => state.counsellingBooking.loading);

  // ===== Fetch data when modal opens =====
  useEffect(() => {
    if (visible) {
      dispatch(fetchStudents());
      dispatch(fetchLeadCounsellors());
    }
  }, [visible, dispatch]);

  // ===== Populate form when editing/viewing session =====
  useEffect(() => {
    if (sessionData) {
      // Find counsellor IDs from names for form population
      const primaryCounsellorId = sessionData.counsellors?.[0]?.name 
        ? counsellors.find(c => c.name === sessionData.counsellors[0].name)?.id 
        : null;
      const secondaryCounsellorId = sessionData.counsellors?.[1]?.name 
        ? counsellors.find(c => c.name === sessionData.counsellors[1].name)?.id 
        : null;

      form.setFieldsValue({
        student: sessionData.user,
        primaryCounsellor: primaryCounsellorId,
        secondaryCounsellor: secondaryCounsellorId,
        mode: sessionData.mode,
        date: dayjs(sessionData.date),
      });
      setSelectedSlot(sessionData.slot);
    } else {
      form.resetFields();
      setSelectedSlot(null);
    }
  }, [sessionData, form, counsellors]);

  // ===== Handle booking submission =====
  const handleOk = () => {
    form.validateFields().then((values) => {
      // Find counsellor objects by their IDs
      const primaryCounsellor = counsellors.find(c => c.id === values.primaryCounsellor);
      const secondaryCounsellor = values.secondaryCounsellor 
        ? counsellors.find(c => c.id === values.secondaryCounsellor)
        : null;

      const payload = {
        user: values.student,
        counsellors: [
          { name: primaryCounsellor?.name },
          ...(secondaryCounsellor
            ? [{ name: secondaryCounsellor.name }]
            : []),
        ],
        date: values.date.format("YYYY-MM-DD"),
        start_time: selectedSlot,
        duration_minutes: 60,
        mode: values.mode,
      };

      dispatch(bookCounsellingSlot(payload))
        .unwrap()
        .then(() => {
          message.success("Counselling session booked successfully");
          onSave({
            ...payload,
            time: selectedSlot + " (60 mins)",
            status: "Scheduled",
          });
          onClose();
        })
        .catch((err) => {
          message.error(err?.message || "Booking failed");
        });
    });
  };

  // ===== Filter time slots =====
  const displayedSlots = timeSlots.filter((slot) => {
    if (filter === "All") return true;
    const isBooked = bookedSlots.includes(slot);
    return filter === "Available" ? !isBooked : isBooked;
  });

  return (
    <ConfigProvider
      theme={{
        components: {
          Select: { colorBgContainerDisabled: "transparent" },
          DatePicker: { colorBgContainerDisabled: "transparent" },
          Input: { colorBgContainerDisabled: "transparent" },
        },
      }}
    >
      <style>{mobileStyles}</style>
      <Modal
        open={visible}
        title={isView ? "View Counselling Session" : "Book Counselling Session"}
        onCancel={onClose}
        width={820}
        className="session-modal"
        footer={
          isView
            ? [<Button key="close" onClick={onClose}>Close</Button>]
            : [
                <Button key="cancel" onClick={onClose}>Cancel</Button>,
                <Button
                  key="submit"
                  type="primary"
                  loading={bookingLoading}
                  onClick={handleOk}
                  disabled={!selectedSlot}
                >
                  Confirm Booking
                </Button>,
              ]
        }
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            {/* Student Dropdown */}
            <Col span={12}>
              <Form.Item
                label="Student Name"
                name="student"
                rules={[{ required: true }]}
              >
                <Select
                  disabled={isView}
                  loading={studentsLoading}
                  showSearch
                  optionFilterProp="label"
                  placeholder="Select student"
                >
                  {students.map((student) => {
                    const fullName = `${student.first_name} ${student.last_name}`;
                    return (
                      <Option
                        key={student.id}
                        value={student.id}
                        label={`${fullName} ${student.email}`}
                      >
                        <div>
                          <Text>{fullName}</Text>
                          <div style={{ fontSize: 12 }}>{student.email}</div>
                        </div>
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>
            </Col>

            {/* Mode Dropdown */}
            <Col span={12}>
              <Form.Item
                label="Session Mode"
                name="mode"
                rules={[{ required: true }]}
              >
                <Select disabled={isView}>
                  <Option value="Online">Online</Option>
                  <Option value="Offline">Offline</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            {/* Primary Counsellor */}
            <Col span={12}>
              <Form.Item
                label="Primary Counsellor"
                name="primaryCounsellor"
                rules={[{ required: true }]}
              >
                <Select
                  disabled={isView}
                  loading={counsellorsLoading}
                  showSearch
                  placeholder="Select primary counsellor"
                  optionFilterProp="children"
                >
                  {counsellors.map((c) => (
                    <Option key={c.id} value={c.id}>
                      {c.name} 
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Secondary Counsellor */}
            <Col span={12}>
              <Form.Item
                label="Secondary Counsellor (Optional)"
                name="secondaryCounsellor"
              >
                <Select
                  disabled={isView}
                  loading={counsellorsLoading}
                  showSearch
                  placeholder="Select secondary counsellor"
                  optionFilterProp="children"
                  allowClear
                >
                  {counsellors.map((c) => (
                    <Option key={c.id} value={c.id}>
                      {c.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Date Picker */}
          <Form.Item
            label="Select Date"
            name="date"
            rules={[{ required: true }]}
          >
            <DatePicker 
              disabled={isView} 
              style={{ width: "100%" }} 
              disabledDate={(current) => {
                // Disable past dates
                return current && current < dayjs().startOf('day');
              }}
            />
          </Form.Item>

          {/* Time Slots */}
          <Form.Item label={<Text strong>Available Slots</Text>}>
            <Row gutter={[8, 8]}>
              {displayedSlots.map((slot) => {
                const isBooked = bookedSlots.includes(slot);
                return (
                  <Col key={slot}>
                    <Button
                      disabled={isBooked || isView}
                      type={selectedSlot === slot ? "primary" : "default"}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot}
                    </Button>
                  </Col>
                );
              })}
            </Row>

            <Space style={{ marginTop: 12 }}>
              {["All", "Available", "Booked"].map((f) => (
                <Button
                  key={f}
                  type={filter === f ? "primary" : "default"}
                  size="small"
                  onClick={() => setFilter(f)}
                  disabled={isView}
                >
                  {f}
                </Button>
              ))}
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
};

export default CreateSessionModal;