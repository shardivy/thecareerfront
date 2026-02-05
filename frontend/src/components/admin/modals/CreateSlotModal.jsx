// src/components/admin/modals/CreateSlotModal.jsx

import React, { useEffect } from "react";
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
} from "antd";
import { VideoCameraOutlined, EnvironmentOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { fetchLeadCounsellors } from "../../../adminSlices/counsellorSlice";

const { Option } = Select;

const CreateSlotModal = ({ open, onCancel, onCreate, editingSlot, mode = "create" }) => {
  const [form] = Form.useForm();
  const isView = mode === "view";
  const dispatch = useDispatch();

  useEffect(() => {
    if (open) {
      dispatch(fetchLeadCounsellors());
    }
  }, [open, dispatch]);

  const { list: leadCounsellors, loading: leadLoading, error } = useSelector(
    (state) => state.counsellors
  );

  // Populate form when editing a slot
  useEffect(() => {
    if (!editingSlot) {
      form.resetFields();
      return;
    }

    if (!leadLoading && leadCounsellors.length) {
      form.setFieldsValue({
        counsellor: editingSlot.counsellor?.id || undefined,
        date: editingSlot.date ? dayjs(editingSlot.date) : undefined,
        start_time: editingSlot.start_time ? dayjs(editingSlot.start_time, "HH:mm") : undefined,
        end_time: editingSlot.end_time ? dayjs(editingSlot.end_time, "HH:mm") : undefined,
        mode: editingSlot.mode || "online",
      });
    }
  }, [editingSlot, leadCounsellors, leadLoading, form]);

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
          {/* Counsellor */}
          <Col span={24}>
            <Form.Item
              label="Counsellor"
              name="counsellor"
              rules={isView ? [] : [{ required: true, message: "Please select a counsellor" }]}
            >
              {leadLoading ? (
                <Spin />
              ) : (
                <Select
                  placeholder="Select Counsellor"
                  style={readOnlyStyle}
                  open={isView ? false : undefined}
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

          {/* Date */}
          <Col span={24}>
            <Form.Item
              label="Date"
              name="date"
              rules={isView ? [] : [{ required: true, message: "Please select date" }]}
            >
              <DatePicker
                style={{ width: "100%", ...readOnlyStyle }}
                open={isView ? false : undefined}
              />
            </Form.Item>
          </Col>

          {/* Start Time */}
          <Col span={12}>
            <Form.Item
              label="Start Time"
              name="start_time"
              rules={isView ? [] : [{ required: true, message: "Please select start time" }]}
            >
              <TimePicker
                use12Hours
                format="hh:mm A"
                style={{ width: "100%", ...readOnlyStyle }}
                open={isView ? false : undefined}
              />
            </Form.Item>
          </Col>

          {/* End Time */}
          <Col span={12}>
            <Form.Item
              label="End Time"
              name="end_time"
              rules={isView ? [] : [{ required: true, message: "Please select end time" }]}
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
