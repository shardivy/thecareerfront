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
  Spin,
} from "antd";
import dayjs from "dayjs";

import {
  bookCounsellingSlot,
  updateCounsellingBooking,
} from "../../../adminSlices/counsellingBookingSlice";
import { fetchStudents } from "../../../adminSlices/userSlice";
import { fetchLeadCounsellors } from "../../../adminSlices/counsellorSlice";
import { fetchSlotsByDate } from "../../../adminSlices/counsellingSlotSlice";

const { Option } = Select;
const { Text } = Typography;

const CreateSessionModal = ({ visible, onClose, onSave, mode = "create", data }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const isView = mode === "view";

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [primaryCounsellorId, setPrimaryCounsellorId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filter, setFilter] = useState(mode === "view" ? "Booked" : "All"); // Default filter

  const students = useSelector((state) => state.users.list ?? []);
  const studentsLoading = useSelector((state) => state.users.loading);

  const counsellors = useSelector((state) => state.counsellors.list ?? []);
  const counsellorsLoading = useSelector((state) => state.counsellors.loading);

  const slotsByDate = useSelector((state) => state.counsellingSlots.list ?? []);
  const slotsLoading = useSelector((state) => state.counsellingSlots.loading);

  const bookingLoading = useSelector((state) => state.counsellingBooking.loading);

  // ================= FETCH DROPDOWNS =================
  useEffect(() => {
    if (visible && !isView) {
      dispatch(fetchStudents());
      dispatch(fetchLeadCounsellors());
    }
  }, [visible, dispatch, isView]);

  // ================= PREFILL EDIT / VIEW =================
  useEffect(() => {
    if (!visible || !data || mode === "create") return;
    if (!students.length || !counsellors.length) return;

    const lead = data.counsellors?.find((c) => c.role === "lead");
    const assistant = data.counsellors?.find((c) => c.role === "assistant");

    form.setFieldsValue({
      student: data.student?.id,
      mode: data.slot?.mode
        ? data.slot.mode.charAt(0).toUpperCase() + data.slot.mode.slice(1)
        : undefined,
      primaryCounsellor: lead
        ? { value: lead.counsellor.id, label: `${lead.counsellor.first_name} ${lead.counsellor.last_name}` }
        : null,
      secondaryCounsellor: assistant
        ? { value: assistant.counsellor.id, label: `${assistant.counsellor.first_name} ${assistant.counsellor.last_name}` }
        : null,
      date: data.date ? dayjs(data.date) : null,
    });

    setPrimaryCounsellorId(lead?.counsellor?.id || null);
    setSelectedDate(data.date ? dayjs(data.date) : null);
    setSelectedSlot(data.slot || null);
  }, [visible, data, mode, students, counsellors, form]);

  // ================= FETCH SLOTS =================
  useEffect(() => {
    if (primaryCounsellorId && selectedDate && !isView) {
      dispatch(
        fetchSlotsByDate({
          counsellorId: primaryCounsellorId,
          date: dayjs(selectedDate).format("YYYY-MM-DD"),
        })
      );
    }
  }, [primaryCounsellorId, selectedDate, dispatch, isView]);

  // ================= SLOT FILTER =================
  const filteredSlots = slotsByDate.filter((slot) => {
    if (isView) return selectedSlot ? slot.id === selectedSlot.id : false; // Only booked slot in view
    if (filter === "All") return true; // Show all in create/edit
    if (filter === "Available") return slot.status === "available";
    if (filter === "Booked") return slot.status === "booked";
    return true;
  });

  // ================= SUBMIT =================
  const handleSubmit = () => {
    form.validateFields().then((values) => {
      if (!selectedSlot) {
        message.warning("Please select a slot");
        return;
      }

      const payload = {
        student_id: values.student,
        date: values.date.format("YYYY-MM-DD"),
        slots: [selectedSlot.id],
        counsellors_data: [
          { counsellor_id: primaryCounsellorId, role: "lead" },
          ...(values.secondaryCounsellor ? [{ counsellor_id: values.secondaryCounsellor.value, role: "assistant" }] : []),
        ],
      };

      const action = mode === "edit"
        ? updateCounsellingBooking({ id: data.id, payload })
        : bookCounsellingSlot(payload);

      dispatch(action)
        .unwrap()
        .then(() => {
          message.success(mode === "edit" ? "Session updated successfully" : "Session booked successfully");
          onSave?.();
          onClose();
        })
        .catch((err) => message.error(err));
    });
  };

  // ================= UI =================
  return (
    <ConfigProvider>
      <Modal
        open={visible}
        width={820}
        title={mode === "view" ? "View Counselling Session" : mode === "edit" ? "Edit Counselling Session" : "Create Counselling Session"}
        onCancel={onClose}
        footer={
          isView
            ? [<Button key="close" onClick={onClose}>Close</Button>]
            : [
                <Button key="cancel" onClick={onClose}>Cancel</Button>,
                <Button key="submit" type="primary" loading={bookingLoading} onClick={handleSubmit}>
                  {mode === "edit" ? "Update" : "Confirm Booking"}
                </Button>,
              ]
        }
      >
        <Form
          form={form}
          layout="vertical"
          onValuesChange={(changed) => {
            if (changed.primaryCounsellor) setPrimaryCounsellorId(changed.primaryCounsellor.value);
            if (changed.date) setSelectedDate(changed.date);
          }}
        >
          {/* ================= STUDENT & MODE ================= */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Student" name="student" rules={[{ required: true }]}>
                <Select disabled={isView} loading={studentsLoading} showSearch>
                  {students.map((s) => (
                    <Option key={s.id} value={s.id}>{s.first_name} {s.last_name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Mode" name="mode" rules={[{ required: true }]}>
                <Select disabled={isView}>
                  <Option value="Online">Online</Option>
                  <Option value="Offline">Offline</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* ================= PRIMARY & SECONDARY COUNSELLOR ================= */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Primary Counsellor" name="primaryCounsellor" rules={[{ required: true }]}>
                <Select disabled={isView} loading={counsellorsLoading} labelInValue placeholder="Select Primary Counsellor">
                  {counsellors.map((c) => (
                    <Option key={c.id} value={c.id}>{c.first_name} {c.last_name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Secondary Counsellor" name="secondaryCounsellor">
                <Select disabled={isView} allowClear labelInValue>
                  {counsellors.map((c) => (
                    <Option key={c.id} value={c.id} label={`${c.first_name} ${c.last_name}`}>
                      {c.first_name} {c.last_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* ================= DATE ================= */}
          <Form.Item label="Date" name="date" rules={[{ required: true }]}>
            <DatePicker disabled={isView} style={{ width: "100%" }} disabledDate={(d) => d && d < dayjs().startOf("day")} />
          </Form.Item>

  
           {/* ================= SLOTS ================= */}
          <Form.Item label={<Text strong>Slot</Text>}>
            <Row gutter={[8, 8]}>
              {slotsLoading ? (
                <Spin />
              ) : filteredSlots.length ? (
                filteredSlots.map((slot) => (
                  <Col key={slot.id}>
                    <Button
                      type={selectedSlot?.id === slot.id && slot.status === "available" ? "primary" : "default"}
                      disabled={slot.status === "booked"}
                      onClick={() => {
                        if (slot.status === "available") setSelectedSlot(slot);
                      }}
                    >
                      {slot.start_time} - {slot.end_time} {slot.status === "booked"}
                    </Button>
                  </Col>
                ))
              ) : (
                <Text type="secondary">No slots found</Text>
              )}
            </Row>


            {/* Show filter buttons only in create/edit mode */}
            {!isView && (
              <Space style={{ marginTop: 12 }}>
                {["All", "Available", "Booked"].map((f) => (
                  <Button
                    key={f}
                    size="small"
                    type={filter === f ? "primary" : "default"}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </Button>
                ))}
              </Space>
            )}
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
};

export default CreateSessionModal;
