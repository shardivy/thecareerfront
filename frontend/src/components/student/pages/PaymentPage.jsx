import React, { useState } from "react";
import {
  Row,
  Col,
  Typography,
  Upload,
  Button,
  Input,
  message,
  Segmented,
  Divider,
  Card,
  theme,
  Grid,
} from "antd";
import {
  UploadOutlined,
  QrcodeOutlined,
  BankOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const PaymentPage = () => {
  const { token } = theme.useToken();
  const screens = useBreakpoint();

  const [mode, setMode] = useState("UPI");
  const [fileList, setFileList] = useState([]);
  const [transactionId, setTransactionId] = useState("");

  const amount = 1500;

  const handleSubmit = () => {
    if (fileList.length === 0) {
      message.error("Please upload payment screenshot");
      return;
    }
    message.success("Payment proof submitted successfully!");
  };

  const isMobile = !screens.md;

  return (
    <div
      style={{
        padding: isMobile ? "20px 0px" : "40px 11px",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            marginBottom: isMobile ? 24 : 32,
            textAlign: "center",
          }}
        >
          <Title level={isMobile ? 3 : 2} style={{ marginBottom: 4 }}>
            Secure Payment
          </Title>
          <Text style={{ color: token.colorTextSecondary }}>
            Complete your booking securely
          </Text>
        </div>

        <Card
          style={{
            background: token.colorBgContainer,
            borderRadius: token.borderRadius,
            boxShadow: token.boxShadow,
            padding: isMobile ? 16 : 24,
          }}
        >
          <Row gutter={isMobile ? [0, 32] : [48, 48]}>
            {/* LEFT SIDE */}
            <Col xs={24} md={12}>
              <div style={{ marginBottom: 24 }}>
                <Text style={{ color: token.colorTextSecondary }}>
                  Total Amount
                </Text>
                <Title
                  level={isMobile ? 3 : 2}
                  style={{
                    margin: 0,
                    color: token.colorPrimary,
                  }}
                >
                  ₹ {amount}
                </Title>
              </div>

              <Segmented
                block
                size={isMobile ? "middle" : "large"}
                options={[
                  {
                    label: (
                      <>
                        <QrcodeOutlined /> UPI
                      </>
                    ),
                    value: "UPI",
                  },
                  {
                    label: (
                      <>
                        <BankOutlined /> Bank
                      </>
                    ),
                    value: "BANK",
                  },
                ]}
                value={mode}
                onChange={setMode}
                style={{ marginBottom: 24 }}
              />

              {mode === "UPI" && (
                <div
                  style={{
                    textAlign: "center",
                    padding: isMobile ? 16 : 20,
                    border: `1px solid ${token.colorBorder}`,
                    borderRadius: token.borderRadius,
                  }}
                >
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=UPI-LINK"
                    alt="QR"
                    style={{
                      width: isMobile ? 180 : 220,
                      height: isMobile ? 180 : 220,
                      maxWidth: "100%",
                    }}
                  />
                  <Text
                    style={{
                      display: "block",
                      marginTop: 12,
                      fontSize: isMobile ? 13 : 14,
                      color: token.colorTextSecondary,
                    }}
                  >
                    Scan with any UPI app
                  </Text>
                </div>
              )}

              {mode === "BANK" && (
                <div
                  style={{
                    padding: isMobile ? 16 : 20,
                    border: `1px solid ${token.colorBorder}`,
                    borderRadius: token.borderRadius,
                    background: token.colorBgElevated,
                    fontSize: isMobile ? 13 : 14,
                  }}
                >
                  <p><b>Account Name:</b> ABC Services</p>
                  <p><b>Account Number:</b> 123456789012</p>
                  <p><b>IFSC Code:</b> SBIN0001234</p>
                  <p><b>Bank:</b> State Bank of India</p>
                </div>
              )}
            </Col>

            {/* RIGHT SIDE */}
            <Col xs={24} md={12}>
              <Title level={5}>Payment Steps</Title>
              <Divider />

              {mode === "UPI" ? (
                <>
                  <Step text="Open any UPI app (GPay / PhonePe)" />
                  <Step text="Scan the QR code" />
                  <Step text={`Pay ₹ ${amount}`} />
                  <Step text="Take payment screenshot" />
                  <Step text="Upload below" />
                </>
              ) : (
                <>
                  <Step text="Login to net banking" />
                  <Step text={`Transfer ₹ ${amount}`} />
                  <Step text="Add your name in remarks" />
                  <Step text="Download receipt" />
                  <Step text="Upload below" />
                </>
              )}

              <Divider />

              <Upload
                beforeUpload={() => false}
                onChange={({ fileList }) => setFileList(fileList)}
                maxCount={1}
              >
                <Button
                  icon={<UploadOutlined />}
                  block
                  size={isMobile ? "middle" : "large"}
                >
                  Upload Screenshot
                </Button>
              </Upload>

              <Input
                placeholder="Transaction ID (Optional)"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                size={isMobile ? "middle" : "large"}
                style={{ marginTop: 16 }}
              />

              <Button
                type="primary"
                block
                size="large"
                onClick={handleSubmit}
                style={{
                  marginTop: 24,
                  height: isMobile ? 44 : 50,
                  fontWeight: 600,
                }}
              >
                Confirm Payment
              </Button>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
};

const Step = ({ text }) => {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        marginBottom: 12,
      }}
    >
      <CheckCircleFilled
        style={{
          color: token.colorSuccess,
          marginRight: 10,
          fontSize: 16,
        }}
      />
      <Text>{text}</Text>
    </div>
  );
};

export default PaymentPage;
