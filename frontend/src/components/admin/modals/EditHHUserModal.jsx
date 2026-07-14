import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Row,
  Col,
  Upload,
  Select,
  Switch,
  Divider,
  Card,
  Empty,
  Image,
message,
} from "antd";
import { UploadOutlined, EyeOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { updateHandholdingParticipant } from "../../../hhSlices/handholdingUsersSlice";
import { fetchPackagesByProgram } from "../../../adminSlices/packageSlice";

const { Option } = Select;

const EditHHUserModal = ({ open, onCancel, userData, onSubmit }) => {
  const [form] = Form.useForm();
  const liveValues = Form.useWatch([], form);
  const dispatch = useDispatch();

  const [photo, setPhoto] = useState([]);
  const [resume, setResume] = useState([]);
  const [payment, setPayment] = useState([]);

  const [photoPreview, setPhotoPreview] = useState(null);
  const [resumePreview, setResumePreview] = useState(null);
  const [paymentPreview, setPaymentPreview] = useState(null);
    const { list: packages, loading: packagesLoading } = useSelector(
  (state) => state.packages
);

useEffect(() => {
  if (!open) return;

  const programId = userData?.program_id;

  if (programId) {
    // console.log("Fetching packages for program:", programId);
    dispatch(fetchPackagesByProgram(programId));
  }
}, [open, userData?.program_id, dispatch]);

  /* ================= FILE HANDLER ================= */
  const handleFile = (type) => (e) => {
    const fileList = e.fileList;

    if (type === "photo") {
      setPhoto(fileList);
      if (fileList[0]?.originFileObj) {
        setPhotoPreview(URL.createObjectURL(fileList[0].originFileObj));
      }
    }

    if (type === "resume") {
      setResume(fileList);
      if (fileList[0]?.originFileObj) {
        setResumePreview(URL.createObjectURL(fileList[0].originFileObj));
      }
    }

    if (type === "payment") {
      setPayment(fileList);
      if (fileList[0]?.originFileObj) {
        setPaymentPreview(URL.createObjectURL(fileList[0].originFileObj));
      }
    }
  };

 useEffect(() => {
  if (!open || !userData) return;

  form.resetFields(); // 🔥 IMPORTANT FIX
  // console.log("userData inside modal:", userData);

  form.setFieldsValue({
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    mobile: userData.mobile,
    program_name: userData.program_name,
    source: userData.source,
    date: userData.date,
    city: userData.city,
    preferred_counselling_mode: userData.preferred_counselling_mode,
      address: userData.address,
  showProfile: Boolean(userData.showProfile),
    package_id: userData.package_id,
  
  });

  if (userData.photo) setPhotoPreview(userData.photo);
  if (userData.resume) setResumePreview(userData.resume);
  if (userData.payment_proof) setPaymentPreview(userData.payment_proof);

}, [open, userData]);

useEffect(() => {
  if (packages.length && userData?.package_id) {
    form.setFieldsValue({
      package_id: userData.package_id,
    });
  }
}, [packages, userData, form]);

  /* ================= SUBMIT ================= */
const handleSubmit = async (values) => {
  const formData = new FormData();

Object.entries(values).forEach(([key, value]) => {
  if (key === "showProfile") {
    formData.append("show_profile", value ? "True" : "False");
  } 
  else if (key === "address") {
    // ✅ IMPORTANT FIX
    formData.append("full_address", value ?? "");
  } 
  else {
    formData.append(key, value ?? "");
  }
});

  if (photo[0]?.originFileObj) {
    formData.append("photo", photo[0].originFileObj);
  }

  if (resume[0]?.originFileObj) {
    formData.append("resume", resume[0].originFileObj);
  }

  if (payment[0]?.originFileObj) {
    formData.append("payment_proof", payment[0].originFileObj);
  }

  // ✅ ADD ID HERE
  formData.append("id", userData?.id);

  // ✅ CALL PARENT HANDLER
  onSubmit(formData);
};

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width="100%"
      style={{ maxWidth: 1100 }}
      centered
      destroyOnClose
      title="Edit HH User"
    >
      <div style={{ maxHeight: "75vh", overflowY: "auto", paddingRight: 8 }}>
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Row gutter={[16, 16]}>

            {/* ================= LEFT FORM ================= */}
            <Col xs={24} lg={14}>
              <Row gutter={[16, 16]}>

                <Col xs={24} sm={12}>
                  <Form.Item name="firstName" label="First Name">
                    <Input />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item name="lastName" label="Last Name">
                    <Input />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item name="email" label="Email" >
                    <Input disabled />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item name="mobile" label="Mobile">
                    <Input />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item name="program_name" label="Program" >
                    <Input disabled />
                  </Form.Item>
                </Col>

                {/* <Col xs={24} sm={12}>
                  <Form.Item name="source" label="Source">
                    <Input />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item name="date" label="Enquiry Date">
                    <Input />
                  </Form.Item>
                </Col> */}

              
                <Col xs={24} sm={12}>
                 <Form.Item
                   name="package_id"
                   label="Counselling Service"
                   rules={[{ required: true, message: "Please select service" }]}
                 >
                   <Select
                     placeholder={packagesLoading ? "Loading services..." : "Select service"}
                     loading={packagesLoading}
                   >
                     {packages.map((pkg) => (
                       <Option key={pkg.id} value={pkg.id}>
                         {pkg.name}
                       </Option>
                     ))}
                   </Select>
                 </Form.Item>
               </Col>

                 <Col xs={24} sm={12}>
                  <Form.Item name="city" label="City">
                    <Input />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="preferred_counselling_mode"
                    label="Preferred Counselling Mode"
                  >
                    <Select>
                      <Option value="online">Online</Option>
                      <Option value="offline">Offline</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item name="address" label="Address">
                    <Input.TextArea rows={3} />
                  </Form.Item>
                </Col>

                <Divider />

                {/* UPLOADS */}
                <Col xs={24} sm={12}>
                  <Upload beforeUpload={() => false} maxCount={1} onChange={handleFile("photo")}>
                    <Button icon={<UploadOutlined />}>Upload Photo</Button>
                  </Upload>
                </Col>

                <Col xs={24} sm={12}>
                  <Upload beforeUpload={() => false} maxCount={1} onChange={handleFile("resume")}>
                    <Button icon={<UploadOutlined />}>Upload Resume</Button>
                  </Upload>
                </Col>

                <Col xs={24} sm={12}>
                  <Upload beforeUpload={() => false} maxCount={1} onChange={handleFile("payment")}>
                    <Button icon={<UploadOutlined />}>Upload Payment</Button>
                  </Upload>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="showProfile"
                    label="Show Profile"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                  </Form.Item>
                </Col>
              </Row>

              {/* BUTTONS */}
              <div style={{ textAlign: "right" }}>
                <Button onClick={onCancel} style={{ marginRight: 10 }}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit">
                  Update User
                </Button>
              </div>
            </Col>

            {/* ================= RIGHT PREVIEW ================= */}
            <Col xs={24} lg={10}>
              <Card title="Live Preview">

                <p><b>Name:</b> {liveValues?.firstName} {liveValues?.lastName}</p>
                <p><b>Email:</b> {liveValues?.email}</p>
                <p><b>Mobile:</b> {liveValues?.mobile}</p>
                <p><b>City:</b> {liveValues?.city}</p>

                <Divider />

                <h4>Photo</h4>
                {photoPreview ? <Image src={photoPreview} /> : <Empty />}

                <Divider />

                <h4>Resume</h4>
                {resumePreview ? (
                  <a href={resumePreview} target="_blank">View Resume</a>
                ) : <Empty />}

                <Divider />

                <h4>Payment</h4>
                {paymentPreview ? <Image src={paymentPreview} /> : <Empty />}
              </Card>
            </Col>

          </Row>
        </Form>
      </div>
    </Modal>
  );
};

export default EditHHUserModal;