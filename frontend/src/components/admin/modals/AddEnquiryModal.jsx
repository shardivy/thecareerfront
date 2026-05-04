import React, { useEffect, useState } from "react";
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
  Divider,
  Upload,
  Card,
  Empty,
  Image,
} from "antd";
import { UploadOutlined, EyeOutlined } from "@ant-design/icons";
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
import { fetchActivePrograms } from "../../../adminSlices/programSlice";
import { fetchPackagesByProgram } from "../../../adminSlices/packageSlice";
import { fetchEnquiries } from "../../../adminSlices/enquiryListSlice";

const { Option } = Select;

const AddEnquiryModal = ({ open, onCancel, mode, enquiryData }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const liveValues = Form.useWatch([], form);
  const paymentType = Form.useWatch("payment_type", form);
  const paymentMethod = Form.useWatch("method", form);
  const amount = Form.useWatch("amount", form);

  const [fileList, setFileList] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);

  const { activeList: programs = [], loading: programsLoading } = useSelector(
    (state) => state.programs
  );
  const activePrograms = useSelector((state) => state.programs.activeList);

  const { list: packages = [], loading: packagesLoading } = useSelector(
    (state) => state.packages
  );
  const { fieldErrors = {}, error: convertError } = useSelector(
    (state) => state.convertEnquiry
  );

  const { loading: addLoading, success: addSuccess, message: addMessage } =
    useSelector((state) => state.addEnquiry);

  const { loading: convertLoading, success: convertSuccess, message: convertMessage } =
    useSelector((state) => state.convertEnquiry);

  const { loading: updateLoading, success: updateSuccess, message: updateMessage } =
    useSelector((state) => state.updateEnquiry);

  const selectedPackage = packages.find(
    (p) => p.id === liveValues?.package
  );

  const totalPackageAmount = selectedPackage
    ? Number(selectedPackage.price)
    : 0;


  const isConvert = mode === "convert";

  /* ================= FETCH PROGRAMS ================= */
  useEffect(() => {
    if (open) {
      dispatch(fetchActivePrograms());
    }
  }, [open, dispatch]);

  /* ================= PREFILL DATA ================= */
  useEffect(() => {
    if (!open || !enquiryData || mode === "add") return;
    if (programs.length === 0) return;

    const firstName = enquiryData.name?.split(" ")[0] || "";
    const lastName =
      enquiryData.name?.split(" ").slice(1).join(" ") || "";

    const programId =
      enquiryData.programId ??
      programs.find((p) => p.name === enquiryData.program)?.id ??
      null;

    form.setFieldsValue({
      firstName,
      lastName,
      phone: enquiryData.phone || "",
      email: enquiryData.email || "",
      program: programId,
      source: enquiryData.source || null,
      date: enquiryData.date ? dayjs(enquiryData.date) : null,
    });

    if (programId) {
      dispatch(fetchPackagesByProgram(programId));
    }
  }, [open, enquiryData, programs, dispatch, form, mode]);

  /* ================= SUCCESS HANDLING ================= */
  useEffect(() => {
    if (addSuccess || convertSuccess || updateSuccess) {
      const successMsg =
        addMessage || convertMessage || updateMessage || "Operation successful";

      message.success(successMsg);

      dispatch(fetchEnquiries());

      form.resetFields();
      setFileList([]);
      setPreviewUrl(null);

      dispatch(clearAddEnquiryState());
      dispatch(clearConvertState());
      dispatch(clearUpdateState());

      onCancel();
    }
  }, [
    addSuccess,
    convertSuccess,
    updateSuccess,
    addMessage,
    convertMessage,
    updateMessage,
    dispatch,
    form,
    onCancel,
  ]);

  useEffect(() => {
    // Map fieldErrors to AntD form
    if (fieldErrors && Object.keys(fieldErrors).length > 0) {
      const fields = Object.entries(fieldErrors).map(([name, msgs]) => ({
        name,
        errors: Array.isArray(msgs) ? msgs : [msgs],
      }));
      form.setFields(fields);
    }

    // Show general error
    if (convertError) {
      message.error(convertError);
    }
  }, [fieldErrors, convertError, form]);

  /* Reset method when payment type changes */
  useEffect(() => {
    if (!paymentType) return;

    if (paymentType === "offline") {
      form.setFieldsValue({
        method: "cash",
        transaction_id: undefined,
      });
    }

    if (paymentType === "online") {
      form.setFieldsValue({
        method: "upi",
      });
    }
  }, [paymentType, form]);

  useEffect(() => {
    if (paymentMethod !== "upi") {
      form.setFieldsValue({ transaction_id: undefined });
    }
  }, [paymentMethod, form]);


  /* ================= RESET WHEN ADD MODE ================= */
  useEffect(() => {
    if (open && mode === "add") {
      form.resetFields();
      setFileList([]);
      setPreviewUrl(null);
    }
  }, [open, mode, form]);


  /* ================= SUBMIT ================= */
  const handleSubmit = (values) => {
    if (isConvert && enquiryData?.id) {
      const formData = new FormData();

      formData.append("study_class", values.study_class);
      formData.append("program", values.program);
      formData.append("package", values.package);
      formData.append("preferred_counselling_mode", values.preferred_counselling_mode);
      formData.append("amount", values.amount);
      formData.append("payment_type", values.payment_type || "");
      formData.append("method", values.method || "");
      formData.append("transaction_id", values.transaction_id || "");
      formData.append("last_name", values.lastName || "");

      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append("proof_file", fileList[0].originFileObj);
      }

      dispatch(
        convertEnquiry({ id: enquiryData.id, payload: formData })
      );
      return;
    }

    const payload = {
      first_name: values.firstName,
      last_name: values.lastName,
      phone: values.phone,
      email: values.email,
      program: values.program,
      source: values.source ? values.source.toLowerCase() : null,
      date: values.date
        ? values.date.format("YYYY-MM-DD")
        : null,
    };

    if (mode === "edit") {
      dispatch(updateEnquiry({ id: enquiryData.id, ...payload }));
    } else {
      dispatch(addEnquiry(payload));
    }
  };

  const handleProgramChange = (programId) => {
    form.setFieldsValue({ package: undefined });
    dispatch(fetchPackagesByProgram(programId));
  };

  const handleFileChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);

    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      const url = URL.createObjectURL(
        newFileList[0].originFileObj
      );
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  useEffect(() => {
    if (open && mode === "convert") {
      form.setFieldsValue({
        preferred_counselling_mode: "online",
      });
    }
  }, [open, mode, form]);


  const disableFutureDates = (current) => {
    return current && current > dayjs().endOf("day");
  };

  const isWebsiteSource =
    enquiryData?.source?.toLowerCase() === "website";

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width="100%"
      style={{ maxWidth: isConvert ? 1100 : 600 }}
      centered
      bodyStyle={{ padding: 20 }}
      destroyOnClose
      title={
        isConvert
          ? "Convert Enquiry to User"
          : mode === "edit"
            ? "Edit Enquiry"
            : "Add Enquiry"
      }
    >
      <div style={{ maxHeight: "75vh", overflowY: "auto", paddingRight: 8 }}>
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Row gutter={[16, 16]}>

            {/* ================= LEFT SIDE FORM ================= */}
            <Col
              xs={24}
              sm={24}
              md={24}
              lg={isConvert ? 14 : 24}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="firstName"
                    label="First Name"
                    rules={[
                      { required: true, message: "Please enter first name" },
                      { min: 2, message: "First name must be at least 2 characters" },
                      {
                        pattern: /^[A-Za-z\s]+$/,
                        message: "First name can contain only letters",
                      },
                    ]}

                  >
                    <Input placeholder="Enter first name" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="lastName"
                    label="Last Name"
                    rules={[
                      { required: true, message: "Please enter last name" },
                      { min: 1, message: "Last name is required" },
                      {
                        pattern: /^[A-Za-z\s]+$/,
                        message: "Last name can contain only letters",
                      },
                    ]}

                  >
                    <Input placeholder="Enter last name" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="phone"
                    label="Mobile Number (WhatsApp)"
                    rules={[
                      {
                        required: true,
                        message: "Mobile number is required",
                      },
                      {
                        pattern: /^[0-9]{10}$/,
                        message: "Mobile number must be exactly 10 digits",
                      },
                    ]}
                  >
                    <Input
                      placeholder="Enter 10-digit mobile number"
                      maxLength={10}
                      disabled={isConvert && enquiryData?.phone} // disable only if convert mode AND phone exists
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: "Please enter email" },
                      { type: "email", message: "Please enter valid email address" },
                    ]}

                  >
                    <Input placeholder="Enter email address" disabled={isConvert} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="program"
                    label="Program"
                    rules={[{ required: true }]}
                  >
                    <Select
                      placeholder="Select program"
                      loading={programsLoading}
                      onChange={handleProgramChange}
                      disabled={isConvert && !isWebsiteSource}
                    >
                      {programs.map((p) => (
                        <Option key={p.id} value={p.id}>
                          {p.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item name="source" label="Source" >
                    <Select placeholder="Select source" disabled={isConvert} rules={
                      !isConvert
                        ? [{ required: true, message: "Please select source" }]
                        : []
                    }>
                      <Option value="website">Website</Option>
                      <Option value="whatsapp">WhatsApp</Option>
                      <Option value="call">Call</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item
                    name="date"
                    label="Enquiry Date"
                    rules={[{ required: true, message: "Please select enquiry date" }]}
                  >
                    <DatePicker
                      style={{ width: "100%" }}
                      format="YYYY-MM-DD"
                      disabled={isConvert}
                      disabledDate={disableFutureDates}
                    />
                  </Form.Item>
                </Col>


                {isConvert && (
                  <>
                    <Col span={24}>
                      <Divider />
                    </Col>

                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="study_class"
                        label="Class / STD"
                        rules={[{ required: true }]}
                      >
                        <Select placeholder="Select class / standard">
                          <Option value="8">8</Option>
                          <Option value="9">9</Option>
                          <Option value="10">10</Option>
                          <Option value="11">11</Option>
                          <Option value="12">12</Option>
                          <Option value="Engineering">Engineering</Option>
                          <Option value="Medical">Medical</Option>
                          <Option value="Law">Law</Option>
                          <Option value="Design">Design</Option>
                          <Option value="Commerce">Commerce</Option>
                          <Option value="Arts">Arts</Option>
                          <Option value="BBA">BBA</Option>
                          <Option value="UG">UG</Option>
                          <Option value="PG">PG</Option>
                          <Option value="Others">Others</Option>

                        </Select>
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="package"
                        label="Counselling Services"
                        rules={[{ required: true }]}
                      >
                        <Select placeholder="Select counselling service" loading={packagesLoading}>
                          {packages.map((p) => (
                            <Option key={p.id} value={p.id}>
                              {p.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    {isConvert && (
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="preferred_counselling_mode"
                          label="Preferred Counselling Mode"
                          rules={[
                            { required: true, message: "Please select counselling mode" },
                          ]}
                        >
                          <Select placeholder="Select counselling mode">
                            <Option value="online">Online</Option>
                            <Option value="offline">Offline</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    )}

                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="amount"
                        label="Fees Paid"
                        placeholder="Enter amount"
                        dependencies={["package"]}
                        rules={[
                          { required: true, message: "Please enter the amount paid" },
                          {
                            validator: (_, value) => {
                              const numericValue = Number(value);

                              if (value === undefined || value === null || value === "") {
                                return Promise.resolve();
                              }

                              if (isNaN(numericValue)) {
                                return Promise.reject("Amount must be a valid number");
                              }

                              if (numericValue < 0) {
                                return Promise.reject("Amount cannot be negative");
                              }

                              if (numericValue !== 0 && numericValue % 100 !== 0) {
                                return Promise.reject(
                                  "Amount must be ₹0 or multiples of ₹100"
                                );
                              }

                              if (numericValue > totalPackageAmount) {
                                return Promise.reject(
                                  `Amount cannot exceed ₹${totalPackageAmount}`
                                );
                              }

                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <Input
                          type="number"
                          min={0}
                        />
                      </Form.Item>
                    </Col>

                    {amount > 0 && (
                      <>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="payment_type"
                            label="Payment Type"
                            rules={[{ required: true }]}
                          >
                            <Select placeholder="Select payment type">
                              <Option value="online">Online</Option>
                              <Option value="offline">Offline</Option>
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="method"
                            label="Payment Method"
                            placeholder="Select payment method"
                            rules={[{ required: true }]}
                          >
                            <Select disabled={!paymentType}>
                              {paymentType === "online" && (
                                <Option value="upi">UPI</Option>
                              )}
                              {paymentType === "offline" && (
                                <Option value="cash">Cash</Option>
                              )}
                            </Select>
                          </Form.Item>
                        </Col>


                        {paymentMethod === "upi" && (
                          <Col xs={24} sm={12}>
                            <Form.Item
                              name="transaction_id"
                              label="Transaction ID"

                            >
                              <Input placeholder="Enter transaction ID" />
                            </Form.Item>
                          </Col>
                        )}



                        <Col span={24}>
                          <Form.Item label="Upload Receipt">
                            <Upload
                              beforeUpload={() => false}
                              maxCount={1}
                              fileList={fileList}
                              onChange={handleFileChange}
                            >
                              <Button
                                icon={<UploadOutlined />}
                                block
                              >
                                Upload Receipt
                              </Button>
                            </Upload>
                          </Form.Item>


                        </Col>
                      </>


                    )}
                  </>
                )}
              </Row>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                }}
              >
                <Button onClick={onCancel}>
                  Cancel
                </Button>

                <Button
                  type="primary"
                  htmlType="submit"
                  style={{ width: "140px" }}
                  loading={
                    isConvert
                      ? convertLoading
                      : addLoading || updateLoading
                  }
                >
                  {isConvert
                    ? "Convert User"
                    : mode === "edit"
                      ? "Update"
                      : "Add Enquiry"}
                </Button>
              </div>


            </Col>

            {/* ================= RIGHT SIDE PREVIEW ================= */}
            {isConvert && (
              <Col xs={24} sm={24} md={24} lg={10}>
                <Card title="Live Preview">
                  {!liveValues?.firstName ? (
                    <Empty description="Fill form to preview" />
                  ) : (
                    <>
                      <p>
                        <b>Name:</b>{" "}
                        {liveValues.firstName}{" "}
                        {liveValues.lastName}
                      </p>
                      <p>
                        <b>Mobile:</b> {liveValues.phone}
                      </p>
                      <p>
                        <b>Email:</b> {liveValues.email}
                      </p>

                      <Divider />

                      <p>
                        <b>Program:</b>{" "}
                        {programs.find(
                          (p) =>
                            p.id === liveValues.program
                        )?.name || "-"}
                      </p>

                      <p>
                        <b>Package:</b>{" "}
                        {packages.find(
                          (p) =>
                            p.id === liveValues.package
                        )?.name || "-"}
                      </p>

                      <p><b>Amount:</b> ₹{form.getFieldValue('amount') || '0'} / ₹{totalPackageAmount}</p>

                      <p>
                        <b>Payment:</b>{" "}
                        {liveValues.payment_type || "-"} /{" "}
                        {liveValues.method || "-"}
                      </p>

                      <p>
                        <b>Transaction:</b>{" "}
                        {liveValues.transaction_id || "-"}
                      </p>

                      <Divider />

                      {previewUrl ? (
                        <Image
                          src={previewUrl}
                          style={{
                            width: "100%",
                            maxHeight: 250,
                          }}
                          preview={{
                            mask: <EyeOutlined />,
                          }}
                        />
                      ) : (
                        <Empty description="No receipt uploaded" />
                      )}
                    </>
                  )}
                </Card>
              </Col>
            )}
          </Row>
        </Form>
      </div>
    </Modal>
  );
};

export default AddEnquiryModal;
