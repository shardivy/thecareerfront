import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
  message,
} from "antd";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";

import {
  addEnquiry,
  clearAddEnquiryState,
} from "../../../adminSlices/addEnquirySlice";
import {
  convertEnquiry,
  clearConvertState,
} from "../../../adminSlices/convertEnquirySlice";
import {
  updateEnquiry,
  clearUpdateState,
} from "../../../adminSlices/updateEnquirySlice";
import { fetchPrograms } from "../../../adminSlices/programSlice";
import { fetchEnquiries } from "../../../adminSlices/enquiryListSlice";

const { Option } = Select;

const AddEnquiryModal = ({ open, onCancel, mode, enquiryData, readonly }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  // ---------------- REDUX STATES ----------------
  const { loading: addLoading, success: addSuccess, error: addError } =
    useSelector((state) => state.addEnquiry);

  const {
    loading: convertLoading,
    success: convertSuccess,
    error: convertError,
  } = useSelector((state) => state.convertEnquiry);

  const {
    loading: updateLoading,
    success: updateSuccess,
    error: updateError,
  } = useSelector((state) => state.updateEnquiry);

  const { list: programs = [], loading: programLoading } = useSelector(
    (state) => state.programs
  );

  // ---------------- FETCH PROGRAMS ----------------
  useEffect(() => {
    if (open) {
      dispatch(fetchPrograms());
    }
  }, [open, dispatch]);

  // ---------------- PREFILL FORM ----------------
  useEffect(() => {
    if (open && enquiryData) {
      const programId =
        enquiryData.programId ??
        programs.find((p) => p.name === enquiryData.program)?.id ??
        null;

      form.setFieldsValue({
        firstName:
          enquiryData.first_name ||
          enquiryData.name?.split(" ")[0] ||
          "",
        lastName:
          enquiryData.last_name ||
          enquiryData.name?.split(" ")[1] ||
          "",
        phone: enquiryData.phone || "",
        email: enquiryData.email || "",
        program: programId, // ✅ ALWAYS ID
        source: enquiryData.source?.toLowerCase() || null,
        date: enquiryData.date ? dayjs(enquiryData.date) : null,
      });
    } else {
      form.resetFields();
    }
  }, [open, enquiryData, programs, form]);

  // ---------------- SUCCESS HANDLING ----------------
  useEffect(() => {
    if (addSuccess) {
      message.success("Enquiry added successfully");
      dispatch(clearAddEnquiryState());
      dispatch(fetchEnquiries());
      form.resetFields();
      onCancel();
    }

    if (convertSuccess) {
      message.success("Enquiry converted to user");
      dispatch(clearConvertState());
      dispatch(fetchEnquiries());
      form.resetFields();
      onCancel();
    }

    if (updateSuccess) {
      message.success("Enquiry updated successfully");
      dispatch(clearUpdateState());
      dispatch(fetchEnquiries());
      form.resetFields();
      onCancel();
    }
  }, [
    addSuccess,
    convertSuccess,
    updateSuccess,
    dispatch,
    form,
    onCancel,
  ]);

  // ---------------- ERROR HANDLING ----------------
  useEffect(() => {
    if (addError) {
      message.error(addError);
      dispatch(clearAddEnquiryState());
    }
    if (convertError) {
      message.error(convertError);
      dispatch(clearConvertState());
    }
    if (updateError) {
      message.error(updateError);
      dispatch(clearUpdateState());
    }
  }, [addError, convertError, updateError, dispatch]);

  // ---------------- SUBMIT ----------------
  const handleSubmit = (values) => {
    if (mode === "convert" && enquiryData?.id) {
      dispatch(convertEnquiry(enquiryData.id));
      return;
    }

    const payload = {
      first_name: values.firstName,
      last_name: values.lastName,
      phone: values.phone,
      email: values.email,
      program: values.program, // ✅ ID ONLY
      source: values.source,   // ✅ website / whatsapp / call
      date: values.date ? values.date.format("YYYY-MM-DD") : null,
    };

    if (mode === "edit" && enquiryData?.id) {
      dispatch(updateEnquiry({ id: enquiryData.id, ...payload }));
    } else {
      dispatch(addEnquiry(payload));
    }
  };

  // ---------------- DISABLE FUTURE DATES ----------------
  const disabledDate = (current) =>
    current && current > dayjs().endOf("day");

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      centered
      title={
        mode === "convert"
          ? "Convert Enquiry to User"
          : mode === "edit"
          ? "Edit Enquiry"
          : "Add Enquiry"
      }
    >
      <Form layout="vertical" form={form} onFinish={handleSubmit}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="firstName"
              label="First Name"
              rules={[{ required: true }]}
            >
              <Input disabled={readonly} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="lastName"
              label="Last Name"
              rules={[{ required: true }]}
            >
              <Input disabled={readonly} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="phone"
              label="WhatsApp Mobile Number"
              rules={[{ required: true, len: 10 }]}
            >
              <Input maxLength={10} disabled={readonly} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true, type: "email" }]}
            >
              <Input disabled={readonly} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="program"
              label="Program"
              rules={[{ required: true }]}
            >
              <Select
                placeholder="Select program"
                loading={programLoading}
                disabled={readonly}
              >
                {programs.map((p) => (
                  <Option key={p.id} value={p.id}>
                    {p.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="source"
              label="Source"
              rules={[{ required: true }]}
            >
              <Select disabled={readonly}>
                <Option value="website">Website</Option>
                <Option value="whatsapp">WhatsApp</Option>
                <Option value="call">Call</Option>
                <Option value="walk_in">Walk-In</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item name="date" label="Enquiry Date">
              <DatePicker
                style={{ width: "100%" }}
                disabledDate={disabledDate}
                disabled={readonly}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ textAlign: "right" }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={
              mode === "convert"
                ? convertLoading
                : mode === "edit"
                ? updateLoading
                : addLoading
            }
          >
            {mode === "convert"
              ? "Convert User"
              : mode === "edit"
              ? "Update Enquiry"
              : "Save Enquiry"}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddEnquiryModal;
