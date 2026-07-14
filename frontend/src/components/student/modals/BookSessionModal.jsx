import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Row,
  Col,
  Typography,
  Radio,
  DatePicker,
  Button,
  Space,
  Tag,
  Divider,
  Avatar,
  Select,
  Spin,
  ConfigProvider,
  message,
  Modal,
} from "antd";
import {
  VideoCameraOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { fetchStudents } from "../../../adminSlices/userSlice";
import { fetchReenaCounsellor } from "../../../adminSlices/counsellorSlice";
import { fetchSlotsByDate } from "../../../adminSlices/counsellingSlotSlice";
import { bookCounsellingSlot, updateCounsellingBooking } from "../../../adminSlices/counsellingBookingSlice";

const { Title, Text } = Typography;

const BookSessionModal = ({ rescheduleData, closeModal, onSave, selectedProgramId,
  selectedPackageId, }) => {
  const dispatch = useDispatch();
  const preferredMode = localStorage.getItem("preferredCounsellingMode") || "online";
  const [mode, setMode] = useState(preferredMode);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedLeadCounsellor, setSelectedLeadCounsellor] = useState(null);
  const [selectedNormalCounsellor, setSelectedNormalCounsellor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slotFilter, setSlotFilter] = useState("all");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // ================= REDUX STATE =================
  const students = useSelector((state) => state.users.list ?? []);
  const studentsLoading = useSelector((state) => state.users.loading);

  const leadCounsellors = useSelector((state) => state.counsellors.leadCounsellorList ?? []);
  const counsellorsLoading = useSelector((state) => state.counsellors.loading);

  const slotsByDate = useSelector((state) => state.counsellingSlots.modalSlots ?? []);
  const slotsLoading = useSelector((state) => state.counsellingSlots.loading);

  const bookingLoading = useSelector((state) => state.counsellingBooking.loading);

  const studentId = localStorage.getItem("studentId");

  // ================= FETCH DROPDOWNS =================
  useEffect(() => {
    dispatch(fetchStudents());
    dispatch(fetchReenaCounsellor());
  }, [dispatch]);



  // ================= PREFILL RESCHEDULE =================
  useEffect(() => {
    if (!rescheduleData) return;

    setMode(rescheduleData.mode);
    setSelectedSlot(rescheduleData.slot || null);

    let parsedDate = null;

    if (rescheduleData.date) {
      // Try normal parsing first
      parsedDate = dayjs(rescheduleData.date);

      // If invalid → try known formats (WITHOUT changing backend)
      if (!parsedDate.isValid()) {
        parsedDate = dayjs(rescheduleData.date, "DD-MM-YYYY");
      }
    }

    // ✅ Final fallback → current date
    if (!parsedDate || !parsedDate.isValid()) {
      parsedDate = dayjs();
    }

    setSelectedDate(parsedDate);

    const lead = rescheduleData.counsellors?.find((c) => c.role === "lead");
    const assistant = rescheduleData.counsellors?.find((c) => c.role === "assistant");

    setSelectedLeadCounsellor(lead?.counsellor.id || null);
    setSelectedNormalCounsellor(assistant?.counsellor.id || null);
  }, [rescheduleData]);

  // ================= FETCH SLOTS WHEN LEAD COUNSELLOR OR DATE CHANGES =================
  useEffect(() => {
    if (selectedLeadCounsellor && selectedDate) {
      dispatch(
        fetchSlotsByDate({
          counsellorId: selectedLeadCounsellor,
          date: dayjs(selectedDate).format("YYYY-MM-DD"),
        })
      );
    }
  }, [selectedLeadCounsellor, selectedDate, dispatch]);

  // ================= SLOT FILTER =================
  // const filteredSlots = slotsByDate.filter((slot) => {
  //   if (slotFilter === "available") return slot.status === "available";
  //   if (slotFilter === "booked") return slot.status === "booked";
  //   return true;
  // });


  const isSlotExpired = (slot) => {
    if (!selectedDate) return false;

    const today = dayjs().format("YYYY-MM-DD");
    const selected = dayjs(selectedDate).format("YYYY-MM-DD");

    // Only check expiry if selected date is today
    if (today !== selected) return false;

    const now = dayjs();

    const slotStart = dayjs(
      `${selected} ${slot.start_time}`,
      "YYYY-MM-DD hh:mm A"
    );

    return now.isAfter(slotStart);
  };

  const filteredSlots = slotsByDate.filter((slot) => {
    const expired = isSlotExpired(slot);

    const isAvailableLike =
      (slot.status === "available" || slot.status === "pending") &&
      slot.is_available;

    const isBookedLike =
      slot.status === "booked" ||
      slot.status === "rescheduled" ||
      slot.status === "completed" ||
      !slot.is_available;

    if (slotFilter === "all") return true;

    if (slotFilter === "available") {
      return isAvailableLike && !expired;
    }

    if (slotFilter === "booked") {
      return isBookedLike || expired;
    }

    return true;
  });

  // ================= CONFIRM BOOKING =================
  const handleConfirm = () => {
    if (!selectedLeadCounsellor) {
      message.warning("Please select a lead counsellor");
      return;
    }
    if (!selectedDate) {
      message.warning("Please select a date");
      return;
    }
    if (!selectedSlot) {
      message.warning("Please select a slot");
      return;
    }

    const payload = {
      // student_id: rescheduleData?.student_id || null,
      student_id: Number(studentId),
      date: dayjs(selectedDate).format("YYYY-MM-DD"),
      slots: [selectedSlot.id ?? selectedSlot.time],
      counsellors_data: [
        { counsellor_id: selectedLeadCounsellor, role: "lead" },
        selectedNormalCounsellor ? { counsellor_id: selectedNormalCounsellor, role: "assistant" } : null,
      ].filter(Boolean),
      mode,

      program: selectedProgramId,
      package: selectedPackageId,
    };

    const action = rescheduleData
      ? updateCounsellingBooking({ id: rescheduleData.id, payload })
      : bookCounsellingSlot(payload);

    dispatch(action)
      .unwrap()
      .then(() => {
        message.success(rescheduleData ? "Session booked successfully" : "Session booked successfully");
        closeModal();
        onSave?.();
      })
      .catch((err) => message.error(err));
  };

  // ================= GET COUNSELLOR DATA =================
  const getCounsellorById = (id) => leadCounsellors.concat([]).find((c) => c.id === id) || { name: "Not selected", type: "lead" };

  const selectedLeadData = selectedLeadCounsellor ? getCounsellorById(selectedLeadCounsellor) : null;
  const selectedNormalData = selectedNormalCounsellor ? getCounsellorById(selectedNormalCounsellor) : null;

  return (
    <ConfigProvider>
      <div style={{ padding: "16px 12px" }}>
        <Title level={3}>{rescheduleData ? "Book Counselling Session" : "Book Counselling Session"}</Title>
        <Text type="colorTextSecondary">
          {rescheduleData ? "Update your session date and time" : "Select your preferred date, counsellor and time slot"}
        </Text>
        <Divider />

        <Row gutter={[24, 24]}>
          {/* LEFT SECTION */}
          <Col xs={24} md={16}>
            {/* Session Mode */}
            <Card style={{ borderRadius: 16 }}>
              <Text strong>Session Mode</Text>
              <br />
              <Radio.Group
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                style={{ marginTop: 12, display: "flex", gap: 8 }}
              >
                <Radio.Button
                  value="online"
                  disabled={preferredMode === "offline"}
                >
                  <VideoCameraOutlined /> Online
                </Radio.Button>

                <Radio.Button
                  value="offline"
                  disabled={preferredMode === "online"}
                >
                  <EnvironmentOutlined /> Offline
                </Radio.Button>
              </Radio.Group>
            </Card>

            {/* Date + Counsellor */}
            <Card style={{ marginTop: 24, borderRadius: 16 }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Text strong><UserOutlined /> Select Counsellor *</Text>
                  <Select
                    placeholder="Select Lead Counsellor"
                    style={{ width: "100%", marginTop: 8 }}
                    value={selectedLeadCounsellor}
                    onChange={(val) => setSelectedLeadCounsellor(val)}
                    loading={counsellorsLoading}
                  >
                    {leadCounsellors.map((c) => (
                      <Select.Option key={c.id} value={c.id}>{c.first_name} {c.last_name}</Select.Option>
                    ))}
                  </Select>
                </Col>

                {/* <Col xs={24} md={12}>
                  <Text strong><UserOutlined /> Normal Counsellor (Optional)</Text>
                  <Select
                    placeholder="Select Normal Counsellor"
                    style={{ width: "100%", marginTop: 8 }}
                    value={selectedNormalCounsellor}
                    onChange={(val) => setSelectedNormalCounsellor(val)}
                    allowClear
                  >
                    {leadCounsellors.map((c) => (
                      <Select.Option key={c.id} value={c.id}>{c.first_name} {c.last_name}</Select.Option>
                    ))}
                  </Select>
                </Col> */}

                <Col xs={24} md={12}>
                  <Text strong><CalendarOutlined /> Select Date *</Text>
                  <DatePicker
                    style={{ width: "100%", marginTop: 8 }}
                    value={selectedDate}
                    onChange={(d) => setSelectedDate(d)}
                    disabledDate={(d) => d && d < dayjs().startOf("day")}
                  />
                </Col>
              </Row>
            </Card>

            {/* Slots */}
            <Card title={<Space><ClockCircleOutlined /> Available Slots</Space>} style={{ marginTop: 24, borderRadius: 16 }}>
              <Row gutter={[12, 12]}>
                {slotsLoading ? (
                  <Spin />
                ) : filteredSlots.length ? (
                  filteredSlots.map((slot) => (
                    <Col xs={24} sm={12} md={8} key={slot.id}>
                      <Button
                        block
                        size="large"
                        disabled={slot.status === "booked" || slot.status === "rescheduled" || slot.status === "completed" || !slot.is_available || isSlotExpired(slot)}
                        type={selectedSlot?.id === slot.id ? "primary" : "default"} // compare objects by id
                        onClick={() => {
                          if (
                            (slot.status === "available" ||
                              slot.status === "pending") &&
                            slot.status !== "completed" &&
                            !isSlotExpired(slot) &&
                            slot.is_available
                          ) {
                            setSelectedSlot(slot);
                          }
                        }}
                        style={{
                          borderRadius: 10,
                          height: 48,
                        }}
                      >
                        {slot.start_time}

                      </Button>
                    </Col>
                  ))
                ) : (
                  <Text type="colorTextSecondary">No slots found</Text>
                )}
              </Row>



              <Divider />
              <Space size="large" wrap>
                {["all", "available", "booked"].map((f) => (
                  <Space key={f} style={{ cursor: "pointer" }} onClick={() => setSlotFilter(f)}>
                    <Button
                      size="small"
                      style={{
                        width: 14, height: 14, borderRadius: 4,
                        background: slotFilter === f ? (f === "available" ? "#52c41a" : f === "booked" ? "#cf1322" : "#1677ff") : "#f0f0f0",
                        border: "none"
                      }}
                    />
                    <Text type={slotFilter === f ? "primary" : "colorTextSecondary"}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
                  </Space>
                ))}
              </Space>
            </Card>
          </Col>

          {/* RIGHT SECTION – SUMMARY */}
          <Col xs={24} md={8} style={{ position: "sticky", top: 24 }}>
            <Card style={{ borderRadius: 16, marginTop: 16 }}>
              <Space direction="vertical" size="large">
                <Space>
                  <Avatar size={48} icon={<UserOutlined />} />
                  <div>
                    <Text strong>Counsellor</Text><br />
                    <Text type="colorTextSecondary">{selectedLeadData?.first_name} {selectedLeadData?.last_name ?? "Not selected"}</Text>
                    {/* {selectedLeadData && <Tag color="gold" size="small">Lead</Tag>} */}
                  </div>
                </Space>

                {selectedNormalData && (
                  <Space>
                    <Avatar size={48} icon={<UserOutlined />} />
                    <div>
                      <Text strong>Assistant Counsellor</Text><br />
                      <Text type="colorTextSecondary">{selectedNormalData.first_name} {selectedNormalData.last_name ?? "Not selected"}</Text>
                      <Tag color="blue" size="small">Normal</Tag>
                    </div>
                  </Space>
                )}

                <Divider />

                <div>
                  <Text type="colorTextSecondary">Mode</Text><br />
                  <Tag color="blue">{mode.toUpperCase()}</Tag>
                </div>

                <div>
                  <Text type="colorTextSecondary">Selected Slot</Text>
                  <br />
                  <Text strong>
                    {selectedSlot
                      ? `${selectedSlot.start_time}`
                      : "Not selected"}
                  </Text>
                </div>

                {/* 
                <div>
                  <Text type="colorTextSecondary">Duration</Text><br />
                  <Text strong>60 Minutes</Text>
                </div> */}

                <Button
                  type="primary"
                  block
                  disabled={!selectedSlot || !selectedLeadCounsellor}
                  loading={bookingLoading}
                  onClick={() => setConfirmModalOpen(true)}
                >
                  {/* {rescheduleData ? "Confirm Reschedule" : "Confirm Booking"} */}
                  {rescheduleData ? "Confirm Booking" : "Confirm Booking"}
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>

        <Modal
          open={confirmModalOpen}
          onCancel={() => setConfirmModalOpen(false)}
          onOk={() => {
            setConfirmModalOpen(false);
            handleConfirm();
          }}
          okText="Yes, I Understand"
          cancelText="Cancel"
          // title={rescheduleData ? "Confirm Reschedule" : "Confirm Booking"}
          title={rescheduleData ? "Confirm Booking" : "Confirm Booking"}
        >
          <div style={{ lineHeight: 1.6 }}>
            <p style={{ fontWeight: "bold", color: "#cf1322" }}>
              🛑🛑 Important 🛑🛑
            </p>

            <p>
              <b>Please note 👇</b>
            </p>

            <p>
              If you cancel your existing counselling slot which is booked by you for
              any reason, it will be treated as a fresh appointment booking. You will
              likely get a later appointment after <b>8 to 10 days</b>, and timing will
              depend on availability 😊.
            </p>

            <p>
              We request your support and cooperation for the same.
            </p>
          </div>
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default BookSessionModal;
