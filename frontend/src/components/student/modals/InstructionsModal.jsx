import React from "react";
import {
  Modal,
  Typography,
  List,
  Button,
  Card,
  Divider,
  theme,
} from "antd";
import {
  LaptopOutlined,
  FormOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  PictureOutlined,
} from "@ant-design/icons";

const { Title, Text, Link } = Typography;
const { useToken } = theme;

const InstructionsModal = ({
  open,
  onClose,
  showStartTestButton,
  onConfirm,
}) => {
  const { token } = useToken();

  const handleStartTest = () => {
    onClose();

    setTimeout(() => {
      window.open(
        "https://www.careerfutura.com/ba/business-associate#",
        "_blank"
      );

      if (typeof onConfirm === "function") {
        onConfirm();
      }
    }, 300);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={850}
      centered
        bodyStyle={{
    maxHeight: "75vh",
    overflowY: "auto",
    paddingRight: 8,
  }}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,

        showStartTestButton ? (
          <Button
            key="start"
            type="primary"
            size="large"
            style={{ borderRadius: 8 }}
            onClick={handleStartTest}
          >
            Start Test
          </Button>
        ) : (
          <Button
            key="understand"
            type="primary"
            size="large"
            style={{ borderRadius: 8 }}
            onClick={onClose}
          >
            OK, I Understand
          </Button>
        ),
      ]}
      title={
        <Title level={4} style={{ margin: 0 }}>
          🎯 Career Assessment Instructions
        </Title>
      }
    >
      <div style={{ padding: "6px 0 12px 0", lineHeight: 1.35 }}>
        {/* IMPORTANT TEST NOTE */}
        <Card
          bodyStyle={{ padding: "14px 16px" }}
          style={{
            borderRadius: 16,
            marginBottom: 16,
            background: "linear-gradient(135deg,#fff7e6,#fff1f0)",
            border: "1px solid #ffd591",
          }}
        >
          <Title level={5} style={{ marginBottom: 10 }}>
            <PictureOutlined style={{ marginRight: 8 }} />
            Important Test Instructions
          </Title>

          {/* IMAGE */}
          <div
            style={{
              width: "100%",
              borderRadius: 12,
              overflow: "hidden",
              marginBottom: 14,
              border: "1px solid #f0f0f0",
              boxShadow: "0 10px 24px rgba(0, 0, 0, 0.12)",
            }}
          >
            <img
              src="/exam-img.jpeg"
              alt="Test Completion Example"
              style={{
                width: "100%",
                display: "block",
                objectFit: "cover",
                transform: "rotate(-1deg)",
                transformOrigin: "center center",
              }}
            />
          </div>

          {/* TEXT */}
          <div
            style={{
              background: "#fff",
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px dashed #ffa940",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                lineHeight: 1.8,
                color: "#262626",
              }}
            >
              Please complete all sections of the test until a{" "}
              <Text strong style={{ color: "#52c41a" }}>
                green tick
              </Text>{" "}
              is visible on all sections as shown in the image.
              <br />
              <br />
              Also,{" "}
              <Text strong>
                do not make any payment
              </Text>{" "}
              on the test website. Directly fill in your details and
              begin the test.
            </Text>
          </div>
        </Card>

        {/* GETTING STARTED */}
        <Card
          bodyStyle={{ padding: "12px 16px" }}
          style={{
            borderRadius: 16,
            background: "linear-gradient(135deg,#e6f7ff,#f0f5ff)",
            marginBottom: 16,
          }}
          bordered={false}
        >
          <Title level={5} style={{ marginBottom: 6 }}>
            <LaptopOutlined style={{ marginRight: 8 }} />
            Getting Started
          </Title>

          <List
            dataSource={[
              "Use Laptop or Computer only (Mobile not allowed)",
              "Duration: Approximately 2 Hours",
              "Timing: Between 11:00 AM – 6:00 PM",
              "No prior preparation required",
            ]}
            renderItem={(item) => (
              <List.Item style={{ padding: "4px 0" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Text style={{ marginRight: 6 }}>{item}</Text>

                  <CheckCircleOutlined
                    style={{ color: token.colorSuccess }}
                  />
                </div>
              </List.Item>
            )}
          />
        </Card>

        {/* REGISTRATION */}
        <Card
          bodyStyle={{ padding: "12px 16px" }}
          style={{
            borderRadius: 16,
            marginBottom: 16,
            boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
          }}
        >
          <Title level={5} style={{ marginBottom: 6 }}>
            <FormOutlined style={{ marginRight: 8 }} />
            Registration Instructions
          </Title>

          <List
            dataSource={[
              "8th Class → Select '9th appeared'",
              "9th Class → Select '10th appeared'",
              "10th Class → Select '10th appeared' or '10th completed'",
              "11th Class → Select '11th completed' or '12th appeared'",
            ]}
            renderItem={(item) => (
              <List.Item style={{ padding: "4px 0" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Text style={{ marginRight: 6 }}>{item}</Text>

                  <CheckCircleOutlined
                    style={{ color: token.colorSuccess }}
                  />
                </div>
              </List.Item>
            )}
          />
        </Card>

        {/* SUPPORT & VERIFICATION */}
        <Card
          bodyStyle={{ padding: "12px 16px" }}
          style={{
            borderRadius: 16,
            background: "#fafafa",
            marginBottom: 16,
          }}
        >
          <Title level={5} style={{ marginBottom: 6 }}>
            📞 Support & Verification
          </Title>

          <List
            dataSource={[
              <>
                Watch the instructional video before starting.{" "}
                <Link
                  href="https://www.youtube.com/watch?v=32FdMJBfRy4"
                  target="_blank"
                >
                  Click here to watch
                </Link>
              </>,

              "For technical help, WhatsApp Mr. Ketan at 8087466154.",

              "After completing all sections, WhatsApp to confirm submission.",
            ]}
            renderItem={(item, index) => (
              <List.Item key={index} style={{ padding: "4px 0" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Text style={{ marginRight: 6 }}>{item}</Text>

                  <CheckCircleOutlined
                    style={{ color: token.colorPrimary }}
                  />
                </div>
              </List.Item>
            )}
          />
        </Card>

        {/* ABOUT */}
        <Card
          bodyStyle={{ padding: "12px 16px" }}
          style={{
            borderRadius: 16,
            background: "linear-gradient(135deg,#f0f5ff,#d6e4ff)",
          }}
          bordered={false}
        >
          <Title level={5} style={{ marginBottom: 6 }}>
            <GlobalOutlined style={{ marginRight: 8 }} />
            About Abhinav Career Scope
          </Title>

          <Text>
            Career guidance company based in Bavdhan, Pune.
          </Text>

          <Divider style={{ margin: "10px 0" }} />

          <Text strong>📱 Contact:</Text> 9922695424 <br />

          <Text strong>📧 Email:</Text>{" "}
          abhinavcareerscope@gmail.com <br />

          <Text strong>🌐 Website:</Text>{" "}
          www.abhinavcareerscope.com
        </Card>
      </div>
    </Modal>
  );
};

export default InstructionsModal;

// import React from "react";
// import {
//   Modal,
//   Typography,
//   List,
//   Button,
//   Card,
//   Row,
//   Col,
//   Tag,
//   Divider,
//   theme,
// } from "antd";
// import {
//   LaptopOutlined,
//   FormOutlined,
//   CheckCircleOutlined,
//   GlobalOutlined,
// } from "@ant-design/icons";

// const { Title, Text, Link } = Typography;
// const { useToken } = theme;

// const InstructionsModal = ({ open, onClose, showStartTestButton, onConfirm }) => {
//   const { token } = useToken();

//   const handleStartTest = () => {
//     onClose();

//     setTimeout(() => {
//       window.open(
//         "https://www.careerfutura.com/ba/business-associate#",
//         "_blank"
//       );
//       if (typeof onConfirm === "function") {
//         onConfirm(); // Invoke the callback to update the exam status
//       }
//     }, 300);
//   };

//   return (
//     <Modal
//       open={open}
//       onCancel={onClose}
//       width={850}
//       footer={[
//         <Button key="close" onClick={onClose}>
//           Close
//         </Button>,
//         showStartTestButton ? (
//           <Button
//             key="start"
//             type="primary"
//             size="large"
//             style={{ borderRadius: 8 }}
//             onClick={handleStartTest}
//           >
//             Start Test
//           </Button>
//         ) : (
//           <Button
//             key="understand"
//             type="primary"
//             size="large"
//             style={{ borderRadius: 8 }}
//             onClick={onClose}
//           >
//             OK, I Understand
//           </Button>
//         ),
//       ]}
//       title={
//         <Title level={4} style={{ margin: 0 }}>
//           🎯 Career Assessment Instructions
//         </Title>
//       }
//     >
//       <div style={{ padding: "10px 0 20px 0" }}>

//         {/* GETTING STARTED */}
//         <Card
//           style={{
//             borderRadius: 16,
//             background: "linear-gradient(135deg,#e6f7ff,#f0f5ff)",
//             marginBottom: 24,
//           }}
//           bordered={false}
//         >
//           <Title level={5}>
//             <LaptopOutlined style={{ marginRight: 8 }} />
//             Getting Started
//           </Title>

//           <List
//             dataSource={[
//               "Use Laptop or Computer only (Mobile not allowed)",
//               "Duration: Approximately 2 Hours",
//               "Timing: Between 11:00 AM – 6:00 PM",
//               "No prior preparation required",
//             ]}
//             renderItem={(item) => (
//               <List.Item>
//                 <div style={{ display: "flex", alignItems: "center" }}>
//                   <Text style={{ marginRight: 8 }}>{item}</Text>
//                   <CheckCircleOutlined style={{ color: token.colorSuccess }} />
//                 </div>
//               </List.Item>
//             )}
//           />
//         </Card>

//         {/* REGISTRATION */}
//         <Card
//           style={{
//             borderRadius: 16,
//             marginBottom: 24,
//             boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
//           }}
//         >
//           <Title level={5}>
//             <FormOutlined style={{ marginRight: 8 }} />
//             Registration Instructions
//           </Title>

//           <List
//             dataSource={[
//               "8th Class → Select '9th appeared'",
//               "9th Class → Select '10th appeared'",
//               "10th Class → Select '10th appeared' or '10th completed'",
//               "11th Class → Select '11th completed' or '12th appeared'",
//             ]}
//             renderItem={(item) => (
//               <List.Item>
//                 <div style={{ display: "flex", alignItems: "center" }}>
//                   <Text style={{ marginRight: 8 }}>{item}</Text>
//                   <CheckCircleOutlined style={{ color: token.colorSuccess }} />
//                 </div>
//               </List.Item>
//             )}
//           />
//         </Card>

//         {/* SUPPORT & VERIFICATION */}
//         <Card
//           style={{
//             borderRadius: 16,
//             background: "#fafafa",
//             marginBottom: 24,
//           }}
//         >
//           <Title level={5}>📞 Support & Verification</Title>

//           <List
//             dataSource={[
//               <>
//                 Watch the instructional video before starting.{" "}
//                 <Link
//                   href="https://www.youtube.com/watch?v=32FdMJBfRy4"
//                   target="_blank"
//                 >
//                   Click here to watch
//                 </Link>
//               </>,
//               "For technical help, WhatsApp Mr. Ketan at 8087466154.",
//               "After completing all sections, WhatsApp to confirm submission.",
//             ]}
//             renderItem={(item, index) => (
//               <List.Item key={index}>
//                 <div style={{ display: "flex", alignItems: "center" }}>
//                   <Text style={{ marginRight: 8 }}>{item}</Text>
//                   <CheckCircleOutlined style={{ color: token.colorPrimary }} />
//                 </div>
//               </List.Item>
//             )}
//           />
//         </Card>

//         {/* ABOUT */}
//         <Card
//           style={{
//             borderRadius: 16,
//             background: "linear-gradient(135deg,#f0f5ff,#d6e4ff)",
//           }}
//           bordered={false}
//         >
//           <Title level={5}>
//             <GlobalOutlined style={{ marginRight: 8 }} />
//             About Abhinav Career Scope
//           </Title>

//           <Text>
//             Career guidance company based in Bavdhan, Pune.
//           </Text>

//           <Divider />

//           <Text strong>📱 Contact:</Text> 9922695424 <br />
//           <Text strong>📧 Email:</Text> abhinavcareerscope@gmail.com <br />
//           <Text strong>🌐 Website:</Text> www.abhinavcareerscope.com
//         </Card>
//       </div>
//     </Modal>
//   );
// };

// export default InstructionsModal;