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
  Card,
} from "antd";
import dayjs from "dayjs";

import {
  updateCounsellingBooking,
  markCounsellingBookingCompleted,
} from "../../../adminSlices/counsellingBookingSlice";
import { fetchPendingPaymentStudents } from "../../../adminSlices/paymentSlice";
import { fetchLeadCounsellors } from "../../../adminSlices/counsellorSlice";
import { fetchHandholdingUsers } from "../../../hhSlices/handholdingUsersSlice";
import { fetchBookedRescheduled, bookHandholdingSession , rescheduleSession ,markSessionCompleted } from "../../../hhSlices/sessionBookingSlice"

const { Option } = Select;
const { Text } = Typography;

const HHSessionBookingModal = ({ visible, onClose, onSave, mode = "create", data }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const isView = mode === "view";
  const isBookingMode =
    mode === "edit" && data?.status === "not_booked";

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [primaryCounsellorId, setPrimaryCounsellorId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [markCompletedEnabled, setMarkCompletedEnabled] = useState(false);
  const [filter, setFilter] = useState(mode === "view" ? "Available" : "All"); // Default filter
  const slotData = data?.slot || data; // 👈 IMPORTANT FIX

 const students = useSelector(
  (state) => state.handholdingUsers.list ?? []
);

const studentsLoading = useSelector(
  (state) => state.handholdingUsers.loading
);
  const counsellors = useSelector((state) => state.counsellors.list ?? []);
  const counsellorsLoading = useSelector((state) => state.counsellors.loading);

  const slotsLoading = useSelector((state) => state.counsellingSlots.loading);

  const bookingLoading = useSelector((state) => state.counsellingBooking.loading);

 const bookedRescheduledSlots = useSelector(
  (state) => state.sessionBooking?.bookedRescheduledList ?? []
);
  // ================= FETCH DROPDOWNS =================
 useEffect(() => {
  if (visible && !isView) {
    dispatch(fetchHandholdingUsers()); // ✅ NEW API
    dispatch(fetchLeadCounsellors());
  }
}, [visible, dispatch, isView]);


useEffect(() => {
  if (selectedDate) {
    const formattedDate = dayjs(selectedDate).format("YYYY-MM-DD");

    dispatch(fetchBookedRescheduled(formattedDate));
  }
}, [selectedDate, dispatch]);


  // ================= PREFILL CREATE / EDIT / VIEW =================
useEffect(() => {
  if (!visible || !data) return;
  if (!students?.length) return;

  const matchedUser = students.find(
    (s) => s.id === data.participant_id
  );

  if (!matchedUser) return;

  // ✅ Set form values
  form.setFieldsValue({
    student: {
      value: matchedUser.id,
      label: (
        <div>
          <div>
            {matchedUser.first_name} {matchedUser.last_name}
          </div>
          <div style={{ fontSize: 12, color: "#888" }}>
            {matchedUser.email}
          </div>
        </div>
      ),
    },
    preferred_counselling_mode: matchedUser.preferred_counselling_mode
      ? matchedUser.preferred_counselling_mode.charAt(0).toUpperCase() +
        matchedUser.preferred_counselling_mode.slice(1).toLowerCase()
      : undefined,

    // ✅ IMPORTANT: Set date in form
    date: data.date ? dayjs(data.date) : null,
  });

  // ✅ IMPORTANT: Set selectedDate (for slot API)
  if (data.date) {
    setSelectedDate(dayjs(data.date));
  }

  // ✅ IMPORTANT: Set selectedSlot
  if (data.slot) {
    setSelectedSlot({
     id: data.slot.slot_id,
      start_time: data.slot.start_time,
      end_time: data.slot.end_time,
      status: data.slot.status || "booked",
      student_name: data.student_name,
      email: data.email,
      phone: data.phone,
       counsellor_name: data.counsellor_name,
    });
  }

}, [visible, data, students]);


  const isSlotExpired = (slot) => {
    if (!selectedDate) return false;

    const today = dayjs().format("YYYY-MM-DD");
    const selected = dayjs(selectedDate).format("YYYY-MM-DD");

    // Only check time if selected date is today
    if (today !== selected) return false;

    const slotStart = dayjs(
      `${selected} ${slot.start_time}`,
      "YYYY-MM-DD hh:mm A"
    );

    return dayjs().isAfter(slotStart);
  };

const mergedSlots = bookedRescheduledSlots.map((b) => ({
  id: b.slot_id,
  start_time: b.start_time,
  end_time: b.end_time,
  status: b.status,
   is_handholding_session_available: b.is_handholding_session_available,

  // ✅ ADD THESE
  student_name: b.student_name,
  email: b.email,
  phone: b.phone,
 counsellor_name:
    b.counsellors?.map((c) => c.counsellor_name).join(", ") || "-",
}));

const filteredSlots = mergedSlots.filter((slot) => {
  if (isView) {
    return selectedSlot ? slot.id === selectedSlot.id : false;
  }

  if (filter === "All") return true;

  if (filter === "Available") {
    return slot.is_handholding_session_available === true;
    // ❌ removed !expired
  }

  if (filter === "Booked") {
    return slot.is_handholding_session_available === false;
    // ❌ removed || expired
  }

  return true;
});

  // ================= SUBMIT =================
const handleSubmit = () => {
  form.validateFields().then((values) => {
    if (!selectedSlot) {
      message.warning("Please select a slot");
      return;
    }

    const selectedUser = students.find(
      (s) => s.id === values.student.value
    );

    const payload = {
      participant_id: values.student.value,
 session_no: data.session_no,

      slot_id: selectedSlot.id,
      date: values.date.format("YYYY-MM-DD"),

    };

    let action;
// console.log("Selected User:", selectedUser);
    if (mode === "edit") {
      // ✅ RESCHEDULE API
      action = rescheduleSession({
  id: data.id,
  ...payload,
});
    } else {
      // ✅ BOOK API
      action = bookHandholdingSession(payload);
    }

    dispatch(action)
      .unwrap()
      .then(() => {
        message.success(
          mode === "edit"
            ? "Session rescheduled successfully"
            : "Session booked successfully"
        );
        resetModal();
        onSave?.();
        onClose();
      })
      .catch((err) => {
        message.error(err?.message || err || "Operation failed");
      });
  });
};
  /* ================= RESET FUNCTION ================= */
  const resetModal = () => {
    form.resetFields();
    setSelectedSlot(null);
    setPrimaryCounsellorId(null);
    setSelectedDate(null);
    setFilter(mode === "view" ? "Booked" : "All");
  };

  // ================= MARK AS COMPLETED =================
const handleMarkCompleted = () => {
  if (!data) return;

  Modal.confirm({
    title: "Mark Session as Completed",
    content: "Are you sure you want to mark this session as completed?",
    okText: "Yes",
    cancelText: "No",
    onOk: () => {
      const payload = {
        participant_id: data.participant_id,  // ✅ IMPORTANT
        session_no: data.session_no,          // ✅ IMPORTANT
      };

      dispatch(markSessionCompleted(payload))
        .unwrap()
        .then(() => {
          message.success("Session marked as completed");
          resetModal();
          onSave?.();
          onClose();
        })
        .catch((err) => {
          message.error(err?.message || err);
        });
    },
  });
};


  useEffect(() => {
    if (!data?.slot || !data.date) return;

    const updateButtonState = () => {
      const sessionDate = dayjs(data.date).format("YYYY-MM-DD");
      const slotStart = dayjs(`${sessionDate} ${data.slot.start_time}`, "YYYY-MM-DD hh:mm A");
      const fifteenMinutesBefore = slotStart.subtract(15, "minute");
      setMarkCompletedEnabled(dayjs().isAfter(fifteenMinutesBefore));
    };

    // Initial check
    updateButtonState();

    // Update every 30 seconds
    const interval = setInterval(updateButtonState, 30 * 1000);


    return () => clearInterval(interval);
  }, [data]);



  // ================= UI =================
  return (
    <ConfigProvider>
      <Modal
        open={visible}
        width={820}
        centered
        title={
          isView
            ? "View Counselling Session"
            : isBookingMode
              ? "Book Counselling Session"
              : mode === "edit"
                ? "Edit Counselling Session"
                : "Create Counselling Session"
        } onCancel={() => {
          resetModal();
          onClose();
        }}

        footer={
          isView ? (
            <Button key="close" onClick={onClose}>
              Close
            </Button>
          ) : mode === "edit" ? (
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>

              {/* Show Mark as Completed ONLY if not booking mode */}
              {/* {!isBookingMode && (
                <Button
                  key="mark"
                  type="primary"
                  onClick={handleMarkCompleted}
                  disabled={data?.status === "completed" || !markCompletedEnabled}
                  style={{
                    backgroundColor:
                      data?.status === "completed" || !markCompletedEnabled
                        ? "#d9d9d9" // Gray when disabled
                        : "#349304", // Green when enabled
                    borderColor:
                      data?.status === "completed" || !markCompletedEnabled
                        ? "#d9d9d9"
                        : "#52c41a",
                    color:
                      data?.status === "completed" || !markCompletedEnabled
                        ? "rgba(0,0,0,0.25)" // gray text for disabled
                        : "#fff",
                  }}
                >
                  Mark as Completed
                </Button>
              )} */}

              <div style={{ marginLeft: "auto" }}>
                <Button key="cancel" onClick={onClose} style={{ marginRight: 8 }}>
                  Cancel
                </Button>
                <Button
                  key="submit"
                  type="primary"
                  loading={bookingLoading}
                  onClick={handleSubmit}
                >
                  {isBookingMode ? "Book Session" : "Update"}
                </Button>
              </div>
            </div>
          ) : (
            // Create mode
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button key="cancel" onClick={onClose}>
                Cancel
              </Button>
              <Button
                key="submit"
                type="primary"
                loading={bookingLoading}
                onClick={handleSubmit}
                style={{ marginLeft: 8 }}
              >
                Confirm Booking
              </Button>
            </div>
          )
        }


      >

        <div style={{ maxHeight: "75vh", overflowY: "auto", paddingRight: 8 }}>
          <Form
            form={form}
            layout="vertical"
            onValuesChange={(changed, allValues) => {

              // When student changes
              if (changed.student) {

                const selectedStudent = students.find(
                  (s) => (s.student_id || s.id) === changed.student?.value
                );

                const backendMode = selectedStudent?.preferred_counselling_mode;

                if (backendMode && backendMode !== "Not Specified") {

                  const formattedMode =
                    backendMode.charAt(0).toUpperCase() +
                    backendMode.slice(1).toLowerCase();

                  form.setFieldsValue({
                    preferred_counselling_mode: formattedMode,
                  });
                }
              }

              if (changed.primaryCounsellor)
                setPrimaryCounsellorId(changed.primaryCounsellor.value);

              if (changed.date)
                setSelectedDate(changed.date);
            }}
          >
            {/* ================= STUDENT & MODE ================= */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Select User"
                  name="student"
                  rules={[{ required: true }]}
                >
                  <Select
                    placeholder="Select a user"
                    disabled={isView}
                    loading={studentsLoading}
                    showSearch
                    optionFilterProp="label"
                    labelInValue
                  >
                   {students.map((s) => (
  <Option
    key={s.id}
    value={s.id}
    label={`${s.first_name} ${s.last_name} (${s.email})`}
  >
    <div>
      <div>
        {s.first_name} {s.last_name}
      </div>
      <div>{s.email}</div>
    </div>
  </Option>
))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Preferred Counselling Mode" name="preferred_counselling_mode" rules={[{ required: true }]}>
                  <Select >
                    <Option value="Online">Online</Option>
                    <Option value="Offline">Offline</Option>
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
                        // type={selectedSlot?.id === slot.id && slot.status === "available" ? "primary" : "default"}
                        type={selectedSlot?.id === slot.id ? "primary" : "default"}
                        // disabled={slot.status === "booked" ||
                        //   slot.status === "rescheduled" || !slot.is_available || isSlotExpired(slot)}
                        //  disabled={slot.status === !slot.is_available}
                        disabled={
  !slot.is_handholding_session_available ||
  isSlotExpired(slot)
}
                        onClick={() => {
                         
                          
                          setSelectedSlot(slot);
                        }}
                      >
                        {slot.start_time} {slot.status === "booked"}
                      </Button>
                    </Col>
                  ))
                ) : (
                  <Text type="colorTextSecondary">No slots found</Text>
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

            {selectedSlot && (
  <Card style={{ marginTop: 16 }} title="Session Details">

       <p>
      <b>Counsellor Name:</b>{" "}
      {selectedSlot.counsellor_name || "-"}
    </p>

    <p>
      <b>Student Name:</b>{" "}
      {selectedSlot.student_name || form.getFieldValue("student")?.label || "-"}
    </p>

    <p>
      <b>Email:</b>{" "}
      {selectedSlot.email || "-"}
    </p>

    <p>
      <b>Mobile Number:</b>{" "}
      {selectedSlot.phone || "-"}
    </p>

    <p>
      <b>Date:</b>{" "}
      {selectedDate ? dayjs(selectedDate).format("DD MMM YYYY") : "-"}
    </p>

    <p>
      <b>Slot:</b>{" "}
      {selectedSlot.start_time}
    </p>

    
  </Card>
)}
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </ConfigProvider>
  );
};

export default HHSessionBookingModal;
