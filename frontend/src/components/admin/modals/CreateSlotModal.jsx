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
import { fetchLeadCounsellors } from "../../../adminSlices/counsellorSlice";
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

  const dispatch = useDispatch();

  const { list: counsellors, loading } = useSelector(
    (state) => state.counsellors
  );

  const { list: fetchedSlots } = useSelector(
    (state) => state.counsellingSlots
  );

  /* ---------- FETCH COUNSELLORS ---------- */
  useEffect(() => {
    if (open) dispatch(fetchLeadCounsellors());
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
            const endTime = parseTime(slot.end_time);

            if (!startTime.isValid() || !endTime.isValid()) return null;

            return { ...slot, start_time: startTime, end_time: endTime };
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
  const end = form.getFieldValue("end_time");
  const date = form.getFieldValue("date");
  const counsellorId = form.getFieldValue("counsellor");

  if (!start || !end || !date || !counsellorId) {
    setSlotError("Please select date, counsellor, start and end time");
    return;
  }

  if (!end.isAfter(start)) {
    setSlotError("End time must be after start time");
    return;
  }

  const newSlot = {
    start_time: start.format("hh:mm A"),
    end_time: end.format("hh:mm A"),
  };

  // Call API immediately
  dispatch(
    createSlots({ date: dayjs(date).format("YYYY-MM-DD"), counsellorId, payload: { counsellor_id: counsellorId, date: dayjs(date).format("YYYY-MM-DD"), slots: [newSlot] } })
  ).then((res) => {
    if (!res.error) {
      setSlotsList((prev) => [...prev, { ...newSlot, start_time: start, end_time: end }]);
      form.setFieldsValue({ start_time: null, end_time: null });
      setSlotError("");
    }
  });
};

  /* ---------- DELETE SLOT ---------- */
  const handleDeleteSlot = (slotId, index) => {
    if (slotId) {
      dispatch(deleteSlot(slotId));
    } else {
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
      end_time: slot.end_time.format("hh:mm A"),
    }));

    const payload = {
      counsellor_id: counsellorId,
      date: date,
      slots: formattedSlots,
    };
    console.log("Sending slots:", formattedSlots);
    console.log("Payload:", payload);
    dispatch(createSlots({ date, counsellorId, payload })).then((res) => {
      if (!res.error) {
        form.resetFields();
        setSlotsList([]);
        onSuccess();
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




  /* ---------- UI ---------- */
  return (
    <Modal
      open={open}
      title="Create Counselling Slot"
      footer={null}
      onCancel={onCancel}
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

          <Col span={24}>
            <Form.Item
              name="date"
              label="Date"
              rules={[{ required: true, message: "Please select a date" }]}
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

          {/* START & END TIME */}
          <Col span={10}>
            <Form.Item name="start_time" label="Start Time" style={{ marginBottom: 12 }}>
              <TimePicker
                use12Hours
                format="hh:mm A"
                style={{ width: "100%" }}
                placeholder="Start time"
                minuteStep={15}
                showNow={false}
                  disabledTime={getDisabledTime}
              />
            </Form.Item>
          </Col>
          <Col span={10}>
            <Form.Item name="end_time" label="End Time" style={{ marginBottom: 12 }}>
              <TimePicker
                use12Hours
                format="hh:mm A"
                style={{ width: "100%" }}
                placeholder="End time"
                minuteStep={15}
                showNow={false}
                  disabledTime={getDisabledTime}
              />
            </Form.Item>
          </Col>
          <Col span={4} style={{ display: "flex", alignItems: "flex-end" }}>
            <Button type="primary" onClick={addSlot} style={{ marginBottom: 12 }}>
              Add
            </Button>
          </Col>

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
                        {slot.start_time.format("hh:mm A")} - {slot.end_time.format("hh:mm A")}
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
