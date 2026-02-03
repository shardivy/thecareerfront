import React, { useEffect } from "react";
import { Modal, Form, Input, Button, Select } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchPackages } from "../../../adminSlices/packageSlice";

const { Option } = Select;

const AddPackageModal = ({
  visible,
  onClose,
  onSubmit,
  initialValues,
  programs = [],
  viewMode = false,
}) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const { list: packages, loading } = useSelector((state) => state.packages);

  useEffect(() => {
    if (visible && !packages.length) {
      dispatch(fetchPackages());
    }
  }, [visible, packages.length, dispatch]);

  // ✅ Prefill form correctly
useEffect(() => {
  if (initialValues) {
    form.setFieldsValue({
      name: initialValues.name || "",
      program_id: initialValues.program?.id || undefined, // fetch program id
      price: Number(initialValues.price) || "",
      features: Array.isArray(initialValues.features)
        ? initialValues.features.map(f => f.description) // map objects to strings
        : [],
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
      title={viewMode ? "View Package" : initialValues ? "Edit Package" : "Create Package"}
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
    >
      <Form layout="vertical" form={form} onFinish={handleFinish}>

        {/* PACKAGE NAME */}
        <Form.Item
          label="Package"
          name="name"
          rules={[{ required: true, message: "Please select package" }]}
        >
          <Select
            placeholder="Select package"
            loading={loading}
            allowClear
            disabled={viewMode}
          >
            {packages.map((pkg) => (
              <Option key={pkg.name} value={pkg.name}>
                {pkg.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* PROGRAM */}
        <Form.Item
          label="Program"
          name="program_id"
          rules={[{ required: true, message: "Please select a program" }]}
        >
          <Select placeholder="Select program" disabled={viewMode}>
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
          <Input type="number" placeholder="e.g. 999" disabled={viewMode} />
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

        {/* ACTION BUTTONS */}
        {!viewMode && (
          <Form.Item>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button onClick={onClose}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
            </div>
          </Form.Item>
        )}

      </Form>
    </Modal>
  );
};

export default AddPackageModal;
