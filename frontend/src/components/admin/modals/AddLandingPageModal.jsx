import React, { useEffect, useState,useRef } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Upload,
  Button,
  InputNumber,
  Row,
  Col,
  Empty,
  Typography,
  theme,
  message
} from "antd";
import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchActivePrograms } from "../../../adminSlices/programSlice";
import { fetchPackagesByProgram } from "../../../adminSlices/packageSlice";
import { createLandingPage, updateLandingPage, fetchLandingPages } from "../../../adminSlices/landingPageSlice";

const { TextArea } = Input;
const { Title } = Typography;

const AddLandingPageModal = ({
  visible,
  onClose,
  onSubmit,
  initialValues = null,
  viewMode = false,
}) => {
  const [form] = Form.useForm();
  const { token } = theme.useToken();
  const dispatch = useDispatch();
  const processRef = useRef(null);
const regRef = useRef(null);
const instRef = useRef(null);

  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [thumbnailFileList, setThumbnailFileList] = useState([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);

  const { activeList: activePrograms } = useSelector(
    (state) => state.programs
  );

  const { list: packageList, loading: packageLoading } = useSelector(
    (state) => state.packages
  );

  const { loading } = useSelector((state) => state.landingPage);
  /* ---------------- FETCH PROGRAMS ---------------- */
  useEffect(() => {
    dispatch(fetchActivePrograms());
  }, [dispatch]);

  /* ---------------- PROGRAM CHANGE ---------------- */
  const handleProgramChange = (programId) => {
    setSelectedProgram(programId);

    form.setFieldsValue({
      package_id: undefined,
      price: undefined,
      description: "",
      features: "",
    });

    dispatch(fetchPackagesByProgram(programId));
  };

  /* ---------------- PACKAGE CHANGE ---------------- */
  const handlePackageChange = (packageId) => {
    const selectedPackage = packageList.find((p) => p.id === packageId);

    if (!selectedPackage) return;

    form.setFieldsValue({
      price: selectedPackage.price,
      description: selectedPackage.description,
      features: selectedPackage.features
        ?.map((f) => f.description)
        .join("\n"),
    });
  };

  const normalizeArrayFromIndexedFields = (data, key) => {
  const arr = [];

  for (let i = 1; i <= 4; i++) {
    const val = data?.[`${key}${i}`];
    if (val && val.trim() !== "") {
      arr.push(val);
    }
  }

  return arr.length ? arr : [""];
};

  useEffect(() => {
  if (!initialValues) {
    setTimeout(() => {
      processRef.current?.add?.();
      regRef.current?.add?.();
      instRef.current?.add?.();
    }, 100);
  }
}, [visible]);
  /* ---------------- INITIAL VALUES ---------------- */
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        contact_numbers:
          initialValues.contact_numbers?.length > 0
            ? initialValues.contact_numbers
            : [""],
         
      });

      if (initialValues.thumbnail_url) {
        setThumbnailPreview(initialValues.thumbnail_url);
      }
    } else {
      form.resetFields();
      form.setFieldsValue({ contact_numbers: [""] });
    }
  }, [initialValues, form]);

  /* ---------------- RESET ON CLOSE ---------------- */
  useEffect(() => {
    if (!visible) {
      setThumbnailPreview(null);
      setThumbnailFileList([]);
    }
  }, [visible]);

  /* ---------------- THUMBNAIL ---------------- */
  const handleThumbnailSelect = (file) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => setThumbnailPreview(reader.result);

    setThumbnailFileList([file]);
    return false;
  };

  const handleThumbnailRemove = () => {
    setThumbnailPreview(null);
    setThumbnailFileList([]);
  };

useEffect(() => {
  if (initialValues) {
    form.setFieldsValue({
      program_id: initialValues.program,
      package_id: initialValues.package,

      price: initialValues.package_details?.price || "",

      features:
        initialValues.package_details?.features
          ?.map((f) => f.description)
          .join("\n") || "",

      description: initialValues.description,
      enterprise_name: initialValues.enterprise_name,

      process: normalizeArrayFromIndexedFields(initialValues, "process"),
      registration_details: normalizeArrayFromIndexedFields(initialValues, "registration_details"),
      instructions: normalizeArrayFromIndexedFields(initialValues, "instructions"),

      contact_numbers: initialValues.contact_details
        ? initialValues.contact_details.split(",").map(x => x.trim())
        : [""],
    });

    if (initialValues.flyer_image) {
      setThumbnailPreview(initialValues.flyer_image);
    }

    if (initialValues.program) {
      setSelectedProgram(initialValues.program);
      dispatch(fetchPackagesByProgram(initialValues.program));
    }
  } else {
    form.resetFields();
    form.setFieldsValue({
      contact_numbers: [""],
      process: [""],
      registration_details: [""],
      instructions: [""],
    });
  }
}, [initialValues, form, dispatch]);
  const buildIndexedPayload = (formData, key, arr = []) => {
  const clean = (arr || []).filter(Boolean);

  for (let i = 0; i < 4; i++) {
    formData.append(`${key}${i + 1}`, clean[i] || "");
  }
};
  /* ---------------- SUBMIT ---------------- */
const handleFinish = async (values) => {
  const formData = new FormData();

  formData.append("program", values.program_id);
  formData.append("package", values.package_id);
  formData.append("description", values.description || "");
  formData.append("enterprise_name", values.enterprise_name || "");

  // ✅ ARRAY → BACKEND FORMAT (IMPORTANT FIX)
  buildIndexedPayload(formData, "process", values.process);
  buildIndexedPayload(formData, "registration_details", values.registration_details);
  buildIndexedPayload(formData, "instructions", values.instructions);

  // contact numbers
  if (values.contact_numbers?.length) {
    const contacts = values.contact_numbers
      .filter(Boolean)
      .join(", ");

    formData.append("contact_details", contacts);
  }

  // image
  if (thumbnailFileList[0]) {
    formData.append("flyer_image", thumbnailFileList[0]);
  }

  try {
    if (initialValues) {
      await dispatch(updateLandingPage({
        id: initialValues.id,
        payload: formData,
      })).unwrap();

      message.success("Landing page updated successfully");
    } else {
      await dispatch(createLandingPage(formData)).unwrap();

      message.success("Landing page created successfully");
    }

    dispatch(fetchLandingPages());

    form.resetFields();
    setThumbnailFileList([]);
    setThumbnailPreview(null);
    onClose();

  } catch (err) {
    message.error(err?.message || "Operation failed");
  }
};

  return (
    <>
      <Modal
        title={
          viewMode
            ? "View Landing Page"
            : initialValues
              ? "Edit Landing Page"
              : "Create Landing Page"
        }
        open={visible}
        centered
        onCancel={onClose}
        onOk={viewMode ? null : () => form.submit()}
        okText={initialValues ? "Update" : "Submit"}
        width={700}
        bodyStyle={{
          height: "70vh",
          overflowY: "auto",
          paddingRight: 10,
        }}
        destroyOnClose
        confirmLoading={loading}
        okButtonProps={viewMode ? { style: { display: "none" } } : {}}
      >
        <Form layout="vertical" form={form} onFinish={handleFinish} disabled={viewMode}>

          {/* PROGRAM + PACKAGE */}
          <Row gutter={[12, 12]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="program_id"
                label="Select Program"
                rules={[{ required: true }]}
              >
                <Select
                  placeholder="Select program"
                  onChange={handleProgramChange}
                >
                  {activePrograms?.map((p) => (
                    <Select.Option key={p.id} value={p.id}>
                      {p.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="package_id"
                label="Select Counselling Service"
                rules={[{ required: true }]}
              >
                <Select
                  placeholder={
                    selectedProgram
                      ? "Select counselling service"
                      : "Select program first"
                  }
                  loading={packageLoading}
                  onChange={handlePackageChange}
                  disabled={viewMode || !selectedProgram}
                >
                  {selectedProgram && packageList?.length > 0 ? (
                    packageList.map((p) => (
                      <Select.Option key={p.id} value={p.id}>
                        {p.name}
                      </Select.Option>
                    ))
                  ) : (
                    <Select.Option disabled>
                      No packages available
                    </Select.Option>
                  )}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* DESCRIPTION */}
          <Form.Item name="description" label="Description" >
            <TextArea rows={3} disabled />
          </Form.Item>

          {/* PRICE */}
          <Form.Item name="price" label="Price" >
            <InputNumber style={{ width: "100%" }} disabled />
          </Form.Item>

          {/* IMAGE */}
          <Title level={5}>Flayer Image</Title>

          <div
            style={{
              border: `1px solid ${token.colorBorder}`,
              borderRadius: token.borderRadiusLG,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <Row gutter={[12, 12]}>
              <Col xs={24} md={16}>
                {thumbnailPreview ? (
                  <img
                    src={thumbnailPreview}
                    alt="Preview"
                    onClick={() => setIsPreviewOpen(true)}
                    style={{
                      width: "100%",
                      height: 200,
                      objectFit: "cover",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  />
                ) : (
                  <Empty description="No Thumbnail Selected" />
                )}
              </Col>

              <Col xs={24} md={8}>
                <Upload
                  accept="image/*"
                  beforeUpload={handleThumbnailSelect}
                  onRemove={handleThumbnailRemove}
                  fileList={thumbnailFileList}
                  maxCount={1}
                >
                  <Button icon={<UploadOutlined />} block type="primary">
                    Select Image
                  </Button>
                </Upload>
              </Col>
            </Row>
          </div>

          {/* PROCESS */}
<Form.List name="process">
  {(fields, { add, remove }) => {
    processRef.current = { add };

    return (
      <>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <label>Process</label>
          <span onClick={() => add()} style={{ cursor: "pointer", color: "#1677ff" }}>
            + Add
          </span>
        </div>

        {fields.map(({ key, name, ...restField }, index) => (
          <Row key={key} gutter={8} style={{ marginBottom: 8 }}>
            <Col span={20}>
              <Form.Item {...restField} name={name} noStyle>
                <Input placeholder={`Step ${index + 1}`} />
              </Form.Item>
            </Col>

            <Col span={4}>
              <Button danger onClick={() => remove(name)} block>
                <DeleteOutlined />
              </Button>
            </Col>
          </Row>
        ))}
      </>
    );
  }}
</Form.List>

          {/* FEATURES */}
          <Form.Item name="features" label="Features" >
            <TextArea rows={3} disabled />
          </Form.Item>

          {/* CONTACT NUMBERS */}
          <Form.List name="contact_numbers">
            {(fields, { add, remove }) => (
              <>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <label>Contact Number</label>
                  <span
                    onClick={() => add()}
                    style={{ cursor: "pointer", color: "#1677ff" }}
                  >
                    + Add
                  </span>
                </div>

                {fields.map(({ key, name, ...restField }, index) => {
                  const isFirst = index === 0;

                  return (
                    <Row key={key} gutter={8} style={{ marginBottom: 8 }}>
                      <Col span={isFirst ? 24 : 20}>
                        <Form.Item
                          {...restField}
                          name={name}
                          rules={[{ required: true }]}
                          noStyle
                        >
                          <Input placeholder={`Contact Number ${index + 1}`} maxLength={10} />
                        </Form.Item>
                      </Col>

                      {!isFirst && fields.length > 1 && (
                        <Col span={4}>
                          <Button
                            danger
                            icon={<DeleteOutlined />}  // ✅ ICON ADDED
                            onClick={() => remove(name)}
                            style={{ width: "100%" }}
                          >
                            {/* Remove */}
                          </Button>
                        </Col>
                      )}
                    </Row>
                  );
                })}
              </>
            )}
          </Form.List>

          <Form.Item name="enterprise_name" label="Enterprise Name">
            <Input />
          </Form.Item>

<Form.List name="registration_details">
  {(fields, { add, remove }) => {
    regRef.current = { add };

    return (
      <>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <label>Registration Details</label>
          <span onClick={() => add()} style={{ cursor: "pointer", color: "#1677ff" }}>
            + Add
          </span>
        </div>

        {fields.map(({ key, name, ...restField }, index) => (
          <Row key={key} gutter={8} style={{ marginBottom: 8 }}>
            <Col span={20}>
              <Form.Item {...restField} name={name} noStyle>
                <Input placeholder={`Detail ${index + 1}`} />
              </Form.Item>
            </Col>

            <Col span={4}>
              <Button danger onClick={() => remove(name)} block>
                <DeleteOutlined />
              </Button>
            </Col>
          </Row>
        ))}
      </>
    );
  }}
</Form.List>

<Form.List name="instructions">
  {(fields, { add, remove }) => {
    instRef.current = { add };

    return (
      <>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <label>Important Instructions</label>
          <span onClick={() => add()} style={{ cursor: "pointer", color: "#1677ff" }}>
            + Add
          </span>
        </div>

        {fields.map(({ key, name, ...restField }, index) => (
          <Row key={key} gutter={8} style={{ marginBottom: 8 }}>
            <Col span={20}>
              <Form.Item {...restField} name={name} noStyle>
                <Input.TextArea rows={2} placeholder={`Instruction ${index + 1}`} />
              </Form.Item>
            </Col>

            <Col span={4}>
              <Button danger onClick={() => remove(name)} block>
                <DeleteOutlined />
              </Button>
            </Col>
          </Row>
        ))}
      </>
    );
  }}
</Form.List>
        </Form>
      </Modal>

      {/* IMAGE PREVIEW */}
      <Modal
        open={isPreviewOpen}
        footer={null}
        onCancel={() => setIsPreviewOpen(false)}
        centered
      >
        <img
          src={thumbnailPreview}
          alt="Full Preview"
          style={{ width: "100%" }}
        />
      </Modal>
    </>
  );
};

export default AddLandingPageModal;