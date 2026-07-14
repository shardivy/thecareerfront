
import React, { useEffect, useState, useRef } from "react";
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
import { UploadOutlined, EyeOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
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
  const programRows = liveValues?.programs || [];
  const paymentType = Form.useWatch("payment_type", form);
  const paymentMethod = Form.useWatch("method", form);
  const amount = Form.useWatch("amount", form);

  const [fileList, setFileList] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [packagesByProgramId, setPackagesByProgramId] = useState({}); 
  const [programPkgLoading, setProgramPkgLoading] = useState({}); 
const selectedPrograms = Form.useWatch("program", form);
const selectedPackages = (liveValues?.programs || [])
  .map((p) => p?.package)
  .filter(Boolean);

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

  const { loading: addLoading, success: addSuccess, error: addError, message: addMessage } =
    useSelector((state) => state.addEnquiry);

  const { loading: convertLoading, success: convertSuccess, message: convertMessage } =
    useSelector((state) => state.convertEnquiry);

  const { loading: updateLoading, success: updateSuccess, message: updateMessage } =
    useSelector((state) => state.updateEnquiry);

  const getPackagePrice = (programId, packageId) => {
    if (!programId || !packageId) return 0;
    const pkg = (packagesByProgramId[programId] || []).find((p) => p.id === packageId);
    return pkg ? Number(pkg.price) : 0;
  };

  
  const selectedPackage = mode === "convert"
    ? (packagesByProgramId[liveValues?.programs?.[0]?.program] || []).find((p) => p.id === liveValues?.programs?.[0]?.package)
    : packages.find((p) => p.id === liveValues?.package);

  const selectedProgram = mode === "convert"
    ? programs.find((p) => p.id === liveValues?.programs?.[0]?.program)
    : programs.find((p) => p.id === liveValues?.program);

  const totalPackageAmount = mode === "convert"
    ? Array.isArray(liveValues?.programs)
      ? liveValues.programs.reduce(
          (sum, item) => sum + getPackagePrice(item.program, item.package),
          0
        )
      : selectedPackage
        ? Number(selectedPackage.price)
        : 0
    : selectedPackage
      ? Number(selectedPackage.price)
      : 0;

  const isEngineeringProgram = mode === "convert"
    ? Array.isArray(liveValues?.programs) && liveValues.programs.some((item) =>
        programs.find((p) => p.id === item.program)?.name === "Engineering"
      )
    : selectedProgram?.name === "Engineering";
  const isConvert = mode === "convert";
  const isView = mode === "view";

  /* ================= FETCH PROGRAMS ================= */
  useEffect(() => {
    if (open) {
      dispatch(fetchActivePrograms());
    }
  }, [open, dispatch]);

  // ✅ When packages Redux updates, extract program ID from packages and store by programId
  useEffect(() => {
    if (packages.length > 0 && packages[0]?.program?.id) {
      const programId = packages[0].program.id;
      setPackagesByProgramId((prev) => ({
        ...prev,
        [programId]: packages,
      }));
    }
  }, [packages]);

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

    // Ensure program field is an array for the form (backend expects array)
    const programValue = Array.isArray(programId) ? programId : (programId !== null ? [programId] : undefined);

    form.setFieldsValue({
      firstName,
      lastName,
      phone: enquiryData.phone || "",
      email: enquiryData.email || "",
      program: programValue,
      source: enquiryData.source || null,
      date: enquiryData.date ? dayjs(enquiryData.date) : null,
    });

    if (programId) {
      dispatch(fetchPackagesByProgram(Array.isArray(programId) ? programId[0] : programId));
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

  useEffect(() => {
    if (isConvert && isEngineeringProgram) {
      form.setFieldsValue({
        payment_type: "online",
        method: "upi",
      });
    }
  }, [isConvert, isEngineeringProgram, form]);

  /* ================= RESET WHEN ADD MODE ================= */
  useEffect(() => {
    if (open && mode === "add") {
      form.resetFields();
      setFileList([]);
      setPreviewUrl(null);
    }
  }, [open, mode, form]);

  const loadPackagesForIndex = (idx, programId) => {
    setProgramPkgLoading((prev) => ({ ...prev, [idx]: true }));
    dispatch(fetchPackagesByProgram(programId)).finally(() => {
      setProgramPkgLoading((prev) => ({ ...prev, [idx]: false }));
    });
  };

  const handleConvertProgramChange = (index, programId) => {
    const currentPrograms = form.getFieldValue("programs") || [];
    const nextPrograms = [...currentPrograms];

    nextPrograms[index] = {
      ...nextPrograms[index],
      program: programId,
      package: undefined,
    };

    const selectedProgram = programs.find((p) => p.id === programId);
    if (selectedProgram?.name?.toLowerCase() === "engineering") {
      form.setFieldsValue({
        payment_type: "online",
        method: "upi",
      });
    }

    form.setFieldsValue({ programs: nextPrograms });
    if (programId) {
      loadPackagesForIndex(index, programId);
    }
  };

  const handleRemoveProgramRow = (name, remove) => {
    remove(name);
    setProgramPkgLoading((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = (values) => {
    if (isConvert && enquiryData?.id) {
      const formData = new FormData();

      // Build programs array payload from Form.List rows
      // const programsPayload = (values.programs || []).map((p) => ({
      //   program: p.program,
      //   package: p.package,
      // }));

      // Support multiple program rows from Form.List (convert mode)
      if (Array.isArray(values.programs) && values.programs.length > 0) {
        (values.programs || []).forEach((p) => {
          if (p.program !== undefined) formData.append("program", p.program);
          if (p.package !== undefined) formData.append("package", p.package);
        });
      } else {
        formData.append("program", values.program || "");
        formData.append("package", values.package || "");
      }
      formData.append("study_class", values.study_class || "");
      formData.append("preferred_counselling_mode", values.preferred_counselling_mode || "");
      formData.append("amount", values.amount || 0);
      formData.append("payment_type", values.payment_type || "");
      formData.append("method", values.method || "");
      formData.append("transaction_id", values.transaction_id || "");
      formData.append("last_name", values.lastName || "");

      // Attach single receipt file if uploaded
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append("proof_file", fileList[0].originFileObj);
      }

      dispatch(convertEnquiry({ id: enquiryData.id, payload: formData }));
      return;
    }

    const payload = {
      first_name: values.firstName,
      last_name: values.lastName,
      phone: values.phone,
      email: values.email,
      // Always send program as an array (backend expects an array)
      program: Array.isArray(values.program) ? values.program : (values.program ? [values.program] : []),
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
    const programToFetch = Array.isArray(programId)
      ? programId[0]
      : programId;
    if (programToFetch) {
      dispatch(fetchPackagesByProgram(programToFetch));
    }
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
      // derive program IDs from enquiryData: prefer `program` array, then `programId`, then `program_detail`
      let programIds = [];
      if (Array.isArray(enquiryData?.program) && enquiryData.program.length) {
        programIds = enquiryData.program;
      } else if (Array.isArray(enquiryData?.programId) && enquiryData.programId.length) {
        programIds = enquiryData.programId;
      } else if (Array.isArray(enquiryData?.program_detail) && enquiryData.program_detail.length) {
        programIds = enquiryData.program_detail.map((p) => p.id);
      } else if (enquiryData?.programId) {
        programIds = [enquiryData.programId];
      } else if (enquiryData?.program) {
        programIds = [enquiryData.program];
      }

      const programRows = programIds.length
        ? programIds.map((pid) => ({ program: pid, package: undefined }))
        : [{ program: undefined, package: undefined }];

      form.setFieldsValue({
        preferred_counselling_mode: "online",
        programs: programRows,
      });

      // load packages for each program row
      programIds.forEach((pid, idx) => {
        if (pid) loadPackagesForIndex(idx, pid);
      });
    }
  }, [open, mode, form, enquiryData, programs]);

  const disableFutureDates = (current) => {
    return current && current > dayjs().endOf("day");
  };

  const isWebsiteSource =
    enquiryData?.source?.toLowerCase() === "website";


    const handHoldingProgram = programs.find(
  (p) => p.name?.toLowerCase() === "hand holding program"
);

const isHandHoldingSelected =
  Array.isArray(selectedPrograms) &&
  handHoldingProgram &&
  selectedPrograms.includes(handHoldingProgram.id);

  useEffect(() => {
  if (addError) {
    message.error(
      addError?.message || addError || "Failed to add enquiry"
    );
  }
}, [addError]);
   
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

                {!isConvert && (
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="program"
                      label={mode !== "convert" ? "Programs" : "Program"}
                      rules={[{ required: true }]}
                    >
                      <Select
                        mode={mode !== "convert" && !isHandHoldingSelected ? "multiple" : undefined}
                        placeholder={mode !== "convert" ? "Select programs" : "Select program"}
                        loading={programsLoading}
                        // onChange={handleProgramChange}
             onChange={(value) => {
            const handHoldingId = handHoldingProgram?.id;

  if (
    Array.isArray(value) &&
    handHoldingId &&
    value.includes(handHoldingId) &&
    value.length > 1
  ) {
    message.warning(
      "Hand Holding program cannot be selected with other programs."
    );
    // Keep only Hand Holding selected
    form.setFieldValue("program", [handHoldingId]);
    return;
  }
  handleProgramChange(value);
}}
                        disabled={isConvert && !isWebsiteSource}
                        allowClear
                      >
                        {programs.map((p) => (
                          <Option key={p.id} value={p.id}>
                            {p.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                )}

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

                <Col xs={24} sm={12}>
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

                    <Col xs={24}>
                      <Form.List name="programs">
                        {(fields, { add, remove }) => (
                          <>
                            {fields.map((field, index) => (
                              <Card
                                key={field.key}
                                style={{ marginBottom: 16, borderRadius: 8, border: "1px solid #e8e8e8" }}
                                title={
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontWeight: 600, fontSize: 14, color: "#1677ff" }}>
                                      {index === 0 ? "Program 1" : `Program ${index + 1}`}
                                    </span>
                                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                                      {index === 0 && !isView && (
                                        <span
                                          onClick={() => add({})}
                                          style={{ color: "#1677ff", cursor: "pointer", fontSize: 13, fontWeight: 500 }}
                                        >
                                          + Add Program
                                        </span>
                                      )}
                                      {fields.length > 1 && (
                                        <DeleteOutlined
                                          onClick={() => handleRemoveProgramRow(field.name, remove)}
                                          style={{ color: "red", cursor: "pointer", fontSize: 16 }}
                                        />
                                      )}
                                    </div>
                                  </div>
                                }
                              >
                                <Row gutter={[16, 0]}>
                                  <Col xs={24} sm={12}>
                                    <Form.Item
                                      {...field}
                                      name={[field.name, "program"]}
                                      label="Program"
                                      rules={[{ required: true, message: "Please select program" }]}
                                    >
                                      <Select
                                        placeholder="Select program"
                                        loading={programsLoading}
                                        onChange={(value) => handleConvertProgramChange(index, value)}
                                        // disabled={!isWebsiteSource}
                                        allowClear
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
                                    <Form.Item
                                      {...field}
                                      name={[field.name, "package"]}
                                      label="Counselling Service"
                                      rules={[{ required: true, message: "Please select service" }]}
                                    >
                                      {/* <Select
                                        placeholder="Select counselling service"
                                        loading={programPkgLoading[index]}
                                        // disabled={!isWebsiteSource}
                                        allowClear
                                      >
                                        {(packagesByProgramId[liveValues?.programs?.[index]?.program] || []).map((p) => (
                                          <Option key={p.id} value={p.id}>
                                            {p.name}
                                          </Option>
                                        ))}
                                      </Select> */}
                                      

                                      <Select
  placeholder="Select counselling service"
  loading={programPkgLoading[index]}
  allowClear
>
{(packagesByProgramId[liveValues?.programs?.[index]?.program] || []).map((p) => {
  const isDisabled = selectedPackages.includes(p.id);

  return (
    <Option key={p.id} value={p.id} disabled={isDisabled}>
      {p.name}
    </Option>
  );
})}
</Select>
                                    </Form.Item>
                                  </Col>
                                </Row>
                              </Card>
                            ))}
                          </>
                        )}
                      </Form.List>
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
                        dependencies={["package", "program", "programs"]}
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

                              if (isEngineeringProgram) {
                                if (numericValue !== totalPackageAmount) {
                                  return Promise.reject(
                                    `For Engineering program, Fees Paid must be exactly ₹${totalPackageAmount}`
                                  );
                                }
                                return Promise.resolve();
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
                          type="text"
                          placeholder="Enter amount"
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
                              {!isEngineeringProgram && (
                                <Option value="offline">Offline</Option>
                              )}
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
                              <Option value="upi">UPI</Option>
                              {!isEngineeringProgram && paymentType === "offline" && (
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
      rules={[
        {
          required: true,
          message: "Please enter transaction ID",
        },
      ]}
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

                      {(liveValues?.programs || []).map((prog, idx) => {
                        const progName = programs.find((p) => p.id === prog?.program)?.name;
                        const pkgs = packagesByProgramId[prog?.program] || [];
                        const pkgName = pkgs.find((p) => p.id === prog?.package)?.name;
                        const pkgPrice = pkgs.find((p) => p.id === prog?.package)?.price;

                        return (
                          <div key={idx}>
                            <Divider
                              orientation="left"
                              plain
                              style={{ fontSize: 13, color: "#888", margin: "10px 0" }}
                            >
                              {idx === 0 ? "Program 1" : `Program ${idx + 1}`}
                            </Divider>
                            <p><b>Program:</b>  {progName || "-"}</p>
                            <p><b>Service:</b>  {pkgName || "-"}</p>
                            <p><b>Price:</b> ₹{pkgPrice || "0"}</p>
                          </div>
                        );
                      })}

                      <Divider />
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



// import React, { useEffect, useRef, useState } from "react";
// import {
//   Modal,
//   Form,
//   Input,
//   Select,
//   DatePicker,
//   Button,
//   Row,
//   Col,
//   message,
//   Divider,
//   Upload,
//   Card,
//   Empty,
//   Image,
// } from "antd";
// import { UploadOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
// import dayjs from "dayjs";
// import { useDispatch, useSelector } from "react-redux";

// import { addEnquiry, clearAddEnquiryState } from "../../../adminSlices/addEnquirySlice";
// import { convertEnquiry, clearConvertState } from "../../../adminSlices/convertEnquirySlice";
// import { updateEnquiry, clearUpdateState } from "../../../adminSlices/updateEnquirySlice";
// import { fetchActivePrograms } from "../../../adminSlices/programSlice";
// import { fetchPackagesByProgram } from "../../../adminSlices/packageSlice";
// import { fetchEnquiries } from "../../../adminSlices/enquiryListSlice";

// const { Option } = Select;

// const CLASS_OPTIONS = [
//   "8", "9", "10", "11", "12",
//   "Engineering", "Medical", "Law", "Design",
//   "Commerce", "Arts", "BBA", "UG", "PG", "Others",
// ];

// const AddEnquiryModal = ({ open, onCancel, mode, enquiryData }) => {
//   const [form] = Form.useForm();
//   const dispatch = useDispatch();

//   // Watch top-level fields for live preview
//   const watchedFirstName = Form.useWatch("firstName", form);
//   const watchedLastName = Form.useWatch("lastName", form);
//   const watchedPhone = Form.useWatch("phone", form);
//   const watchedEmail = Form.useWatch("email", form);

//   // *** KEY FIX: Watch programs array directly — always fresh, no lag ***
//   const watchedPrograms = Form.useWatch("programs", form) || [];

//   // Per-row state maps (keyed by Form.List index)
//   const [programPackages, setProgramPackages] = useState({});
//   const [programPkgLoading, setProgramPkgLoading] = useState({});
//   const [programFileLists, setProgramFileLists] = useState({});
//   const [programPreviewUrls, setProgramPreviewUrls] = useState({});

//   // Track which index last triggered fetchPackages so we sync Redux list → that slot
//   const lastFetchIdx = useRef(null);

//   // Redux selectors
//   const { activeList: programs = [], loading: programsLoading } = useSelector((s) => s.programs);
//   const { list: reduxPackages = [] } = useSelector((s) => s.packages);
//   const { fieldErrors = {}, error: convertError } = useSelector((s) => s.convertEnquiry);
//   const { loading: addLoading, success: addSuccess, message: addMessage } = useSelector((s) => s.addEnquiry);
//   const { loading: convertLoading, success: convertSuccess, message: convertMessage } = useSelector((s) => s.convertEnquiry);
//   const { loading: updateLoading, success: updateSuccess, message: updateMessage } = useSelector((s) => s.updateEnquiry);

//   const isConvert = mode === "convert";
//   const isWebsiteSource = enquiryData?.source?.toLowerCase() === "website";

//   // ── Fetch packages for one row ────────────────────────────────────────────
//   const loadPackagesForIndex = (idx, programId) => {
//     lastFetchIdx.current = idx;
//     setProgramPkgLoading((prev) => ({ ...prev, [idx]: true }));
//     dispatch(fetchPackagesByProgram(programId)).finally(() => {
//       setProgramPkgLoading((prev) => ({ ...prev, [idx]: false }));
//     });
//   };

//   // Sync Redux packages list → the last-fetched row slot
//   useEffect(() => {
//     if (lastFetchIdx.current !== null) {
//       setProgramPackages((prev) => ({
//         ...prev,
//         [lastFetchIdx.current]: reduxPackages,
//       }));
//     }
//   }, [reduxPackages]);

//   // Fetch programs when modal opens
//   useEffect(() => {
//     if (open) dispatch(fetchActivePrograms());
//   }, [open, dispatch]);

//   // Prefill for edit mode
//   useEffect(() => {
//     if (!open || !enquiryData || mode === "add" || programs.length === 0) return;
//     const firstName = enquiryData.name?.split(" ")[0] || "";
//     const lastName = enquiryData.name?.split(" ").slice(1).join(" ") || "";
//     const programId =
//       enquiryData.programId ??
//       programs.find((p) => p.name === enquiryData.program)?.id ??
//       null;
//     form.setFieldsValue({
//       firstName,
//       lastName,
//       phone: enquiryData.phone || "",
//       email: enquiryData.email || "",
//       program: programId,
//       source: enquiryData.source || null,
//       date: enquiryData.date ? dayjs(enquiryData.date) : null,
//     });
//     if (programId) dispatch(fetchPackagesByProgram(programId));
//   }, [open, enquiryData, programs, dispatch, form, mode]);

//   // Reset for add mode
//   useEffect(() => {
//     if (open && mode === "add") {
//       form.resetFields();
//       form.setFieldsValue({ programs: [{}] });
//       setProgramFileLists({});
//       setProgramPreviewUrls({});
//       setProgramPackages({});
//       lastFetchIdx.current = null;
//     }
//   }, [open, mode, form]);

//   // Prefill for convert mode
//   useEffect(() => {
//     if (open && mode === "convert") {
//       form.setFieldsValue({
//         programs: [{
//           program: enquiryData?.programId || undefined,
//           preferred_counselling_mode: "online",
//         }],
//       });
//       if (enquiryData?.programId) {
//         loadPackagesForIndex(0, enquiryData.programId);
//       }
//     }
//   }, [open, mode, enquiryData]); // eslint-disable-line

//   // Success handler
//   useEffect(() => {
//     if (addSuccess || convertSuccess || updateSuccess) {
//       message.success(addMessage || convertMessage || updateMessage || "Operation successful");
//       dispatch(fetchEnquiries());
//       form.resetFields();
//       setProgramFileLists({});
//       setProgramPreviewUrls({});
//       setProgramPackages({});
//       lastFetchIdx.current = null;
//       dispatch(clearAddEnquiryState());
//       dispatch(clearConvertState());
//       dispatch(clearUpdateState());
//       onCancel();
//     }
//   }, [addSuccess, convertSuccess, updateSuccess]); // eslint-disable-line

//   // Server field errors
//   useEffect(() => {
//     if (fieldErrors && Object.keys(fieldErrors).length > 0) {
//       form.setFields(
//         Object.entries(fieldErrors).map(([name, msgs]) => ({
//           name,
//           errors: Array.isArray(msgs) ? msgs : [msgs],
//         }))
//       );
//     }
//     if (convertError) message.error(convertError);
//   }, [fieldErrors, convertError, form]);

//   // ── Handlers ──────────────────────────────────────────────────────────────

//   const handleProgramChangeForIndex = (idx, programId) => {
//     const progs = form.getFieldValue("programs") || [];
//     progs[idx] = { ...progs[idx], package: undefined };
//     form.setFieldsValue({ programs: [...progs] });
//     loadPackagesForIndex(idx, programId);
//   };

//   const handleFileChange = (idx, { fileList: newList }) => {
//     setProgramFileLists((prev) => ({ ...prev, [idx]: newList }));
//     if (newList.length > 0 && newList[0].originFileObj) {
//       setProgramPreviewUrls((prev) => ({
//         ...prev,
//         [idx]: URL.createObjectURL(newList[0].originFileObj),
//       }));
//     } else {
//       setProgramPreviewUrls((prev) => ({ ...prev, [idx]: null }));
//     }
//   };

//   const handleRemoveRow = (idx, removeFn, fieldName) => {
//     removeFn(fieldName);
//     setProgramPackages((prev) => { const n = { ...prev }; delete n[idx]; return n; });
//     setProgramFileLists((prev) => { const n = { ...prev }; delete n[idx]; return n; });
//     setProgramPreviewUrls((prev) => { const n = { ...prev }; delete n[idx]; return n; });
//     setProgramPkgLoading((prev) => { const n = { ...prev }; delete n[idx]; return n; });
//   };

//   const disableFutureDates = (current) => current && current > dayjs().endOf("day");

//   // ── Submit ────────────────────────────────────────────────────────────────
//   const handleSubmit = (values) => {
//     if (isConvert && enquiryData?.id) {
//       const formData = new FormData();
//       const programsPayload = (values.programs || []).map((p) => ({
//         program: p.program,
//         package: p.package,
//         study_class: p.study_class,
//         preferred_counselling_mode: p.preferred_counselling_mode,
//         amount: p.amount,
//         payment_type: p.payment_type || "",
//         method: p.method || "",
//         transaction_id: p.transaction_id || "",
//       }));
//       formData.append("programs", JSON.stringify(programsPayload));
//       formData.append("last_name", values.lastName || "");
//       (values.programs || []).forEach((_, idx) => {
//         const fl = programFileLists[idx];
//         if (fl?.[0]?.originFileObj) {
//           formData.append(`proof_file_${idx}`, fl[0].originFileObj);
//         }
//       });
//       dispatch(convertEnquiry({ id: enquiryData.id, payload: formData }));
//       return;
//     }

//     const payload = {
//       first_name: values.firstName,
//       last_name: values.lastName,
//       phone: values.phone,
//       email: values.email,
//       program: values.program,
//       source: values.source ? values.source.toLowerCase() : null,
//       date: values.date ? values.date.format("YYYY-MM-DD") : null,
//     };
//     if (mode === "edit") {
//       dispatch(updateEnquiry({ id: enquiryData.id, ...payload }));
//     } else {
//       dispatch(addEnquiry(payload));
//     }
//   };

//   // ── Render ────────────────────────────────────────────────────────────────
//   return (
//     <Modal
//       open={open}
//       onCancel={onCancel}
//       footer={null}
//       width="100%"
//       style={{ maxWidth: isConvert ? 1200 : 600 }}
//       centered
//       bodyStyle={{ padding: 20 }}
//       destroyOnClose
//       title={
//         isConvert ? "Convert Enquiry to User" :
//           mode === "edit" ? "Edit Enquiry" :
//             "Add Enquiry"
//       }
//     >
//       <div style={{ maxHeight: "80vh", overflowY: "auto", paddingRight: 8 }}>
//         <Form layout="vertical" form={form} onFinish={handleSubmit}>
//           <Row gutter={[16, 16]}>

//             {/* ══════════════ LEFT COLUMN ══════════════ */}
//             <Col xs={24} lg={isConvert ? 14 : 24}>
//               <Row gutter={[16, 16]}>

//                 <Col xs={24} sm={12}>
//                   <Form.Item
//                     name="firstName" label="First Name"
//                     rules={[
//                       { required: true, message: "Please enter first name" },
//                       { min: 2, message: "At least 2 characters" },
//                       { pattern: /^[A-Za-z\s]+$/, message: "Letters only" },
//                     ]}
//                   >
//                     <Input placeholder="Enter first name" />
//                   </Form.Item>
//                 </Col>

//                 <Col xs={24} sm={12}>
//                   <Form.Item
//                     name="lastName" label="Last Name"
//                     rules={[
//                       { required: true, message: "Please enter last name" },
//                       { pattern: /^[A-Za-z\s]+$/, message: "Letters only" },
//                     ]}
//                   >
//                     <Input placeholder="Enter last name" />
//                   </Form.Item>
//                 </Col>

//                 <Col xs={24} sm={12}>
//                   <Form.Item
//                     name="phone" label="Mobile Number (WhatsApp)"
//                     rules={[
//                       { required: true, message: "Mobile number is required" },
//                       { pattern: /^[0-9]{10}$/, message: "Must be exactly 10 digits" },
//                     ]}
//                   >
//                     <Input
//                       placeholder="Enter 10-digit mobile number"
//                       maxLength={10}
//                       disabled={isConvert && !!enquiryData?.phone}
//                     />
//                   </Form.Item>
//                 </Col>

//                 <Col xs={24} sm={12}>
//                   <Form.Item
//                     name="email" label="Email"
//                     rules={[
//                       { required: true, message: "Please enter email" },
//                       { type: "email", message: "Enter a valid email" },
//                     ]}
//                   >
//                     <Input placeholder="Enter email address" disabled={isConvert} />
//                   </Form.Item>
//                 </Col>

//                 {/* Program — non-convert only */}
//                 {!isConvert && (
//                   <Col xs={24} sm={12}>
//                     <Form.Item
//                       name="program" label="Program"
//                       rules={[{ required: true, message: "Please select program" }]}
//                     >
//                       <Select
//                         placeholder="Select program"
//                         loading={programsLoading}
//                         onChange={(val) => dispatch(fetchPackagesByProgram(val))}
//                       >
//                         {programs.map((p) => (
//                           <Option key={p.id} value={p.id}>{p.name}</Option>
//                         ))}
//                       </Select>
//                     </Form.Item>
//                   </Col>
//                 )}

//                 <Col xs={24} sm={12}>
//                   <Form.Item
//                     name="source" label="Source"
//                     rules={!isConvert ? [{ required: true, message: "Please select source" }] : []}
//                   >
//                     <Select placeholder="Select source" disabled={isConvert}>
//                       <Option value="website">Website</Option>
//                       <Option value="whatsapp">WhatsApp</Option>
//                       <Option value="call">Call</Option>
//                     </Select>
//                   </Form.Item>
//                 </Col>

//                 <Col xs={24} sm={12}>
//                   <Form.Item
//                     name="date" label="Enquiry Date"
//                     rules={[{ required: true, message: "Please select enquiry date" }]}
//                   >
//                     <DatePicker
//                       style={{ width: "100%" }}
//                       format="YYYY-MM-DD"
//                       disabled={isConvert}
//                       disabledDate={disableFutureDates}
//                     />
//                   </Form.Item>
//                 </Col>

//                 {/* ═══════════ PROGRAM CARDS — convert mode ═══════════ */}
//                 {isConvert && (
//                   <Col xs={24}>
//                     <Divider style={{ margin: "4px 0 12px" }} />
//                     <Form.List name="programs">
//                       {(fields, { add, remove }) => (
//                         <>
//                           {fields.map((field, index) => {
//                             // *** Read directly from watchedPrograms — always in sync ***
//                             const rowData = watchedPrograms[index] || {};
//                             const paymentType = rowData.payment_type;
//                             const paymentMethod = rowData.method;
//                             const amount = rowData.amount;

//                             const pkgs = programPackages[index] || [];
//                             const pkgsLoading = programPkgLoading[index] || false;
//                             const selectedPkg = pkgs.find((p) => p.id === rowData.package);
//                             const maxAmount = selectedPkg ? Number(selectedPkg.price) : 0;
//                             const previewUrl = programPreviewUrls[index] || null;
//                             const fileList = programFileLists[index] || [];

//                             return (
//                               <Card
//                                 key={field.key}
//                                 style={{ marginBottom: 16, borderRadius: 8, border: "1px solid #e8e8e8" }}
//                                 styles={{ body: { padding: "12px 16px 8px" } }}
//                                 title={
//                                   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//                                     <span style={{ fontWeight: 600, fontSize: 14, color: "#1677ff" }}>
//                                       {index === 0 ? "Program 1" : `Program ${index + 1}`}
//                                     </span>
//                                     <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
//                                       {index === 0 && (
//                                         <span
//                                           onClick={() => add({})}
//                                           style={{ color: "#1677ff", cursor: "pointer", fontSize: 13, fontWeight: 500 }}
//                                         >
//                                           + Add Program
//                                         </span>
//                                       )}
//                                       {fields.length > 1 && (
//                                         <DeleteOutlined
//                                           onClick={() => handleRemoveRow(index, remove, field.name)}
//                                           style={{ color: "red", cursor: "pointer", fontSize: 14 }}
//                                         />
//                                       )}
//                                     </div>
//                                   </div>
//                                 }
//                               >
//                                 <Row gutter={[16, 0]}>

//                                   {/* 1. Program */}
//                                   <Col xs={24} sm={12}>
//                                     <Form.Item
//                                       {...field}
//                                       name={[field.name, "program"]}
//                                       label="Program"
//                                       rules={[{ required: true, message: "Please select program" }]}
//                                     >
//                                       <Select
//                                         placeholder="Select program"
//                                         loading={programsLoading}
//                                         disabled={isConvert && !isWebsiteSource && index === 0}
//                                         onChange={(val) => handleProgramChangeForIndex(index, val)}
//                                       >
//                                         {programs.map((p) => (
//                                           <Option key={p.id} value={p.id}>{p.name}</Option>
//                                         ))}
//                                       </Select>
//                                     </Form.Item>
//                                   </Col>

//                                   {/* 2. Counselling Service */}
//                                   <Col xs={24} sm={12}>
//                                     <Form.Item
//                                       {...field}
//                                       name={[field.name, "package"]}
//                                       label="Counselling Service"
//                                       rules={[{ required: true, message: "Please select service" }]}
//                                     >
//                                       <Select
//                                         placeholder="Select counselling service"
//                                         loading={pkgsLoading}
//                                       >
//                                         {pkgs.map((p) => (
//                                           <Option key={p.id} value={p.id}>{p.name}</Option>
//                                         ))}
//                                       </Select>
//                                     </Form.Item>
//                                   </Col>

//                                   {/* 3. Class / STD */}
//                                   <Col xs={24} sm={12}>
//                                     <Form.Item
//                                       {...field}
//                                       name={[field.name, "study_class"]}
//                                       label="Class / STD"
//                                       rules={[{ required: true, message: "Please select class" }]}
//                                     >
//                                       <Select placeholder="Select class / standard">
//                                         {CLASS_OPTIONS.map((c) => (
//                                           <Option key={c} value={c}>{c}</Option>
//                                         ))}
//                                       </Select>
//                                     </Form.Item>
//                                   </Col>

//                                   {/* 4. Preferred Counselling Mode */}
//                                   <Col xs={24} sm={12}>
//                                     <Form.Item
//                                       {...field}
//                                       name={[field.name, "preferred_counselling_mode"]}
//                                       label="Preferred Counselling Mode"
//                                       rules={[{ required: true, message: "Please select mode" }]}
//                                     >
//                                       <Select placeholder="Select mode">
//                                         <Option value="online">Online</Option>
//                                         <Option value="offline">Offline</Option>
//                                       </Select>
//                                     </Form.Item>
//                                   </Col>

//                                   {/* 5. Fees Paid */}
//                                   <Col xs={24} sm={12}>
//                                     <Form.Item
//                                       {...field}
//                                       name={[field.name, "amount"]}
//                                       label={maxAmount ? `Fees Paid (max ₹${maxAmount})` : "Fees Paid"}
//                                       rules={[
//                                         { required: true, message: "Please enter the amount paid" },
//                                         {
//                                           validator: (_, value) => {
//                                             const num = Number(value);
//                                             if (value === undefined || value === null || value === "") return Promise.resolve();
//                                             if (isNaN(num)) return Promise.reject("Amount must be a valid number");
//                                             if (num < 0) return Promise.reject("Amount cannot be negative");
//                                             if (num !== 0 && num % 100 !== 0)
//                                               return Promise.reject("Amount must be ₹0 or multiples of ₹100");
//                                             if (maxAmount && num > maxAmount)
//                                               return Promise.reject(`Amount cannot exceed ₹${maxAmount}`);
//                                             return Promise.resolve();
//                                           },
//                                         },
//                                       ]}
//                                     >
//                                       <Input type="number" min={0} placeholder="Enter amount" />
//                                     </Form.Item>
//                                   </Col>

//                                   {/* ── Payment block: visible only when amount > 0 ── */}
//                                   <Form.Item shouldUpdate noStyle>
//                                     {() => {
//                                       const currentPrograms = form.getFieldValue("programs") || [];
//                                       const currentRow = currentPrograms[index] || {};

//                                       return Number(currentRow.amount) > 0 ? (
//                                         <>
//                                           {/* 6. Payment Type */}
//                                           <Col xs={24} sm={12}>
//                                             <Form.Item
//                                               {...field}
//                                               name={[field.name, "payment_type"]}
//                                               label="Payment Type"
//                                               rules={[{ required: true, message: "Please select payment type" }]}
//                                             >
//                                               <Select
//                                                 placeholder="Select payment type"
//                                                 onChange={(value) => {
//                                                   const currentPrograms = form.getFieldValue("programs") || [];

//                                                   currentPrograms[index] = {
//                                                     ...currentPrograms[index],
//                                                     payment_type: value,
//                                                     method: value === "online" ? "UPI" : "Cash",
//                                                     transaction_id:
//                                                       value === "offline"
//                                                         ? ""
//                                                         : currentPrograms[index]?.transaction_id,
//                                                   };

//                                                   form.setFieldsValue({
//                                                     programs: [...currentPrograms],
//                                                   });
//                                                 }}
//                                               >
//                                                 <Option value="online">Online</Option>
//                                                 <Option value="offline">Offline</Option>
//                                               </Select>

//                                             </Form.Item>
//                                           </Col>

//                                           {/* 7. Payment Method */}
//                                           <Col xs={24} sm={12}>
//                                             <Form.Item
//                                               {...field}
//                                               name={[field.name, "method"]}
//                                               label="Payment Method"
//                                             >
//                                               <Input
//                                                 readOnly
//                                                 placeholder="Payment method"
//                                                 value={
//                                                   currentRow?.method === "upi"
//                                                     ? "UPI"
//                                                     : currentRow?.method === "cash"
//                                                       ? "Cash"
//                                                       : ""
//                                                 }
//                                               />
//                                             </Form.Item>
//                                           </Col>

//                                           {/* 8. Transaction ID — only for UPI */}
//                                           {currentRow.method === "upi" && (
//                                             <Col xs={24} sm={12}>
//                                               <Form.Item
//                                                 {...field}
//                                                 name={[field.name, "transaction_id"]}
//                                                 label="Transaction ID"
//                                               >
//                                                 <Input placeholder="Enter transaction ID" />
//                                               </Form.Item>
//                                             </Col>
//                                           )}

//                                           {/* 9. Upload Receipt */}
//                                           <Col xs={24}>
//                                             <Form.Item label="Upload Receipt">
//                                               <Upload
//                                                 beforeUpload={() => false}
//                                                 maxCount={1}
//                                                 fileList={fileList}
//                                                 onChange={(info) => handleFileChange(index, info)}
//                                                 accept="image/*,application/pdf"
//                                               >
//                                                 <Button icon={<UploadOutlined />} block>
//                                                   Upload Receipt
//                                                 </Button>
//                                               </Upload>
//                                             </Form.Item>
                                           
//                                           </Col>
//                                         </>
//                                       ) : null;
//                                     }}
//                                   </Form.Item>

//                                 </Row>
//                               </Card>
//                             );
//                           })}
//                         </>
//                       )}
//                     </Form.List>
//                   </Col>
//                 )}

//               </Row>

//               {/* Action buttons */}
//               <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
//                 <Button onClick={onCancel}>Cancel</Button>
//                 <Button
//                   type="primary"
//                   htmlType="submit"
//                   style={{ width: 140 }}
//                   loading={isConvert ? convertLoading : addLoading || updateLoading}
//                 >
//                   {isConvert ? "Convert User" :
//                     mode === "edit" ? "Update" :
//                       "Add Enquiry"}
//                 </Button>
//               </div>
//             </Col>

//             {/* ══════════════ RIGHT PREVIEW — convert only ══════════════ */}
//             {isConvert && (
//               <Col xs={24} lg={10}>
//                 <Card
//                   title="Live Preview"
//                   style={{ position: "sticky", top: 0 }}
//                   styles={{ body: { padding: 16 } }}
//                 >
//                   {!watchedFirstName ? (
//                     <Empty description="Fill the form to see preview" />
//                   ) : (
//                     <>
//                       <p><b>Name:</b>   {watchedFirstName} {watchedLastName}</p>
//                       <p><b>Mobile:</b> {watchedPhone}</p>
//                       <p><b>Email:</b>  {watchedEmail}</p>

//                       {watchedPrograms.map((prog, idx) => {
//                         const pkgs = programPackages[idx] || [];
//                         const progName = programs.find((p) => p.id === prog?.program)?.name;
//                         const pkgName = pkgs.find((p) => p.id === prog?.package)?.name;
//                         const preview = programPreviewUrls[idx];

//                         return (
//                           <div key={idx}>
//                             <Divider
//                               orientation="left"
//                               plain
//                               style={{ fontSize: 13, color: "#888", margin: "10px 0" }}
//                             >
//                               {idx === 0 ? "Program 1" : `Additional Program ${idx + 1}`}
//                             </Divider>
//                             <p><b>Program:</b>  {progName || "-"}</p>
//                             <p><b>Service:</b>  {pkgName || "-"}</p>
//                             <p><b>Class:</b>    {prog?.study_class || "-"}</p>
//                             <p><b>Mode:</b>     {prog?.preferred_counselling_mode || "-"}</p>
//                             <p><b>Amount:</b>   ₹{prog?.amount || "0"}</p>
//                             {Number(prog?.amount) > 0 && (
//                               <>
//                                 <p><b>Payment Type:</b>   {prog?.payment_type || "-"}</p>
//                                 <p><b>Payment Method:</b> {prog?.method || "-"}</p>
//                                 {prog?.transaction_id && (
//                                   <p><b>Transaction ID:</b> {prog.transaction_id}</p>
//                                 )}
//                               </>
//                             )}
//                             <p><b>Payment Receipt -</b></p>
//                             {preview ? (
//                               <Image
//                                 src={preview}
//                                 style={{ width: "100%", maxHeight: 160, borderRadius: 6, objectFit: "contain", marginTop: 8 }}
//                                 preview={{ mask: <EyeOutlined /> }}
//                               />
//                             ) : (
//                               <Empty description="No receipt uploaded" imageStyle={{ height: 40 }} />
//                             )}
//                           </div>
//                         );
//                       })}
//                     </>
//                   )}
//                 </Card>
//               </Col>
//             )}

//           </Row>
//         </Form>
//       </div>
//     </Modal>
//   );
// };

// export default AddEnquiryModal;