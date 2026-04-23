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
  CheckCircleFilled,
} from "@ant-design/icons";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchStudentPaymentHistory } from "../../../adminSlices/paymentSlice";
import { fetchProgramPackageDetails } from "../../../adminSlices/packageSlice";


const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const PaymentPage = () => {
  const { token } = theme.useToken();
  const screens = useBreakpoint();

  const dispatch = useDispatch();
  const location = useLocation();
  const { packageId, programId, isFreeUser } = location.state || {};

  const { selectedPackage } = useSelector((state) => state.packages);

  const { historyList, historyLoading } = useSelector(
    (state) => state.payment
  );

  const studentId = localStorage.getItem("studentId");

  const [mode, setMode] = useState("UPI");

  const amount = isFreeUser
    ? selectedPackage?.price || 0
    : historyList?.length > 0
      ? historyList[0]?.remaining_amount ||
      historyList[0]?.amount ||
      0
      : 0;

  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;

  const adminWhatsApp = "9922695424";
  const adminPhone = "9922695424";


  /* ================= FETCH AMOUNT FROM API ================= */
  useEffect(() => {
    if (isFreeUser && programId && packageId) {
      dispatch(
        fetchProgramPackageDetails({
          programId,
          packageId,
        })
      );
    }
  }, [dispatch, programId, packageId, isFreeUser]);


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
          <Row
            gutter={[
              isMobile ? 0 : 60,
              isMobile ? 32 : 0
            ]}
            align="top"
          >
            {/* LEFT COLUMN */}
            <Col xs={24} md={12}>

              {/* TOTAL AMOUNT */}
              <div style={{ marginBottom: 28 }}>
                <Text type="colorTextSecondary">Total Amount</Text>
                <Title
                  level={isMobile ? 3 : 2}
                  style={{
                    margin: 0,
                    color: token.colorPrimary,
                  }}
                >
                  {historyLoading ? (
                    <Spin size="small" />
                  ) : (
                    `₹ ${amount}`
                  )}
                </Title>
              </div>

              {/* PAYMENT MODE */}
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

              {/* PAYMENT DISPLAY */}
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
                      width: isMobile ? 180 : isTablet ? 220 : 260,
                      height: isMobile ? 180 : isTablet ? 220 : 260,
                      maxWidth: "100%",
                    }}
                  />
                  <Text
                    type="colorTextSecondary"
                    style={{ display: "block", marginTop: 12 }}
                  >
                    Scan with any UPI app to pay ₹ {amount}
                  </Text>
                </div>
              )}

              {mode === "BANK" && (
                <div
                  style={{
                    padding: isMobile ? 16 : 24,
                    border: `1px solid ${token.colorBorder}`,
                    borderRadius: 16,
                    background: token.colorBgElevated,
                    fontSize: isMobile ? 13 : 15,
                    lineHeight: 1.8,
                  }}
                >
                  <p><b>Account Name:</b> Reena Bhutada</p>
                  <p><b>Account Number:</b> 20194273045</p>
                  <p><b>Bank:</b> State Bank of India</p>
                  <p><b>Branch:</b> Bavdhan, Pune - 411021</p>
                  <p><b>IFSC Code:</b> SBIN0013280</p>
                  <p><b>Mobile:</b> 9922695424</p>
                </div>
              )}
            </Col>

            {/* RIGHT COLUMN */}
            <Col xs={24} md={12}>
              <div
                style={{
                  position: screens.lg ? "sticky" : "static",
                  top: screens.lg ? 100 : "auto",
                }}
              >
                <Title level={5}>Payment Steps</Title>
                <Divider />

                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  {mode === "UPI" ? (
                    <>
                      <Step text="Open any UPI app" />
                      <Step text="Scan the QR code" />
                      <Step text={`Pay ₹ ${amount}`} />
                      <Step text="Take screenshot after payment" />
                    </>
                  ) : (
                    <>
                      <Step text="Login to net banking" />
                      <Step text={`Transfer ₹ ${amount}`} />
                      <Step text="Add your name in remarks" />
                      <Step text="Download payment receipt" />
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

                <Space
                  direction="vertical"
                  size="middle"
                  style={{ width: "100%" }}
                >
                  <Button
                    type="primary"
                    block
                    size={isMobile ? "middle" : "large"}
                    href={`https://wa.me/${adminWhatsApp}`}
                    target="_blank"
                    style={{
                      marginBottom: 12,
                      height: isMobile ? "auto" : undefined,
                      padding: isMobile ? "10px 0" : undefined,
                    }}
                  >
                    {isMobile ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          lineHeight: 1.2,
                        }}
                      >
                        <WhatsAppOutlined style={{ fontSize: 18, marginRight: 6 }} />
                        <span>
                          Send Screenshot on <br />
                          WhatsApp
                        </span>
                      </div>
                    ) : (
                      <>
                        <WhatsAppOutlined style={{ marginRight: 6 }} />
                        Send Screenshot on WhatsApp
                      </>
                    )}
                  </Button>

                  <Button
                    icon={<PhoneOutlined />}
                    block
                    size={isMobile ? "middle" : "large"}
                    href={`tel:${adminPhone}`}
                  >
                    Contact Admin
                  </Button>
                </Space>
              </div>
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
    <div style={{ display: "flex", alignItems: "center" }}>
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

