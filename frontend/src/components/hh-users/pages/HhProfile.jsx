import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Typography,
  Input,
  Button,
  Select,
  Row,
  Col,
  Avatar,
  Upload,
  message,
  Divider,
  theme,
  Space,
  Grid,
  Modal,
  Form,
} from "antd";
import {
  UserOutlined,
  UploadOutlined,
  ArrowLeftOutlined,
  LockOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { getProfile, updateProfile } from "../../../adminSlices/profileSlice";
import { resetPassword } from "../../../adminSlices/resetPasswordSlice";


const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;


const HhProfile = () => {
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const [passwordData, setPasswordData] = useState({
    new_password: "",
    confirm_password: "",
  });

  const { profile: storedProfile, loading } = useSelector(
    (state) => state.profile
  );

  const { loading: passwordLoading } = useSelector(
    (state) => state.resetPassword
  );

  useEffect(() => {
    dispatch(getProfile());
  }, [dispatch]);

  useEffect(() => {
    if (storedProfile) {
      const fullName = `${storedProfile.first_name || ""} ${storedProfile.last_name || ""}`.trim();

      setProfile({
        name: fullName,
        email: storedProfile.email || "",
        phone: storedProfile.phone || "",
        preferred_counselling_mode:
          storedProfile.preferred_counselling_mode || "",
        //     program_name: storedProfile.program || "",
        // package_name: storedProfile.package || "",
        program_name:
          storedProfile.program_packages?.[0]?.program_name || "",
        package_name:
          storedProfile.program_packages?.[0]?.package_name || "",
        city: storedProfile.city || "",
        full_address: storedProfile.full_address || "",
        photo: storedProfile.photo || null,
        resume: storedProfile.resume_file || null,
        receipt: storedProfile.proof_file || null,
      });

      localStorage.setItem("userName", fullName);
      if (storedProfile.photo) {
        setPreview((prev) => ({
          ...prev,
          photo: storedProfile.photo,
        }));
      }
    }
  }, [storedProfile]);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    counselling_mode: "",
    program_name: "",
    package_name: "",
    city: "",
    full_address: "",
    photo: null,
    resume: null,
    receipt: null,
  });

  const [preview, setPreview] = useState({
    photo: "",
  });

  const handleChange = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpload = (field, file) => {
    setProfile((prev) => ({
      ...prev,
      [field]: file,
    }));

    if (field === "photo") {
      setPreview({
        ...preview,
        photo: URL.createObjectURL(file),
      });
    }

    return false;
  };

  const handleSubmit = async () => {
    if (!profile.name || !profile.email || !profile.phone) {
      message.error("Please fill required fields");
      return;
    }

    try {
      const formData = new FormData();

      // split name → first & last
      const [first_name, ...rest] = profile.name.split(" ");
      const last_name = rest.join(" ");

      formData.append("first_name", first_name);
      formData.append("last_name", last_name);
      formData.append("phone", profile.phone);
      formData.append(
        "preferred_counselling_mode",
        profile.preferred_counselling_mode
      );
      formData.append("city", profile.city);
      formData.append("full_address", profile.full_address);

      if (profile.photo instanceof File) {
        formData.append("photo", profile.photo);
      }

      if (profile.resume instanceof File) {
        formData.append("resume_file", profile.resume);
      }

      if (profile.receipt instanceof File) {
        formData.append("proof_file", profile.receipt);
      }

      await dispatch(updateProfile(formData)).unwrap();

      message.success("Profile updated successfully");

      const savedName = profile.name.trim();
      if (savedName) {
        localStorage.setItem("userName", savedName);
      }

      dispatch(getProfile()); // refresh
    } catch (err) {
      message.error(err || "Update failed");
    }
  };

  const validatePassword = (_, value) => {
    if (!value) return Promise.reject("Password is required");

    if (value.length < 8)
      return Promise.reject("Minimum 8 characters required");

    if (!/[a-z]/.test(value))
      return Promise.reject("At least one lowercase letter required");

    if (!/[A-Z]/.test(value))
      return Promise.reject("At least one uppercase letter required");

    if (!/\d/.test(value))
      return Promise.reject("At least one number required");

    return Promise.resolve();
  };


  const handlePasswordChange = async () => {
    if (!passwordData.new_password || !passwordData.confirm_password) {
      message.error("Please fill all password fields");
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      message.error("Passwords do not match");
      return;
    }

    try {
      await dispatch(
        resetPassword({
          email: storedProfile?.email,
          new_password: passwordData.new_password,
          confirm_password: passwordData.confirm_password,
        })
      ).unwrap();

      message.success("Password changed successfully");

      setPasswordData({
        new_password: "",
        confirm_password: "",
      });

      setIsPasswordModalOpen(false);
    } catch (err) {
      message.error(err || "Password update failed");
    }
  };
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: screens.xs ? 12 : 24 }}>

      {/* BACK BUTTON */}
      <div
        onClick={() => navigate("/handholding/dashboard")}
        style={{
          marginBottom: 16,
          display: "inline-flex",
          cursor: "pointer",
          color: token.colorPrimary,
          fontWeight: 500,
          fontSize: 16,
        }}
      >
        <ArrowLeftOutlined style={{ marginRight: 8 }} />
        Back to Dashboard
      </div>


      <Card
        style={{ borderRadius: 16, overflow: "hidden" }}
        bodyStyle={{ padding: 0 }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            flexDirection: screens.xs ? "column" : "row",
            gap: 16,
            padding: screens.xs ? 16 : 20,
            background: `linear-gradient(135deg, ${token.colorPrimary}, #1677ff)`,
            textAlign: screens.xs ? "center" : "left",
          }}
        >
          {/* LEFT SIDE */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              flex: 1,
              justifyContent: screens.xs ? "center" : "flex-start",
            }}
          >
            <Avatar
              size={screens.xs ? 60 : 70}
              src={preview.photo}
              icon={<UserOutlined />}
              style={{ border: "3px solid #fff" }}
            />

            <div>
              <Title
                level={screens.xs ? 5 : 3}
                style={{
                  color: "#fff",
                  margin: 0,
                  fontSize: screens.xs ? 12 : undefined,
                }}
              >
                {profile.name || "Your Name"}
              </Title>

              <Text
                style={{
                  color: "#e6f4ff",
                  fontSize: screens.xs ? 10 : 12,
                }}
              >
                {profile.package_name || "Handholding Program"}
              </Text>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              icon={<LockOutlined />}
              onClick={() => setIsPasswordModalOpen(true)}
            >
              Change Password
            </Button>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ padding: screens.xs ? 16 : 24 }}>
          <Title level={4}>Basic Information</Title>

          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12}>
              <Text>Name</Text>
              <Input
                size="large"
                value={profile.name}
                onChange={(e) => handleChange("name", e.target.value)}
                disabled
              />
            </Col>

            <Col xs={24} sm={12}>
              <Text>Email</Text>
              <Input
                size="large"
                value={profile.email}
                onChange={(e) => handleChange("email", e.target.value)}
                disabled
              />
            </Col>

            <Col xs={24} sm={12}>
              <Text>Mobile Number</Text>
              <Input
                size="large"
                value={profile.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                disabled
              />
            </Col>

            <Col xs={24} sm={12}>
              <Text>Preferred Counselling Mode</Text>
              <Select
                size="large"
                style={{ width: "100%" }}
                value={profile.preferred_counselling_mode}
                onChange={(value) =>
                  handleChange("preferred_counselling_mode", value)
                }
                disabled
              >
                <Option value="online">Online</Option>
                <Option value="offline">Offline</Option>
              </Select>
            </Col>

            <Col xs={24} sm={12}>
              <Text>Program</Text>
              <Input
                size="large"
                value={profile.program_name}
                onChange={(e) => handleChange("program_name", e.target.value)}
                disabled
              />
            </Col>

            <Col xs={24} sm={12}>
              <Text>Counselling Service</Text>
              <Input
                size="large"
                value={profile.package_name}
                onChange={(e) => handleChange("package_name", e.target.value)}
                disabled
              />
            </Col>

            <Col xs={24} sm={12}>
              <Text>City</Text>
              <Input
                size="large"
                value={profile.city}
                onChange={(e) => handleChange("city", e.target.value)}
              />
            </Col>

            <Col xs={24}>
              <Text>Full Address</Text>
              <TextArea
                rows={3}
                value={profile.full_address}
                onChange={(e) => handleChange("full_address", e.target.value)}
              />
            </Col>
          </Row>

          {/* UPLOAD */}
          <Divider />

          <Title level={4}>Documents & Uploads</Title>

          <Row gutter={[16, 16]}>
            {[
              { label: "Photo", key: "photo", hideList: true },
              { label: "Resume", key: "resume" },
              { label: "Payment Receipt", key: "receipt" },
            ].map((item) => (
              <Col xs={24} sm={12} md={8} key={item.key}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

                  {/* ✅ LABEL */}
                  <Text strong>{item.label}</Text>

                  {/* UPLOAD + VIEW */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {/* UPLOAD */}
                    <Upload
                      beforeUpload={(file) => handleUpload(item.key, file)}
                      maxCount={1}
                      showUploadList={!item.hideList}
                    >
                      <Button icon={<UploadOutlined />}>
                        Upload
                      </Button>
                    </Upload>

                    {/* VIEW */}
                    {profile[item.key] &&
                      !(profile[item.key] instanceof File) && (
                        <span
                          onClick={() =>
                            window.open(profile[item.key], "_blank")
                          }
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            cursor: "pointer",
                            color: "#1677ff",
                            fontWeight: 500,
                            textDecoration: "underline",
                          }}
                        >
                          <EyeOutlined />
                          View
                        </span>
                      )}
                  </div>

                </div>
              </Col>
            ))}
          </Row>

          {/* BUTTON */}
          <Divider />

          <Button
            type="primary"
            size="large"
            block
            style={{
              height: screens.xs ? 45 : 50,
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 600,
            }}
            onClick={handleSubmit}
          >
            Update Profile
          </Button>
        </div>
      </Card>


      <Modal
        title="Change Password"
        open={isPasswordModalOpen}
        onCancel={() => !passwordLoading && setIsPasswordModalOpen(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handlePasswordChange}>

          <Form.Item
            label="New Password"
            name="new_password"
            rules={[{ validator: validatePassword }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter new password"
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  new_password: e.target.value,
                }))
              }
            />
          </Form.Item>

          <Form.Item
            label="Confirm Password"
            name="confirm_password"
            rules={[
              { required: true, message: "Confirm password is required" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("new_password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject("Passwords do not match");
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm password"
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  confirm_password: e.target.value,
                }))
              }
            />
          </Form.Item>

          <Button
            type="primary"
            block
            htmlType="submit"
            loading={passwordLoading}
          >
            Update Password
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default HhProfile;