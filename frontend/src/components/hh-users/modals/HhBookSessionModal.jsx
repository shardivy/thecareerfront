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
import { fetchLeadCounsellors } from "../../../adminSlices/counsellorSlice";
import { fetchSlotsByDate } from "../../../adminSlices/counsellingSlotSlice";
import { bookHandholdingSession, rescheduleSession, fetchBookedRescheduled } from "../../../hhSlices/sessionBookingSlice";

const { Title, Text } = Typography;

const HhBookSessionModal = ({ open, onClose, session, onConfirm, rescheduleData, participantId }) => {
  const dispatch = useDispatch();
  const preferredMode = localStorage.getItem("preferredCounsellingMode") || "online";
  const [mode, setMode] = useState(preferredMode);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedLeadCounsellor, setSelectedLeadCounsellor] = useState(null);
  const [selectedNormalCounsellor, setSelectedNormalCounsellor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slotFilter, setSlotFilter] = useState("all");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const getSlotKey = (slot) => slot?.slot_id ?? slot?.id ?? null;

  // ================= REDUX STATE =================
  const students = useSelector((state) => state.users.list ?? []);
  const studentsLoading = useSelector((state) => state.users.loading);

  const leadCounsellors = useSelector((state) => state.counsellors.list ?? []);
  const counsellorsLoading = useSelector((state) => state.counsellors.loading);

  const slotsByDate = useSelector((state) => state.sessionBooking.bookedRescheduledList ?? []);
  const slotsLoading = useSelector((state) => state.counsellingSlots.loading);

const bookingLoading = useSelector((state) => state.sessionBooking.loading);

  const studentId = localStorage.getItem("studentId");



  // ================= FETCH DROPDOWNS =================
  useEffect(() => {
    dispatch(fetchStudents());
    dispatch(fetchLeadCounsellors());
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

  // ================= FETCH SLOTS on DATE CHANGES =================
  useEffect(() => {
    if (selectedDate) {
      dispatch(
        fetchBookedRescheduled(
          dayjs(selectedDate).format("YYYY-MM-DD")
        )
      );
    }
  }, [selectedDate, dispatch]);

  useEffect(() => {
    if (!selectedSlot) return;

    const selectedSlotKey = getSlotKey(selectedSlot);
    const slotStillExists = slotsByDate.some(
      (slot) => getSlotKey(slot) === selectedSlotKey
    );

    if (!slotStillExists) {
      setSelectedSlot(null);
    }
  }, [slotsByDate, selectedSlot]);

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

  const isAvailable =
    slot.is_handholding_session_available && !expired;

  const isBooked =
    !slot.is_handholding_session_available || expired;

  if (slotFilter === "all") return true;

  if (slotFilter === "available") {
    return isAvailable;
  }

  if (slotFilter === "booked") {
    return isBooked;
  }

  return true;
});

  // ================= CONFIRM BOOKING =================
  const handleConfirm = () => {
      if (!selectedDate) {
      message.warning("Please select a date");
      return;
    }
    if (!selectedSlot) {
      message.warning("Please select a slot");
      return;
    }

   const payload = {
  date: dayjs(selectedDate).format("YYYY-MM-DD"),
  slot_id: selectedSlot.slot_id,
  mode,
  participant_id: participantId,   // ✅ ALWAYS SAFE
  session_no: session?.session_no,
};

    const action = rescheduleData
      ? rescheduleSession({
        id: rescheduleData.id,
        ...payload,
      })
      : bookHandholdingSession(payload);

    dispatch(action)
      .unwrap()
      .then(() => {
        message.success(rescheduleData ? "Session booked successfully" : "Session booked successfully");
        onClose?.();
        onConfirm?.(selectedSlot);
      })
   .catch((err) => {
  const errorMsg =
    typeof err === "string"
      ? err
      : err?.message ||
        err?.data?.message ||
        err?.payload?.message ||
        "Something went wrong";

  message.error(errorMsg);
});
  };

  // ================= GET COUNSELLOR DATA =================
  const getCounsellorById = (id) => leadCounsellors.concat([]).find((c) => c.id === id) || { name: "Not selected", type: "lead" };

  const selectedLeadData = selectedLeadCounsellor ? getCounsellorById(selectedLeadCounsellor) : null;
  const selectedNormalData = selectedNormalCounsellor ? getCounsellorById(selectedNormalCounsellor) : null;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={970}
      maskClosable={true}
      centered
      title={null}
    >
      <ConfigProvider>
        <div style={{ padding: "16px 12px" }}>
          <Title level={3}>{rescheduleData ? "Reschedule Counselling Session" : "Book Counselling Session"}</Title>
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
                  filteredSlots.map((slot) => {
  const isSelected = getSlotKey(selectedSlot) === getSlotKey(slot);
  const isDisabled =
    isSlotExpired(slot) ||
    !slot.is_handholding_session_available;

  return (
    <Col xs={24} sm={12} md={8} key={getSlotKey(slot) ?? `${slot.start_time}`}>
      <Button
        block
        size="large"
        type={isSelected ? "primary" : "default"}
        disabled={isDisabled}
        onClick={() => {
          if (!isDisabled) {
            setSelectedSlot(slot);
          }
        }}
        style={{
          borderRadius: 10,
          height: 48,
          opacity: isDisabled ? 0.5 : 1,
          cursor: isDisabled ? "not-allowed" : "pointer",
        }}
      >
        {slot.start_time} 
        {isSlotExpired(slot)}
        {!slot.is_handholding_session_available }
      </Button>
    </Col>
  );
})
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

                {selectedSlot && (
                  <div
                    style={{
                      marginTop: 16,
                      padding: 12,
                      border: "1px solid #f0f0f0",
                      borderRadius: 8,
                      background: "#fafafa",
                    }}
                  >
                    <Text strong style={{ display: "block", marginBottom: 8 }}>
                      Session Details
                    </Text>

  {/* Counsellors */}
    {selectedSlot?.counsellors?.length ? (
      <div style={{ marginBottom: 8 }}>
        <Text strong>Counsellors:</Text>

        <div style={{ marginTop: 6 }}>
          {selectedSlot.counsellors.map((c, index) => (
            <div key={index} style={{ marginBottom: 4 }}>
              <Space>
                <Avatar size="small" icon={<UserOutlined />} />
                <Text>{c.counsellor_name}</Text>
                {/* <Tag color={c.role === "lead" ? "gold" : "blue"}>
                  {c.role === "lead" ? "Lead" : "Assistant"}
                </Tag> */}
              </Space>
            </div>
          ))}
        </div>
      </div>
    ) : (
      <Text type="secondary">Counsellors: Not Assigned</Text>
    )}

                    {selectedSlot.student_name && (
                      <p><b>Student Name:</b> {selectedSlot.student_name}</p>
                    )}

                    {selectedSlot.email && (
                      <p><b>Email:</b> {selectedSlot.email}</p>
                    )}

                    {selectedSlot.phone && (
                      <p><b>Mobile:</b> {selectedSlot.phone}</p>
                    )}

                    <p>
                      <b>Date:</b>{" "}
                      {selectedDate ? dayjs(selectedDate).format("DD MMM YYYY") : "-"}
                    </p>

                    <p>
                      <b>Slot:</b> {selectedSlot.start_time}
                    </p>

                  </div>
                )}
              </Card>
            </Col>

            {/* RIGHT SECTION – SUMMARY */}
            <Col xs={24} md={8} style={{ position: "sticky", top: 24 }}>
              <Card style={{ borderRadius: 16, marginTop: 16 }}>
                <Space direction="vertical" size="large">
                  {/* <Space>
                    <Avatar size={48} icon={<UserOutlined />} />
                    <div>
                      <Text strong>Counsellor</Text><br />
                      <Text type="colorTextSecondary">{selectedLeadData?.first_name ?? "Not selected"}</Text>
                      {selectedLeadData && <Tag color="gold" size="small">Lead</Tag>}
                    </div>
                  </Space> */}
{selectedSlot?.counsellors?.length ? (
  selectedSlot.counsellors.map((c, index) => (
    <Space key={index} style={{ marginBottom: 12 }}>
      <Avatar size={48} icon={<UserOutlined />} />

      <div>
        <Text strong>Counsellor</Text>
        <br />

        <Text type="colorTextSecondary">
          {c.counsellor_name}
        </Text>
      </div>
    </Space>
  ))
) : (
  <Space style={{ marginBottom: 12 }}>
    <Avatar size={48} icon={<UserOutlined />} />

    <div>
      <Text strong>Counsellor</Text>
      <br />

      <Text type="colorTextSecondary">
        Not Assigned
      </Text>
    </div>
  </Space>
)}

                  {selectedNormalData && (
                    <Space>
                      <Avatar size={48} icon={<UserOutlined />} />
                      <div>
                        <Text strong>Assistant Counsellor</Text><br />
                        <Text type="colorTextSecondary">{selectedNormalData.first_name}</Text>
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


                  {/* <div>
                    <Text type="colorTextSecondary">Duration</Text><br />
                    <Text strong>60 Minutes</Text>
                  </div> */}

                  <Button
                    type="primary"
                    block
                    disabled={!selectedSlot}
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
    </Modal>
  );
};

export default HhBookSessionModal;
