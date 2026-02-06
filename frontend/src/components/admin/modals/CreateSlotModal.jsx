import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Select,
  DatePicker,
  TimePicker,
  Radio,
  Button,
  Row,
  Col,
  Spin,
  Alert,
  Space,
  Typography,
} from "antd";
import {
  VideoCameraOutlined,
  EnvironmentOutlined,
  CloseOutlined,
} from "@ant-design/icons";
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

const CreateSlotModal = ({ open, onCancel }) => {
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
            // Parse time with multiple format attempts
            const parseTime = (timeStr) => {
              if (!timeStr) return null;
              
              const cleaned = timeStr.trim().toUpperCase();
              
              // Try different formats in order
              const formats = [
                "hh:mm A",  // 12-hour with leading zero
                "h:mm A",   // 12-hour without leading zero
                "HH:mm",    // 24-hour
              ];
              
              for (const format of formats) {
                const parsed = dayjs(cleaned, format, true);
                if (parsed.isValid()) {
                  return parsed;
                }
              }
              
              // If none worked, try to parse as is
              return dayjs(cleaned);
            };
            
            const startTime = parseTime(slot.start_time);
            const endTime = parseTime(slot.end_time);
            
            if (!startTime.isValid() || !endTime.isValid()) {
              console.warn("Invalid time format for slot:", slot);
              return null;
            }
            
            return {
              ...slot,
              start_time: startTime,
              end_time: endTime,
            };
          } catch (error) {
            console.error("Error parsing slot:", slot, error);
            return null;
          }
        })
        .filter(slot => slot !== null);
      
      setSlotsList(normalized);
    }
  }, [fetchedSlots]);

  /* ---------- ADD SLOT ---------- */
  const addSlot = () => {
    const start = form.getFieldValue("start_time");
    const end = form.getFieldValue("end_time");

    if (!start || !end) {
      setSlotError("Select start and end time");
      return;
    }

    if (!end.isAfter(start)) {
      setSlotError("End time must be after start time");
      return;
    }

    // Check for overlapping slots (15-minute buffer)
    const isOverlapping = slotsList.some(slot => {
      const slotStart = slot.start_time;
      const slotEnd = slot.end_time;
      
      return (
        (start.isAfter(slotStart) && start.isBefore(slotEnd)) ||
        (end.isAfter(slotStart) && end.isBefore(slotEnd)) ||
        (start.isSame(slotStart) && end.isSame(slotEnd)) ||
        (start.isBefore(slotEnd) && end.isAfter(slotStart))
      );
    });

    if (isOverlapping) {
      setSlotError("This slot overlaps with an existing slot");
      return;
    }

    const newSlot = {
      start_time: start,
      end_time: end,
      isNew: true,
    };

    setSlotsList((prev) => [...prev, newSlot]);
    form.setFieldsValue({ start_time: null, end_time: null });
    setSlotError("");
  };

  /* ---------- DELETE SLOT ---------- */
  const handleDeleteSlot = (slotId, index) => {
    if (slotId) {
      // delete from backend
      dispatch(deleteSlot(slotId));
    } else {
      // delete locally for new slots
      setSlotsList((prev) => prev.filter((_, i) => i !== index));
    }
  };

  /* ---------- CREATE SLOTS ---------- */
  const handleCreateSlots = (values) => {
    const date = dayjs(values.date).format("YYYY-MM-DD");
    const counsellorId = values.counsellor;
    const mode = values.mode;

    if (!slotsList.length) {
      setSlotError("Please add at least one slot");
      return;
    }

    // Convert slots to backend format (12-hour format with AM/PM)
    const normalizedSlots = slotsList.map((slot) => ({
      date,
      start_time: slot.start_time.format("hh:mm A"), // Keep 12-hour format with AM/PM
      end_time: slot.end_time.format("hh:mm A"),     // Keep 12-hour format with AM/PM
    }));

    const payload = {
      mode,
      slots: normalizedSlots,
    };

    console.log("FINAL PAYLOAD (12-hour format):", payload);
    console.log("Sample time format:", normalizedSlots[0]?.start_time);

    dispatch(createSlots({ date, counsellorId, payload })).then(() => {
      form.resetFields();
      setSlotsList([]);
      onCancel();
    });
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
              rules={[{ required: true, message: 'Please select a counsellor' }]}
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
                      {c.name}
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
              rules={[{ required: true, message: 'Please select a date' }]}
            >
              <DatePicker
                style={{ width: "100%" }}
                onChange={handleDateChange}
                disabledDate={(current) => {
                  return current && current < dayjs().startOf('day');
                }}
              />
            </Form.Item>
          </Col>

          {/* START & END TIME */}
          <Col span={10}>
            <Form.Item
              name="start_time"
              label="Start Time"
              style={{ marginBottom: 12 }}
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
          <Col span={10}>
            <Form.Item
              name="end_time"
              label="End Time"
              style={{ marginBottom: 12 }}
            >
              <TimePicker
                use12Hours
                format="hh:mm A"
                style={{ width: "100%" }}
                placeholder="End time"
                minuteStep={15}
                showNow={false}
              />
            </Form.Item>
          </Col>
          <Col span={4} style={{ display: 'flex', alignItems: 'flex-end' }}>
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
              <div style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto', border: '1px solid #d9d9d9', borderRadius: 6, padding: 12 }}>
                <Space wrap style={{ width: '100%' }}>
                  {slotsList.map((slot, index) => (
                    <div
                      key={slot.id || `new-slot-${index}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        margin: '4px',
                        padding: '6px 12px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: 4,
                        border: '1px solid #d9d9d9'
                      }}
                    >
                      <span style={{ marginRight: 8 }}>
                        {slot.start_time.format("hh:mm A")} - {slot.end_time.format("hh:mm A")}
                      </span>
                      <CloseOutlined 
                        onClick={() => handleDeleteSlot(slot.id, index)}
                        style={{ cursor: 'pointer', color: '#ff4d4f' }}
                      />
                    </div>
                  ))}
                </Space>
              </div>
            </Col>
          )}

          <Col span={24} style={{ marginTop: 16 }}>
            <Form.Item 
              name="mode" 
              label="Session Mode"
              rules={[{ required: true, message: 'Please select session mode' }]}
              initialValue="offline"
            >
              <Radio.Group>
                <Radio.Button value="online">
                  <VideoCameraOutlined /> Online
                </Radio.Button>
                <Radio.Button value="offline">
                  <EnvironmentOutlined /> Offline
                </Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Col>

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