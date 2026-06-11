import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Select,
  DatePicker,
  TimePicker,
  Button,
  Row,
  Col,
  Spin,
  Alert,
  Space,
  Typography,
} from "antd";
import { CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllCounsellors } from "../../../adminSlices/counsellorSlice";
import {
  fetchSlotsByDate,
  deleteSlot,
  createSlots,
} from "../../../adminSlices/counsellingSlotSlice";

// Extend dayjs with customParseFormat plugin
dayjs.extend(customParseFormat);

const { Option } = Select;
const { Text } = Typography;

const CreateSlotModal = ({ open, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [slotsList, setSlotsList] = useState([]);
  const [slotError, setSlotError] = useState("");

  const resetModalState = () => {form.resetFields();
  setSlotsList([]);
  setSlotError("");
};


  const dispatch = useDispatch();

  const { list: counsellors, loading } = useSelector(
    (state) => state.counsellors
  );

const { modalSlots: fetchedSlots } = useSelector(
  (state) => state.counsellingSlots
);


  /* ---------- FETCH COUNSELLORS ---------- */
  useEffect(() => {
    if (open) dispatch(fetchAllCounsellors());
  }, [open, dispatch]);

  /* ---------- FETCH SLOTS ---------- */
  const fetchSlots = (date, counsellorId) => {
    dispatch(
      fetchSlotsByDate({
        date: date.format("YYYY-MM-DD"),
        counsellorId,
      })
    );
  };

  const handleDateChange = (date) => {
    form.setFieldsValue({ date });
    setSlotError("");

    const counsellorId = form.getFieldValue("counsellor");
    if (!date || !counsellorId) return;

    fetchSlots(date, counsellorId);
  };

  const handleCounsellorChange = (counsellorId) => {
    const date = form.getFieldValue("date");
    if (!date) return;

    fetchSlots(date, counsellorId);
  };

  /* ---------- UPDATE SLOT LIST ---------- */
  useEffect(() => {
    if (Array.isArray(fetchedSlots)) {
      const normalized = fetchedSlots
        .map((slot) => {
          try {
            const parseTime = (timeStr) => {
              if (!timeStr) return null;
              const cleaned = timeStr.trim().toUpperCase();
              const formats = ["hh:mm A", "h:mm A", "HH:mm"];
              for (const format of formats) {
                const parsed = dayjs(cleaned, format, true);
                if (parsed.isValid()) return parsed;
              }
              return dayjs(cleaned);
            };

            const startTime = parseTime(slot.start_time);
    if (!startTime.isValid()) return null;

return { ...slot, start_time: startTime };
          } catch {
            return null;
          }
        })
        .filter((slot) => slot !== null);

      setSlotsList(normalized);
    }
  }, [fetchedSlots]);

  

  /* ---------- ADD SLOT ---------- */
const addSlot = () => {
  const start = form.getFieldValue("start_time");

  if (!start) {
    setSlotError("Please select start time");
    return;
  }

  const alreadyExists = slotsList.some(
    (slot) =>
      slot.start_time.format("hh:mm A") ===
      start.format("hh:mm A")
  );

  if (alreadyExists) {
    setSlotError("Slot already added");
    return;
  }

  const newSlot = {
    start_time: start,
  };

  setSlotsList((prev) => [...prev, newSlot]);

  form.setFieldsValue({ start_time: null });

  setSlotError("");
};


  /* ---------- DELETE SLOT ---------- */
const handleDeleteSlot = (slotId, index) => {
  const date = form.getFieldValue("date");
  const counsellorId = form.getFieldValue("counsellor");

  if (slotId) {
    // Call delete API
    dispatch(deleteSlot(slotId))
      .then((res) => {
        if (!res.error) {
          // ✅ Refetch slots from API after deletion
          if (date && counsellorId) {
            dispatch(
              fetchSlotsByDate({
                date: dayjs(date).format("YYYY-MM-DD"),
                counsellorId,
              })
            );
          }
        }
      });
  } else {
    // For newly added (unsaved) slots, just remove from local state
    setSlotsList((prev) => prev.filter((_, i) => i !== index));
  }
};

  /* ---------- CREATE SLOTS ---------- */
  const handleCreateSlots = (values) => {
    const date = dayjs(values.date).format("YYYY-MM-DD");
    const counsellorId = values.counsellor;

    if (!slotsList.length) {
      setSlotError("Please add at least one slot");
      return;
    }

  const formattedSlots = slotsList.map((slot) => ({
  start_time: slot.start_time.format("hh:mm A"),
}));

    const payload = {
      counsellor_id: counsellorId,
      date: date,
      slots: formattedSlots,
    };
    // console.log("Sending slots:", formattedSlots);
    // console.log("Payload:", payload);
    dispatch(createSlots({ date, counsellorId, payload })).then((res) => {
      if (!res.error) {
        form.resetFields();
        setSlotsList([]);
        onSuccess(date);
        onCancel();
      }
    });
  };

/* ---------- DISABLE TIME BASED ON EXISTING SLOTS ---------- */
const getDisabledTime = (isStart) => (selectedValue) => {
  if (!selectedValue) return { disabledHours: () => [], disabledMinutes: () => [] };

  // Disabled hours
  const disabledHoursSet = new Set();
  const disabledMinutesMap = {};

  slotsList.forEach((slot) => {
    const startHour = slot.start_time.hour();
    const startMin = slot.start_time.minute();
    const endHour = slot.end_time.hour();
    const endMin = slot.end_time.minute();

    // All hours fully covered
    for (let h = startHour + 1; h < endHour; h++) {
      disabledHoursSet.add(h);
    }

    // Start hour minutes
    if (selectedValue.hour() === startHour) {
      for (let m = isStart ? startMin : 0; m <= (isStart ? 59 : endMin); m += 15) {
        if (!disabledMinutesMap[selectedValue.hour()]) disabledMinutesMap[selectedValue.hour()] = new Set();
        disabledMinutesMap[selectedValue.hour()].add(m);
      }
    }

    // End hour minutes
    if (selectedValue.hour() === endHour) {
      for (let m = 0; m <= endMin; m += 15) {
        if (!disabledMinutesMap[selectedValue.hour()]) disabledMinutesMap[selectedValue.hour()] = new Set();
        disabledMinutesMap[selectedValue.hour()].add(m);
      }
    }
  });

  return {
    disabledHours: () => Array.from(disabledHoursSet),
    disabledMinutes: (hour) => {
      return disabledMinutesMap[hour] ? Array.from(disabledMinutesMap[hour]) : [];
    },
  };
};

useEffect(() => {
  if (open) {
    resetModalState();
  }
}, [open]);

  /* ---------- UI ---------- */
  return (
    <Modal
      open={open}
      title="Create Counselling Slot"
      footer={null}
      onCancel={() => {
    resetModalState();
    onCancel();
  }}
      destroyOnClose
      width={600}
    >
      <Form form={form} layout="vertical" onFinish={handleCreateSlots}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="counsellor"
              label="Counsellor"
              rules={[{ required: true, message: "Please select a counsellor" }]}
            >
              {loading ? (
                <Spin />
              ) : (
                <Select
                  placeholder="Select counsellor"
                  onChange={handleCounsellorChange}
                  allowClear
                >
                  {counsellors.map((c) => (
                    <Option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name}
                    </Option>
                  ))}
                </Select>
              )}
            </Form.Item>
          </Col>

       <Row gutter={16} align="bottom">
  {/* DATE */}
  <Col xs={24} md={10}>
    <Form.Item
      name="date"
      label="Date"
      rules={[{ required: true, message: "Please select a date" }]}
      style={{ marginBottom: 16 }}
    >
      <DatePicker
        style={{ width: "100%" }}
        onChange={handleDateChange}
        disabledDate={(current) =>
          current && current < dayjs().startOf("day")
        }
      />
    </Form.Item>
  </Col>

  {/* START TIME */}
  <Col xs={24} md={10}>
    <Form.Item
      name="start_time"
      label="Start Time"
      style={{ marginBottom: 16 }}
    >
      <TimePicker
        use12Hours
        format="hh:mm A"
        style={{ width: "100%" }}
        placeholder="Start time"
        minuteStep={15}
        showNow={false}
      />
    </Form.Item>
  </Col>

  {/* ADD BUTTON */}
  <Col
    xs={24}
    md={4}
    style={{
      display: "flex",
      alignItems: "flex-end",
    }}
  >
    <Form.Item style={{ width: "100%", marginBottom: 16 }}>
      <Button
        type="primary"
        onClick={addSlot}
        style={{ width: "100%" }}
      >
        Add
      </Button>
    </Form.Item>
  </Col>
</Row>

          {slotError && (
            <Col span={24}>
              <Alert type="error" message={slotError} showIcon />
            </Col>
          )}

          {/* DISPLAY SLOTS */}
          {slotsList.length > 0 && (
            <Col span={24} style={{ marginTop: 16 }}>
              <Text strong>Available Slots ({slotsList.length})</Text>
              <div
                style={{
                  marginTop: 8,
                  maxHeight: 200,
                  overflowY: "auto",
                  border: "1px solid #d9d9d9",
                  borderRadius: 6,
                  padding: 12,
                }}
              >
                <Space wrap style={{ width: "100%" }}>
                  {slotsList.map((slot, index) => (
                    <div
                      key={slot.id || `new-slot-${index}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        margin: "4px",
                        padding: "6px 12px",
                        backgroundColor: "#f0f0f0",
                        borderRadius: 4,
                        border: "1px solid #d9d9d9",
                      }}
                    >
                      <span style={{ marginRight: 8 }}>
                        {slot.start_time.format("hh:mm A")}
                      </span>
                      <CloseOutlined
                        onClick={() => handleDeleteSlot(slot.id, index)}
                        style={{ cursor: "pointer", color: "#ff4d4f" }}
                      />
                    </div>
                  ))}
                </Space>
              </div>
            </Col>
          )}

          <Col span={24} style={{ textAlign: "right", marginTop: 24 }}>
            <Button onClick={onCancel}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              style={{ marginLeft: 8 }}
              disabled={slotsList.length === 0}
            >
              Create Slots
            </Button>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default CreateSlotModal;
