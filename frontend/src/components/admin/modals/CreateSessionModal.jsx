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
  markCounsellingBookingCompleted,
} from "../../../adminSlices/counsellingBookingSlice";
import { fetchPendingPaymentStudents } from "../../../adminSlices/paymentSlice";
import { fetchReenaCounsellor, fetchLeadCounsellors } from "../../../adminSlices/counsellorSlice";
import { fetchSlotsByDate } from "../../../adminSlices/counsellingSlotSlice";

const { Option } = Select;
const { Text } = Typography;

const CreateSessionModal = ({ visible, onClose, onSave, mode = "create", data }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const isView = mode === "view";
  const isBookingMode =
    mode === "edit" && data?.status === "not_booked";

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [primaryCounsellorId, setPrimaryCounsellorId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [markCompletedEnabled, setMarkCompletedEnabled] = useState(false);
  const [filter, setFilter] = useState(mode === "view" ? "Booked" : "All"); // Default filter

  const students = useSelector(
    (state) => state.payment.pendingStudents ?? []
  );

  const studentsLoading = useSelector(
    (state) => state.payment.pendingStudentsLoading
  );
  const counsellors = useSelector((state) => state.counsellors.list ?? []);
  const counsellorsLoading = useSelector((state) => state.counsellors.loading);

  const slotsByDate = useSelector((state) => state.counsellingSlots.modalSlots ?? []);
  const slotsLoading = useSelector((state) => state.counsellingSlots.loading);

  const bookingLoading = useSelector((state) => state.counsellingBooking.loading);
  const leadCounsellors = useSelector((state) => state.counsellors.leadCounsellorList ?? []);

  // ================= FETCH DROPDOWNS =================
  useEffect(() => {
    if (visible && !isView) {
      dispatch(fetchPendingPaymentStudents());
      dispatch(fetchReenaCounsellor());
      dispatch(fetchLeadCounsellors());
    }
  }, [visible, dispatch, isView]);

  // ================= PREFILL CREATE / EDIT / VIEW =================
  // Prefill immediately when modal is opened with `data`.
   useEffect(() => {
    if (!visible || !data) return;

    const lead = data.counsellors?.find((c) => c.role === "lead");
    const assistant = data.counsellors?.find((c) => c.role === "assistant");

    // Determine mode for prefill (from student preference or slot)
    const prefillMode =
      data.student?.preferred_counselling_mode?.toLowerCase() === "online"
        ? "Online"
        : data.student?.preferred_counselling_mode?.toLowerCase() === "offline"
          ? "Offline"
          : data.slot?.mode
            ? data.slot.mode.charAt(0).toUpperCase() + data.slot.mode.slice(1)
            : undefined;

    form.setFieldsValue({
      student: {
        value: data.student?.id,
        label: (
          <div>
            <div>
              {data.student?.first_name || ""} {data.student?.last_name || ""}
            </div>
            <div style={{ fontSize: 12, color: "#888" }}>
              {data.student?.email || ""}
            </div>
          </div>
        ),
      },
      mode: prefillMode,
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
  }, [visible, data, form]);

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
  // const filteredSlots = slotsByDate.filter((slot) => {
  //   if (isView) return selectedSlot ? slot.id === selectedSlot.id : false; // Only booked slot in view
  //   if (filter === "All") return true; // Show all in create/edit
  //   if (filter === "Available") return slot.status === "available";
  //   if (filter === "Booked") return slot.status === "booked";
  //   return true;
  // });

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

  const filteredSlots = slotsByDate.filter((slot) => {
    const expired = isSlotExpired(slot);

    const isAvailableLike =
      slot.status === "available" || slot.status === "pending";

    const isBookedLike =
      slot.status === "booked" || slot.status === "rescheduled" || slot.status === "completed";;

    if (isView) {
      return selectedSlot ? slot.id === selectedSlot.id : false;
    }

    if (filter === "All") return true;

    if (filter === "Available") {
      return isAvailableLike && !expired;
    }

    if (filter === "Booked") {
      return isBookedLike || expired;
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

      const selectedStudent = students.find(
  (s) => (s.student_id || s.id) === values.student.value
);

      const payload = {
        student_id: values.student.value,
        date: values.date.format("YYYY-MM-DD"),
        slots: [selectedSlot.id],
        counsellors_data: [
          { counsellor_id: primaryCounsellorId, role: "lead" },
          ...(values.secondaryCounsellor ? [{ counsellor_id: values.secondaryCounsellor.value, role: "assistant" }] : []),
        ],
    program: data?.program?.id,
  package: data?.package?.id,
  
      };
      console.log("Modal Data", data);

      const action = mode === "edit"
        ? updateCounsellingBooking({ id: data.id, payload })
        : bookCounsellingSlot(payload);

      dispatch(action)
        .unwrap()
        .then(() => {
          message.success(mode === "edit" ? "Session updated successfully" : "Session booked successfully");
          resetModal();
          onSave?.();
          onClose();
        })
        .catch((err) => {
          // err could be string or object { message: "..." }
          const errorMsg =
            typeof err === "string" ? err :
              err?.message ? err.message :
                "Booking failed";

          message.error(errorMsg);
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
    if (!data?.id) return;

    Modal.confirm({
      title: "Mark Session as Completed",
      content: "Are you sure you want to mark this session as completed?",
      okText: "Yes",
      cancelText: "No",
      onOk: () => {
        dispatch(markCounsellingBookingCompleted(data.id))
          .unwrap()
          .then(() => {
            message.success("Session marked as completed");
            resetModal();
            onSave?.();
            onClose();
          })
          .catch((err) => message.error(err));
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
                    mode: formattedMode,
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
                  label="Student"
                  name="student"
                  rules={[{ required: true }]}
                >
                  <Select
                    disabled={isView}
                    loading={studentsLoading}
                    showSearch
                    optionFilterProp="label"
                    labelInValue
                  >
                    {students.map((s) => (
                      <Option
                        key={s.student_id || s.id}
                        value={s.student_id || s.id}
                        label={`${s.name}  (${s.email})`}
                      >
                        <div>
                          <div>
                            {s.name}
                          </div>
                          <div>{s.email}</div>
                        </div>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Preferred Counselling Mode" name="mode" rules={[{ required: true }]}>
                  <Select disabled>
                    <Option value="Online">Online</Option>
                    <Option value="Offline">Offline</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {/* ================= PRIMARY & SECONDARY COUNSELLOR ================= */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Lead Counsellor" name="primaryCounsellor" rules={[{ required: true }]}>
                  <Select
                    disabled={isView}
                    loading={counsellorsLoading}
                    labelInValue
                    placeholder="Select Lead Counsellor"
                  >
                    {leadCounsellors.map((c) => (
                      <Option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Assistant Counsellor" name="secondaryCounsellor">
                  <Select disabled={isView} allowClear labelInValue placeholder="Select Assistant Counsellor">
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
                        disabled={slot.status === "booked" ||
                          slot.status === "rescheduled" || slot.status === "completed" || !slot.is_available || isSlotExpired(slot)}
                        onClick={() => {
                          if (
                            (slot.status === "available" ||
                              slot.status === "pending") &&
                            slot.status !== "completed" &&
                            slot.is_available &&
                            !isSlotExpired(slot)
                          ) {
                            setSelectedSlot(slot);
                          }
                        }}
                      >
                        {slot.start_time}  {slot.status === "booked"}
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
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </ConfigProvider>
  );
};

export default CreateSessionModal;
