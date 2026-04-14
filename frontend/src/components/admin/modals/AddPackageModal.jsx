import React, { useEffect } from "react";
import { Modal, Form, Input, Button, Select, Switch } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchPackages } from "../../../adminSlices/packageSlice";
import { fetchActivePrograms } from "../../../adminSlices/programSlice";

const { Option } = Select;

const AddPackageModal = ({
  visible,
  onClose,
  onSubmit,
  initialValues,
  viewMode = false,
}) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const programs = useSelector((state) => state.programs.activeList);
  const programsLoading = useSelector((state) => state.programs.loading);
const aptitudeTest = Form.useWatch("aptitude_test", form);
const engineeringService = Form.useWatch("engineering_test_analysis", form);
const handholdingProgram = Form.useWatch("is_handholding", form);

  const { list: packages, loading } = useSelector((state) => state.packages);

  // Fetch packages when modal opens
  useEffect(() => {
    if (visible && !packages.length) {
      dispatch(fetchPackages());
    }
  }, [visible, packages.length, dispatch]);

  useEffect(() => {
    if (visible) {
      dispatch(fetchActivePrograms());
    }
  }, [visible, dispatch]);

  // Prefill form (Edit / View)
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        name: initialValues.name || "",
        description: initialValues.description || "",
        link_url: initialValues.link_url || "",
        program_id: initialValues.program?.id || undefined,
        price: Number(initialValues.price) || "",
        features: Array.isArray(initialValues.features)
          ? initialValues.features.map((f) => f.description)
          : [],
        aptitude_test:
          initialValues.aptitude_test ?? false,
    engineering_test_analysis:
  initialValues.engineering_test_analysis ?? false,
  is_handholding: initialValues.is_handholding ?? false,
      });
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  const handleFinish = (values) => {
    onSubmit(values);
    form.resetFields();
  };

  return (
    <Modal
      title={
        viewMode
          ? "View Counselling Service"
          : initialValues
            ? "Edit Counselling Service"
            : "Create Counselling Service"
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      destroyOnClose
      width={600}
    >


      <div style={{ maxHeight: "85vh", overflowY: "auto", paddingRight: 8 }}>
        <Form layout="vertical" form={form} onFinish={handleFinish}>

          {/* PACKAGE NAME */}
          <Form.Item
            label="Counselling Service"
            name="name"
            rules={[{ required: true, message: "Please enter counselling service name" }]}
          >
            <Input
              placeholder="Enter counselling service name"
              disabled={viewMode}
            />
          </Form.Item>

          {/* DESCRIPTION */}
          <Form.Item
            label="Description"
            name="description"
            rules={[
              { required: true, message: "Please enter description" },
              { max: 200, message: "Maximum 200 characters allowed" },
            ]}
          >
            <Input.TextArea
              placeholder="Enter counselling service description"
              rows={3}
              disabled={viewMode}
            />
          </Form.Item>


          {/* LINK URL */}

          <Form.Item
            label="Service Link URL"
            name="link_url"
            rules={[
              { type: "url", message: "Please enter a valid URL (https://example.com)" }
            ]}
          >
            <Input
              placeholder="https://example.com"
              disabled={viewMode}
            />
          </Form.Item>

          {/* PROGRAM */}
          <Form.Item
            label="Program"
            name="program_id"
            rules={[{ required: true, message: "Please select a program" }]}
          >
            <Select
              placeholder={programsLoading ? "Loading programs..." : "Select program"}
              disabled={viewMode}
              loading={programsLoading}
            >
              {programs.map((prog) => (
                <Option key={prog.id} value={prog.id}>
                  {prog.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* PRICE */}
          <Form.Item
            label="Price"
            name="price"
            rules={[{ required: true, message: "Please enter price" }]}
          >
            <Input
              type="number"
              placeholder="e.g. 999"
              disabled={viewMode}
            />
          </Form.Item>

          {/* FEATURES */}
          <Form.Item
            label="Features"
            name="features"
            rules={[{ required: true, message: "Add at least one feature" }]}
          >
            <Select
              mode="tags"
              placeholder="Type feature & press Enter"
              tokenSeparators={[","]}
              disabled={viewMode}
            />
          </Form.Item>

<div style={{ display: "flex", gap: 16 }}>

  {/* APTITUDE TEST */}
  <Form.Item
    label="Aptitude Test Availability"
    name="aptitude_test"
    valuePropName="checked"
    style={{ flex: 1 }}
  >
    <Switch
      checkedChildren="Available"
      unCheckedChildren="Unavailable"
      disabled={viewMode || engineeringService || handholdingProgram} // ✅ FIX
      onChange={(checked) => {
        if (checked) {
          form.setFieldsValue({
            engineering_test_analysis: false,
            handholding_program: false, // ✅ FIX
          });
        }
      }}
    />
  </Form.Item>

  {/* ENGINEERING SERVICE */}
  <Form.Item
    label="Engineering Service"
    name="engineering_test_analysis"
    valuePropName="checked"
    style={{ flex: 1 }}
  >
    <Switch
      checkedChildren="Yes"
      unCheckedChildren="No"
      disabled={viewMode || aptitudeTest || handholdingProgram} // ✅ FIX
      onChange={(checked) => {
        if (checked) {
          form.setFieldsValue({
            aptitude_test: false,
            handholding_program: false, // ✅ FIX
          });
        }
      }}
    />
  </Form.Item>

  {/* HANDHOLDING PROGRAM */}
  <Form.Item
    label="Handholding Program"
    name="is_handholding"
    valuePropName="checked"
    style={{ flex: 1 }}
  >
    <Switch
      checkedChildren="Yes"
      unCheckedChildren="No"
      disabled={viewMode || aptitudeTest || engineeringService}
      onChange={(checked) => {
        if (checked) {
          form.setFieldsValue({
            aptitude_test: false,
            engineering_test_analysis: false,
          });
        }
      }}
    />
  </Form.Item>

</div>

          {/* ACTION BUTTONS */}
          {!viewMode && (
            <Form.Item>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                }}
              >
                <Button onClick={onClose}>Cancel</Button>
                <Button type="primary" htmlType="submit">
                  {initialValues ? "Update" : "Submit"} {/* <-- Change text here */}
                </Button>
              </div>
            </Form.Item>
          )}



        </Form>
      </div>
    </Modal>
  );
};

export default AddPackageModal;