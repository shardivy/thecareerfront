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

  const adminWhatsApp = "919876543210";
  const adminPhone = "9876543210";


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
                    src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=UPI-LINK"
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
                  }}
                >
                  <p><b>Account Name:</b> ABC Services</p>
                  <p><b>Account Number:</b> 123456789012</p>
                  <p><b>IFSC Code:</b> SBIN0001234</p>
                  <p><b>Bank:</b> State Bank of India</p>
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
                  description="Please send payment screenshot to Admin's WhatsApp OR contact Admin for confirmation."
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



//old one

// import React, { useState } from "react";
// import {
//   Row,
//   Col,
//   Typography,
//   Upload,
//   Button,
//   Input,
//   message,
//   Segmented,
//   Divider,
//   Card,
//   theme,
//   Grid,
// } from "antd";
// import {
//   UploadOutlined,
//   QrcodeOutlined,
//   BankOutlined,
//   CheckCircleFilled,
// } from "@ant-design/icons";

// const { Title, Text } = Typography;
// const { useBreakpoint } = Grid;

// const PaymentPage = () => {
//   const { token } = theme.useToken();
//   const screens = useBreakpoint();

//   const [mode, setMode] = useState("UPI");
//   const [fileList, setFileList] = useState([]);
//   const [transactionId, setTransactionId] = useState("");

//   const amount = 1500;

//   const handleSubmit = () => {
//     if (fileList.length === 0) {
//       message.error("Please upload payment screenshot");
//       return;
//     }
//     message.success("Payment proof submitted successfully!");
//   };

//   const isMobile = !screens.md;

//   return (
//     <div
//       style={{
//         padding: isMobile ? "20px 0px" : "40px 11px",
//       }}
//     >
//       <div
//         style={{
//           maxWidth: 1100,
//           margin: "0 auto",
//         }}
//       >
//         {/* Header */}
//         <div
//           style={{
//             marginBottom: isMobile ? 24 : 32,
//             textAlign: "center",
//           }}
//         >
//           <Title level={isMobile ? 3 : 2} style={{ marginBottom: 4 }}>
//             Secure Payment
//           </Title>
//           <Text style={{ color: token.colorTextSecondary }}>
//             Complete your booking securely
//           </Text>
//         </div>

//         <Card
//           style={{
//             background: token.colorBgContainer,
//             borderRadius: token.borderRadius,
//             boxShadow: token.boxShadow,
//             padding: isMobile ? 16 : 24,
//           }}
//         >
//           <Row gutter={isMobile ? [0, 32] : [48, 48]}>
//             {/* LEFT SIDE */}
//             <Col xs={24} md={12}>
//               <div style={{ marginBottom: 24 }}>
//                 <Text style={{ color: token.colorTextSecondary }}>
//                   Total Amount
//                 </Text>
//                 <Title
//                   level={isMobile ? 3 : 2}
//                   style={{
//                     margin: 0,
//                     color: token.colorPrimary,
//                   }}
//                 >
//                   ₹ {amount}
//                 </Title>
//               </div>

//               <Segmented
//                 block
//                 size={isMobile ? "middle" : "large"}
//                 options={[
//                   {
//                     label: (
//                       <>
//                         <QrcodeOutlined /> UPI
//                       </>
//                     ),
//                     value: "UPI",
//                   },
//                   {
//                     label: (
//                       <>
//                         <BankOutlined /> Bank
//                       </>
//                     ),
//                     value: "BANK",
//                   },
//                 ]}
//                 value={mode}
//                 onChange={setMode}
//                 style={{ marginBottom: 24 }}
//               />

//               {mode === "UPI" && (
//                 <div
//                   style={{
//                     textAlign: "center",
//                     padding: isMobile ? 16 : 20,
//                     border: `1px solid ${token.colorBorder}`,
//                     borderRadius: token.borderRadius,
//                   }}
//                 >
//                   <img
//                     src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=UPI-LINK"
//                     alt="QR"
//                     style={{
//                       width: isMobile ? 180 : 220,
//                       height: isMobile ? 180 : 220,
//                       maxWidth: "100%",
//                     }}
//                   />
//                   <Text
//                     style={{
//                       display: "block",
//                       marginTop: 12,
//                       fontSize: isMobile ? 13 : 14,
//                       color: token.colorTextSecondary,
//                     }}
//                   >
//                     Scan with any UPI app
//                   </Text>
//                 </div>
//               )}

//               {mode === "BANK" && (
//                 <div
//                   style={{
//                     padding: isMobile ? 16 : 20,
//                     border: `1px solid ${token.colorBorder}`,
//                     borderRadius: token.borderRadius,
//                     background: token.colorBgElevated,
//                     fontSize: isMobile ? 13 : 14,
//                   }}
//                 >
//                   <p><b>Account Name:</b> ABC Services</p>
//                   <p><b>Account Number:</b> 123456789012</p>
//                   <p><b>IFSC Code:</b> SBIN0001234</p>
//                   <p><b>Bank:</b> State Bank of India</p>
//                 </div>
//               )}
//             </Col>

//             {/* RIGHT SIDE */}
//             <Col xs={24} md={12}>
//               <Title level={5}>Payment Steps</Title>
//               <Divider />

//               {mode === "UPI" ? (
//                 <>
//                   <Step text="Open any UPI app (GPay / PhonePe)" />
//                   <Step text="Scan the QR code" />
//                   <Step text={`Pay ₹ ${amount}`} />
//                   <Step text="Take payment screenshot" />
//                   <Step text="Upload below" />
//                 </>
//               ) : (
//                 <>
//                   <Step text="Login to net banking" />
//                   <Step text={`Transfer ₹ ${amount}`} />
//                   <Step text="Add your name in remarks" />
//                   <Step text="Download receipt" />
//                   <Step text="Upload below" />
//                 </>
//               )}

//               <Divider />

//               <Upload
//                 beforeUpload={() => false}
//                 onChange={({ fileList }) => setFileList(fileList)}
//                 maxCount={1}
//               >
//                 <Button
//                   icon={<UploadOutlined />}
//                   block
//                   size={isMobile ? "middle" : "large"}
//                 >
//                   Upload Screenshot
//                 </Button>
//               </Upload>

//               <Input
//                 placeholder="Transaction ID (Optional)"
//                 value={transactionId}
//                 onChange={(e) => setTransactionId(e.target.value)}
//                 size={isMobile ? "middle" : "large"}
//                 style={{ marginTop: 16 }}
//               />

//               <Button
//                 type="primary"
//                 block
//                 size="large"
//                 onClick={handleSubmit}
//                 style={{
//                   marginTop: 24,
//                   height: isMobile ? 44 : 50,
//                   fontWeight: 600,
//                 }}
//               >
//                 Confirm Payment
//               </Button>
//             </Col>
//           </Row>
//         </Card>
//       </div>
//     </div>
//   );
// };

// const Step = ({ text }) => {
//   const { token } = theme.useToken();

//   return (
//     <div
//       style={{
//         display: "flex",
//         alignItems: "center",
//         marginBottom: 12,
//       }}
//     >
//       <CheckCircleFilled
//         style={{
//           color: token.colorSuccess,
//           marginRight: 10,
//           fontSize: 16,
//         }}
//       />
//       <Text>{text}</Text>
//     </div>
//   );
// };

// export default PaymentPage;
