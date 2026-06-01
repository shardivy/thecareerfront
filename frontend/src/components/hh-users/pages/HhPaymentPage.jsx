import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Typography,
  Button,
  Segmented,
  Divider,
  Card,
  theme,
  Grid,
  Alert,
  Space,
  Spin,
} from "antd";
import {
  QrcodeOutlined,
  BankOutlined,
  WhatsAppOutlined,
  PhoneOutlined,
  CheckCircleFilled
} from "@ant-design/icons";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { fetchHandholdingPaymentDetails } from "../../../hhSlices/handholdingPaymentSlice";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const HhPaymentPage = () => {
  const { token } = theme.useToken();
  const screens = useBreakpoint();

  const dispatch = useDispatch();
  const location = useLocation();

  const { packageId, programId } = location.state || {};

  // ================= REDUX =================
  const { details, loading: paymentLoading } = useSelector(
    (state) => state.handholdingPayment
  );

  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;

  const adminWhatsApp = "9922695424";
  const adminPhone = "9922695424";

  const [mode, setMode] = useState("UPI");

  // ================= FETCH PAYMENT API =================
  useEffect(() => {
    const participantId = localStorage.getItem("participant_id");

    if (participantId) {
      dispatch(fetchHandholdingPaymentDetails(participantId));
    }
  }, [dispatch]);

  // ================= AMOUNT FROM API =================
  const amount =
    details?.data?.[0]?.remaining_amount ||
    details?.data?.remaining_amount ||
    details?.remaining_amount ||
    0;

  return (
    <div
      style={{
        padding: isMobile ? "0px" : isTablet ? "15px 20px" : "20px 20px",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 1200, marginTop: "10" }}>
        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: isMobile ? 24 : 40 }}>
          <Title level={isMobile ? 4 : 2} style={{ marginBottom: 6 }}>
            Secure Payment
          </Title>
          <Text type="colorTextSecondary">
            Complete your booking securely
          </Text>
        </div>

        <Card
          style={{
            borderRadius: 20,
            boxShadow: token.boxShadowSecondary,
            padding: isMobile ? 1 : 40,
          }}
        >
          <Row gutter={[isMobile ? 0 : 60, isMobile ? 32 : 0]} align="top">
            {/* LEFT */}
            <Col xs={24} md={12}>
            
              {/* AMOUNT */}
              <div style={{ marginBottom: 28 }}>
                <Text type="colorTextSecondary">Total Amount</Text>

                <Title
                  level={isMobile ? 3 : 2}
                  style={{ margin: 0, color: token.colorPrimary }}
                >
                  {paymentLoading ? (
                    <Spin size="small" />
                  ) : (
                    `₹ ${amount}`
                  )}
                </Title>
              </div>

            

              {/* MODE */}
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
                        <BankOutlined /> Bank Transfer
                      </>
                    ),
                    value: "BANK",
                  },
                ]}
                value={mode}
                onChange={setMode}
                style={{ marginBottom: 28 }}
              />

              {/* UPI */}
              {mode === "UPI" && (
                <div
                  style={{
                    textAlign: "center",
                    padding: isMobile ? 16 : 24,
                    border: `1px solid ${token.colorBorder}`,
                    borderRadius: 16,
                  }}
                >
                  <img
                    src="/scanner.jpeg"
                    alt="QR"
                    style={{
                      width: isMobile ? 180 : 260,
                      height: isMobile ? 180 : 260,
                    }}
                  />

                  <Text
                    type="colorTextSecondary"
                    style={{ display: "block", marginTop: 12 }}
                  >
                    Scan QR to pay ₹ {amount}
                  </Text>
                </div>
              )}

              {/* BANK */}
              {mode === "BANK" && (
                <div
                  style={{
                    padding: isMobile ? 16 : 24,
                    border: `1px solid ${token.colorBorder}`,
                    borderRadius: 16,
                  }}
                >
                  <p><b>Account Name:</b> Abhinav Career Scope</p>
                  <p><b>Account Number:</b> 20194273045</p>
                  <p><b>Bank:</b> State Bank of India</p>
                  <p><b>IFSC:</b> SBIN0013280</p>
                  <p><b>Mobile:</b> 9922695424</p>
                </div>
              )}
            </Col>

            {/* RIGHT */}
            <Col xs={24} md={12}>
              <Title level={5}>Payment Steps</Title>
              <Divider />

              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                {mode === "UPI" ? (
                  <>
                    <Step text="Open any UPI app" />
                    <Step text="Scan QR code" />
                    <Step text={`Pay ₹ ${amount}`} />
                    <Step text="Save screenshot" />
                  </>
                ) : (
                  <>
                    <Step text="Login to net banking" />
                    <Step text={`Transfer ₹ ${amount}`} />
                    <Step text="Add remark with name" />
                    <Step text="Download receipt" />
                  </>
                )}
              </Space>

              <Divider />

              <Alert
                message="After making payment"
                description={
                  <>
                    Please send payment screenshot to Admin's WhatsApp{" "}
                    <a href="tel:9922695424">9922695424</a> or contact Admin for confirmation.
                  </>
                }
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
              />

              <Space direction="vertical" style={{ width: "100%" }}>
                <Button
                  type="primary"
                  block
                  icon={<WhatsAppOutlined />}
                  href={`https://wa.me/${adminWhatsApp}`}
                  target="_blank"
                >
                  Send on WhatsApp
                </Button>

                <Button
                  block
                  icon={<PhoneOutlined />}
                  href={`tel:${adminPhone}`}
                >
                  Contact Admin
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
};

const Step = ({ text }) => (
  <div style={{ display: "flex", alignItems: "center" }}>
    <CheckCircleFilled style={{ color: "#52c41a", marginRight: 10 }} />
    <Text>{text}</Text>
  </div>
);

export default HhPaymentPage;