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
  message
} from "antd";
import dayjs from "dayjs";
import { bookCounsellingSlot } from "../../../adminSlices/counsellingBookingSlice";
import { fetchStudents } from "../../../adminSlices/userSlice";

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
  const { loading } = useSelector((state) => state.counsellingBooking);
  const { list: students, loading: studentsLoading } = useSelector((state) => state.users || {});

  const isView = mode === "view";


  useEffect(() => {
  if (visible) {
    dispatch(fetchStudents());
  }
}, [visible, dispatch]);

  useEffect(() => {
    if (sessionData) {
      form.setFieldsValue({
        student: sessionData.user,
        leadCounsellor: sessionData.counsellors.find(c => c.type === "lead")?.name,
        normalCounsellor: sessionData.counsellors.find(c => c.type === "normal")?.name,
        mode: sessionData.mode,
        date: dayjs(sessionData.date),
      });
      setSelectedSlot(sessionData.slot);
    } else {
      form.resetFields();
      setSelectedSlot(null);
    }
  }, [sessionData, form]);

const handleOk = () => {
  form.validateFields().then((values) => {
    const payload = {
      user: values.student,
      counsellors: [
        { name: values.leadCounsellor, type: "lead" },
        ...(values.normalCounsellor
          ? [{ name: values.normalCounsellor, type: "normal" }]
          : []),
      ],
      date: values.date.format("YYYY-MM-DD"),
      start_time: selectedSlot, // backend-friendly
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
  const displayedSlots = timeSlots.filter(slot => {
    if (filter === "All") return true;
    const isBooked = bookedSlots.includes(slot);
    return filter === "Available" ? !isBooked : isBooked;
  });

  return (
    <ConfigProvider
      theme={{
        components: {
          Select: {
            colorBgContainerDisabled: 'transparent',
          },
          DatePicker: {
            colorBgContainerDisabled: 'transparent',
          },
          Input: {
            colorBgContainerDisabled: 'transparent',
          },
        },
      }}
    >
      <style>{mobileStyles}</style>
      <Modal
        open={visible}
        title={mode === "view" ? "View Counselling Session" : "Book Counselling Session"}
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
  loading={loading}
  onClick={handleOk}
  disabled={!selectedSlot}
>
  Confirm Booking
</Button>
              ]
        }
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Student Name" name="student" rules={[{ required: true }]}>
<Select
  disabled={isView}
  loading={studentsLoading}
  showSearch
  optionFilterProp="label"
  placeholder="Select student"
>
  {students?.map((student) => {
    const fullName = `${student.first_name} ${student.last_name}`;
    return (
      <Option
        key={student.id}
        value={student.id}   // ✅ what gets submitted
        label={`${fullName} ${student.email}`} // ✅ used for search
      >
        <div>
          <Text>{fullName}</Text>
          <div style={{ fontSize: 12 }}>
            {student.email}
          </div>
        </div>
      </Option>
    );
  })}
</Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="Session Mode" name="mode" rules={[{ required: true }]}>
                <Select disabled={isView}>
                  <Option value="Online">Online</Option>
                  <Option value="Offline">Offline</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Lead Counsellor" name="leadCounsellor" rules={[{ required: true }]}>
                <Select disabled={isView}>
                  <Option value="Dr. Ramesh Gupta">Dr. Ramesh Gupta</Option>
                  <Option value="Dr. P Mehta">Dr. P Mehta</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="Normal Counsellor" name="normalCounsellor">
                <Select disabled={isView}>
                  <Option value="Ms. Priya Menon">Ms. Priya Menon</Option>
                  <Option value="Mr. K Joshi">Mr. K Joshi</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Select Date" name="date" rules={[{ required: true }]}>
            <DatePicker disabled={isView} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label={<Text strong>Available Slots</Text>}>
            <Row gutter={[8, 8]}>
              {displayedSlots.map(slot => {
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
              {["All", "Available", "Booked"].map(f => (
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