// src/components/admin/modals/CreateSlotModal.jsx

import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Select,
  DatePicker,
  TimePicker,
  InputNumber,
  Radio,
  Button,
  Row,
  Col,
  Spin,
  Alert,
} from "antd";
import { VideoCameraOutlined, EnvironmentOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { fetchLeadCounsellors } from "../../../adminSlices/counsellorSlice";
import { fetchNormalCounsellors } from "../../../adminSlices/normalCounsellorSlice";

const { Option } = Select;

const CreateSlotModal = ({ open, onCancel, onCreate, editingSlot, mode = "create" }) => {
  const [form] = Form.useForm();
  const isView = mode === "view";
  const dispatch = useDispatch();


  useEffect(() => {
  if (open) {
    dispatch(fetchLeadCounsellors());
    dispatch(fetchNormalCounsellors());
  }
}, [open, dispatch]);




  // Fetch lead and normal counsellors from Redux
  const { list: leadCounsellors, loading: leadLoading, error } = useSelector(
    (state) => state.counsellors
  );
  const { list: normalList, loading: normalLoading } = useSelector(
    (state) => state.normalCounsellors
  );
  const normalCounsellors = Array.isArray(normalList) ? normalList : [];

 // Populate form when editing a slot - FIXED
useEffect(() => {
  if (!editingSlot) {
    form.resetFields();
    return;
  }

  if (!leadLoading && !normalLoading && leadCounsellors.length) {
    const leadId = editingSlot.lead_counsellor?.id;
    const normalId = editingSlot.normal_counsellor?.id;

    let parsedTime;
    if (editingSlot.start_time) {
      parsedTime = dayjs(editingSlot.start_time, "hh:mm A");
      if (!parsedTime.isValid()) parsedTime = dayjs(editingSlot.start_time, "HH:mm");
    }

    form.setFieldsValue({
      lead_counsellor: leadId || undefined,
      normalCounsellor: normalId || undefined,
      date: editingSlot.date ? dayjs(editingSlot.date) : undefined,
      start_time: parsedTime || undefined,
      mode: editingSlot.mode || "online",
      duration: editingSlot.duration_minutes || 60,
    });
  }
}, [editingSlot, leadCounsellors, normalCounsellors, leadLoading, normalLoading, form]);



  // Function to get modal title
  const getTitle = () => {
    if (mode === "view") return "View Counselling Slot";
    if (mode === "edit") return "Edit Counselling Slot";
    return "Create Counselling Slot";
  };



  const readOnlyStyle = isView ? { pointerEvents: "none", background: "transparent" } : {};

  return (
    <Modal title={getTitle()} open={open} onCancel={onCancel} destroyOnClose footer={null}>
      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}
      <Form form={form} layout="vertical" onFinish={onCreate}>
        <Row gutter={16}>
          {/* Lead Counsellor */}
          <Col span={24}>
            <Form.Item
              label="Lead Counsellor"
              name="lead_counsellor"
              rules={isView ? [] : [{ required: true, message: "Please select lead counsellor" }]}
            >
              {leadLoading ? (
                <Spin />
              ) : (
                <Select
                  placeholder="Select Lead Counsellor"
                  style={readOnlyStyle}
                  open={isView ? false : undefined}
                  loading={leadLoading}
                >
                  {leadCounsellors.map((c) => (
                    <Option key={c.id} value={c.id}>
                      {c.name}
                    </Option>
                  ))}
                </Select>
              )}
            </Form.Item>
          </Col>

          {/* Normal Counsellor */}
          <Col span={24}>
            <Form.Item label="Normal Counsellor (Optional)" name="normalCounsellor">
              <Select
                allowClear
                placeholder="Select Normal Counsellor"
                style={readOnlyStyle}
                open={isView ? false : undefined}
                loading={normalLoading}
              >
                {normalCounsellors.map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* Date */}
          <Col span={12}>
            <Form.Item
              label="Date"
              name="date"
              rules={isView ? [] : [{ required: true, message: "Please select date" }]}
            >
              <DatePicker style={{ width: "100%", ...readOnlyStyle }} open={isView ? false : undefined} />
            </Form.Item>
          </Col>

          {/* Time */}
          <Col span={12}>
            <Form.Item
              label="Time"
              name="start_time"
              rules={isView ? [] : [{ required: true, message: "Please select time" }]}
            >
              <TimePicker
                use12Hours
                format="hh:mm A"
                style={{ width: "100%", ...readOnlyStyle }}
                open={isView ? false : undefined}
              />
            </Form.Item>
          </Col>

          {/* Mode */}
          <Col span={24}>
            <Form.Item
              label="Session Mode"
              name="mode"
              rules={isView ? [] : [{ required: true, message: "Please select session mode" }]}
            >
              <Radio.Group style={readOnlyStyle}>
                <Radio.Button value="online">
                  <VideoCameraOutlined /> Online
                </Radio.Button>
                <Radio.Button value="offline">
                  <EnvironmentOutlined /> Offline
                </Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Col>

          {/* Duration */}
          <Col span={24}>
            <Form.Item
              label="Duration (minutes)"
              name="duration"
              rules={isView ? [] : [{ required: true, message: "Please enter duration" }]}
            >
              <InputNumber min={15} step={15} style={{ width: "100%" }} readOnly={isView} placeholder="Enter duration" />
            </Form.Item>
          </Col>

          {/* Buttons */}
          <Col span={24}>
            <Form.Item>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <Button onClick={onCancel}>{isView ? "Close" : "Cancel"}</Button>
                {!isView && (
                  <Button type="primary" htmlType="submit">
                    {mode === "edit" ? "Update" : "Create"}
                  </Button>
                )}
              </div>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default CreateSlotModal;
