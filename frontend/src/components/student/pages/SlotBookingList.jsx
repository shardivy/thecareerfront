import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Space,
  Avatar,
  Modal,
  Grid,
  Empty,
  message,
  Divider,
} from "antd";
import {
  UserOutlined,
  VideoCameraOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  PlusOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import BookSessionModal from "../modals/BookSessionModal";
import {
  fetchStudentCounsellingBookings,
  deleteCounsellingBooking,
} from "../../../adminSlices/counsellingBookingSlice";
import { fetchCounsellingNote } from "../../../adminSlices/counsellorSlice";
import SessionsNotesModal from "../../counsellor/modals/SessionsNotesModal";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const SlotBookingList = () => {
  const dispatch = useDispatch();
  const screens = useBreakpoint();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  const studentId = localStorage.getItem("studentId");

  const sessions = useSelector((state) =>
    Array.isArray(state.counsellingBooking.data)
      ? state.counsellingBooking.data
      : []
  );

  const loading = useSelector((state) => state.counsellingBooking.loading);

  useEffect(() => {
    if (studentId) {
      dispatch(fetchStudentCounsellingBookings(studentId));
    }
  }, [dispatch, studentId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const mappedSessions = sessions.map((s) => ({
    ...s,
    key: s.id,
    counsellorsList: Array.isArray(s.counsellors)
      ? s.counsellors.map((c) => ({
        id: c.counsellor?.id,
        name: `${c.counsellor?.first_name || ""} ${c.counsellor?.last_name || ""}`,
        role: c.role,
      }))
      : [],
    mode: s.preferred_counselling_mode
      ? s.preferred_counselling_mode.charAt(0).toUpperCase() + s.preferred_counselling_mode.slice(1)
      : "N/A",
    rawMode: s.preferred_counselling_mode || "offline",
    time: s.start_time && s.end_time ? `${s.start_time} - ${s.end_time}` : "N/A",
    date: s.slot_date || "N/A",
    status: s.status || "not_booked",
    zoomLink: s.meeting_link || null,
  }));

  const filteredSessions = mappedSessions;
  const noSessionFound = filteredSessions.length === 0;

  const isNotBooked =
    filteredSessions.length === 1 && filteredSessions[0].status === "not_booked";

  const statusColor = (status) => {
    if (status === "completed") return "green";
    if (status === "booked") return "blue";
    if (status === "cancelled") return "red";
    return "default";
  };

  const isJoinAllowed = (session) => {
    if (!session.time || !session.date) return false;

    const [startTime] = session.time.split(" - ");
    const sessionDateTime = new Date(`${session.date} ${startTime}`);
    const joinTime = new Date(sessionDateTime.getTime() - 10 * 60000);

    return currentTime >= joinTime;
  };

  const handleJoin = (session) => {
    if (session.zoomLink) {
      window.open(session.zoomLink, "_blank");
    } else {
      message.warning("Zoom link not available");
    }
  };

  const handleCancel = (sessionId) => {
    Modal.confirm({
      title: "Cancel Session",
      content: "Are you sure you want to cancel this session?",
      okText: "Yes, Cancel",
      cancelText: "No",
      okButtonProps: { danger: true },
      onOk: () => {
        dispatch(deleteCounsellingBooking(sessionId))
          .unwrap()
          .then(() => {
            dispatch(fetchStudentCounsellingBookings(studentId));
            message.success("Session cancelled successfully");
          });
      },
    });
  };

  const hasActiveSession = filteredSessions.some(
    (s) => s.status === "booked" || s.status === "completed"
  );

  const openGoogleMap = () => {
    const mapUrl =
      "https://www.google.com/maps/search/?api=1&query=Abhinav+Career+Scope+Bavdhan+Pune";

    window.open(mapUrl, "_blank");
  };

  return (
    <div style={{ padding: screens.md ? 24 : 12 }}>
      <Row
        style={{
          marginBottom: 20,
          paddingBottom: 8,
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <Col span={24} style={{ textAlign: "center", marginBottom: 16 }}>
          <Title level={2} style={{ margin: 0 }}>
            My Counselling Sessions
          </Title>
          <Text type="colorTextSecondary">
            <br />
            View and manage your booked sessions
          </Text>
        </Col>

        {filteredSessions.length > 0 && !isNotBooked && (
          <Col span={24} style={{ textAlign: "end" }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
               disabled={hasActiveSession || noSessionFound}
              onClick={() => {
                setRescheduleData(null);
                setIsModalOpen(true);
              }}
            >
              Book Session
            </Button>
          </Col>
        )}
      </Row>


      {loading ? (
        <Text>Loading sessions...</Text>
      ) : noSessionFound ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Empty
            description={
              <Text type="colorTextSecondary">
  Counselling sessions are currently unavailable.
  <br />
  You will be able to book a slot once your report is unlocked.
</Text>
            }
          />
          <div style={{ marginTop: 20 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
                disabled={noSessionFound}
              onClick={() => {
                setRescheduleData(null);
                setIsModalOpen(true);
              }}
            >
              Book Session
            </Button>
          </div>
        </div>
      ) : isNotBooked ? (
        <Space direction="vertical" size={24} style={{ width: "100%" }}>
          <Card
            style={{
              borderRadius: 16,
              border: "1px solid #e5e7eb",
              width: "100%",
            }}
          >
            <Row justify="space-between" align="middle">
              <Space>
                <Avatar size={48} icon={<UserOutlined />} />
                <div>
                  <Text strong>N/A</Text>
                  <br />
                  <Tag>N/A</Tag>
                </div>
              </Space>
              <Tag>Not Booked</Tag>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
              <Col xs={24} sm={12} md={8}>
                <Card bordered={false}>
                  <Text>Date</Text>
                  <br />
                  <Text strong>
                    <CalendarOutlined /> Not Scheduled
                  </Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card bordered={false}>
                  <Text>Time</Text>
                  <br />
                  <Text strong>
                    <ClockCircleOutlined /> N/A
                  </Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card bordered={false}>
                  <Text>Mode</Text>
                  <br />
                  <Text strong>
                    <VideoCameraOutlined /> N/A
                  </Text>
                </Card>
              </Col>
            </Row>

            <Divider />
            <div style={{ textAlign: "center", marginTop: 10 }}>
              <Text type="colorTextSecondary">
                You have not booked a session yet. Please click the
                <b> Book Session </b> button below.
              </Text>
              <div style={{ marginTop: 20 }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  size="large"
                  onClick={() => {
                    setRescheduleData(filteredSessions[0]);
                    setIsModalOpen(true);
                  }}
                >
                  Book Session
                </Button>
              </div>
            </div>
          </Card>
        </Space>
      ) : (
        <Space direction="vertical" size={24} style={{ width: "100%" }}>
          {filteredSessions.map((session) => (
            <Card
              key={session.id}
              style={{ borderRadius: 16, border: "1px solid #e5e7eb" }}
            >
              <Row justify="space-between" align="middle">
                <Space>
                  <Avatar size={48} icon={<UserOutlined />} />
                  <div>
                    {session.counsellorsList.length > 0 ? (
                      session.counsellorsList.map((c) => (
                        <div key={c.id}>
                          <Text strong>{c.name}</Text>
                          <br />
                          <Tag>{c.role}</Tag>
                        </div>
                      ))
                    ) : (
                      <Text strong>N/A</Text>
                    )}
                  </div>
                </Space>
                <Tag color={statusColor(session.status)}>{session.status}</Tag>
              </Row>

              <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24} sm={12} md={8}>
                  <Card bordered={false}>
                    <Text>Date</Text>
                    <br />
                    <Text strong>
                      <CalendarOutlined /> {session.date}
                    </Text>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Card bordered={false}>
                    <Text>Time</Text>
                    <br />
                    <Text strong>
                      <ClockCircleOutlined /> {session.time}
                    </Text>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Card bordered={false}>
                    <Text>Mode</Text>
                    <br />
                    <Text strong>
                      <VideoCameraOutlined /> {session.mode}
                    </Text>
                  </Card>
                </Col>
              </Row>

              {session.status === "booked" && (
                <Row justify="end" style={{ marginTop: 24 }}>
                  <Space
                    wrap
                    size={12}
                    style={{ width: "100%", justifyContent: "flex-end" }}
                  >
                    {session.rawMode.toLowerCase() === "online" ? (
                      <Button
                        type="primary"
                        icon={<VideoCameraOutlined />}
                        disabled={!isJoinAllowed(session)}
                        onClick={() => handleJoin(session)}
                      >
                        Join
                      </Button>
                    ) : (
                      <Button
                        type="primary"
                        icon={<EnvironmentOutlined />}
                        onClick={() => setIsLocationModalOpen(true)}
                      >
                        Location Details
                      </Button>
                    )}
                    {/* <Button
                      danger
                      icon={<CloseOutlined />}
                      onClick={() => handleCancel(session.id)}
                    >
                      Cancel
                    </Button> */}
                  </Space>
                </Row>
              )}

              {session.status === "completed" && (
                <Row justify="end" style={{ marginTop: 24 }}>
                  <Button
                    type="primary"
                    onClick={() => {
                      const counsellor = session.counsellorsList?.[0];
                      const rawUsername = localStorage.getItem("username") || "Student";

                      const studentName = rawUsername.includes(" - ")
                        ? rawUsername.split(" - ")[1]
                        : rawUsername;

                      const sessionDataForNotes = {
                        ...session,
                        studentName: studentName,
                        counsellorName: counsellor?.name || "N/A",
                        startTime: session.time?.split(" - ")[0],
                        endTime: session.time?.split(" - ")[1],
                        slot_time: session.time,
                      };

                      dispatch(fetchCounsellingNote(session.id)).then(() => {
                        setSelectedSession(sessionDataForNotes);
                        setNotesModalOpen(true);
                      });
                    }}
                  >
                    View Session Notes
                  </Button>
                </Row>
              )}
            </Card>
          ))}
        </Space>
      )}

      {/* Location Modal */}
      <Modal
        open={isLocationModalOpen}
        onCancel={() => setIsLocationModalOpen(false)}
        footer={null}
        width={620}
      >
        <div style={{ padding: 2 }}>
          <div style={{ marginBottom: 20 }}>
            <Title level={4} style={{ marginBottom: 6, color: "#111827" }}>
              📍 Counselling Office
            </Title>
            <Text type="seccolorTextSecondaryondary">
              Please arrive on time for your offline counselling session
            </Text>
          </div>

          <div
            style={{
              borderRadius: 12,
              background: "#f5f7ff",
              padding: 16,
              marginBottom: 20,
              boxShadow: "0 3px 8px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
              <Avatar
                size={48}
                icon={<UserOutlined />}
                style={{ backgroundColor: "#3b82f6", marginRight: 12 }}
              />
              <div>
                <Text strong style={{ fontSize: 16 }}>
                  Mrs. Reena Bhutada
                </Text>
              </div>
            </div>

            <div style={{ marginTop: 8, paddingLeft: 4 }}>
              <Text strong style={{ display: "block", marginBottom: 4 }}>
                🏢 Office Address
              </Text>
              <Text style={{ lineHeight: 1.5 }}>
                Abhinav Career Scope, Pune <br />
                Bhagwati Maestros, Miller 403 <br />
                LMD Chowk, Above Indian Smart Bazaar <br />
                Bavdhan, Pune – 411021
              </Text>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginTop: 16,
            }}
          >
            <Button onClick={() => setIsLocationModalOpen(false)}>
              Close
            </Button>
            <Button type="primary" onClick={openGoogleMap}>
              📍 Open in Google Maps
            </Button>
          </div>
        </div>
      </Modal>

      {/* Book Session Modal */}
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        width={screens.md ? 1000 : "100%"}
      >
        <BookSessionModal
          rescheduleData={rescheduleData}
          closeModal={() => setIsModalOpen(false)}
          onSave={() => dispatch(fetchStudentCounsellingBookings(studentId))}
        />
      </Modal>

      <Modal
        open={notesModalOpen}
        onCancel={() => setNotesModalOpen(false)}
        footer={null}
        width={screens.md ? 900 : "100%"}
        destroyOnClose
      >
        {selectedSession && (
          <SessionsNotesModal
            session={selectedSession}
            onClose={() => setNotesModalOpen(false)}
            isViewMode={true}
            hideSessionDetails={true}
            showStudentName={false}
          />
        )}
      </Modal>
    </div>
  );
};

export default SlotBookingList;



// import React, { useState, useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   Card,
//   Row,
//   Col,
//   Typography,
//   Tag,
//   Button,
//   Space,
//   Avatar,
//   Modal,
//   Grid,
//   Empty,
//   message,
//   Divider,
//   Alert,
// } from "antd";
// import {
//   UserOutlined,
//   VideoCameraOutlined,
//   CalendarOutlined,
//   ClockCircleOutlined,
//   CloseOutlined,
//   PlusOutlined,
//   EnterOutlined,
//   EnvironmentOutlined,
// } from "@ant-design/icons";
// import dayjs from "dayjs";

// import BookSessionModal from "../modals/BookSessionModal";
// import {
//   fetchStudentCounsellingBookings,
//   deleteCounsellingBooking,
// } from "../../../adminSlices/counsellingBookingSlice";

// const { Title, Text } = Typography;
// const { useBreakpoint } = Grid;

// const SlotBookingList = () => {
//   const dispatch = useDispatch();
//   const screens = useBreakpoint();

//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [rescheduleData, setRescheduleData] = useState(null);
//   const [currentTime, setCurrentTime] = useState(new Date());
//   const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

// const examStatus = localStorage.getItem("examCompleted");
// const canBookSession = examStatus === "true" || examStatus === "completed" || examStatus === "not_applicable";
//   const studentId = localStorage.getItem("studentId");

// const sessions = useSelector((state) => {
//   console.log('Raw Redux state:', state.counsellingBooking);
//   return Array.isArray(state.counsellingBooking.data)
//     ? state.counsellingBooking.data
//     : [];
// });

// // Add this after sessions are loaded
// useEffect(() => {
//   console.log('Sessions from Redux:', sessions);
//   console.log('Sessions length:', sessions.length);
//   if (sessions.length > 0) {
//     console.log('First session structure:', JSON.stringify(sessions[0], null, 2));
//   }
// }, [sessions]);

//   const loading = useSelector((state) => state.counsellingBooking.loading);

//   useEffect(() => {
//     if (studentId) {
//       dispatch(fetchStudentCounsellingBookings(studentId));
//          console.log('Dispatching fetch for student:', studentId);
//     }
//   }, [dispatch, studentId]);

//   useEffect(() => {
//     const timer = setInterval(() => {
//       setCurrentTime(new Date());
//     }, 60000);

//     return () => clearInterval(timer);
//   }, []);

//   const mappedSessions = sessions.map((s) => ({
//     ...s,
//     key: s.id,

//     counsellorsList: Array.isArray(s.counsellors)
//       ? s.counsellors.map((c) => ({
//         id: c.counsellor?.id,
//         name: `${c.counsellor?.first_name || ""} ${c.counsellor?.last_name || ""}`,
//         role: c.role,
//       }))
//       : [],

//    mode: s.preferred_counselling_mode
//   ? s.preferred_counselling_mode.charAt(0).toUpperCase() + s.preferred_counselling_mode.slice(1)
//   : "N/A",

//     // Raw mode for logic
//   rawMode: s.preferred_counselling_mode || "offline",

//     time:
//       s.start_time && s.end_time
//         ? `${s.start_time} - ${s.end_time}`
//         : "N/A",

//     date: s.slot_date ? s.slot_date : "N/A",

//     status: s.status || "not_booked",

//     zoomLink: s.meeting_link || null,
//   }));

//   const filteredSessions = mappedSessions;
//   const noSessionFound = filteredSessions.length === 0;

//   const isNotBooked =
//     filteredSessions.length === 1 &&
//     filteredSessions[0].status === "not_booked";

//   const statusColor = (status) => {
//     if (status === "completed") return "green";
//     if (status === "booked") return "blue";
//     if (status === "cancelled") return "red";
//     return "default";
//   };

//   const isJoinAllowed = (session) => {
//     if (!session.time || !session.date) return false;

//     const [startTime] = session.time.split(" - ");
//     const sessionDateTime = new Date(`${session.date} ${startTime}`);
//     const joinTime = new Date(sessionDateTime.getTime() - 10 * 60000);

//     return currentTime >= joinTime;
//   };

//   const handleJoin = (session) => {
//     if (session.zoomLink) {
//       window.open(session.zoomLink, "_blank");
//     } else {
//       message.warning("Zoom link not available");
//     }
//   };

//   const handleCancel = (sessionId) => {
//     Modal.confirm({
//       title: "Cancel Session",
//       content: "Are you sure you want to cancel this session?",
//       okText: "Yes, Cancel",
//       cancelText: "No",
//       okButtonProps: { danger: true },
//       onOk: () => {
//         dispatch(deleteCounsellingBooking(sessionId))
//           .unwrap()
//           .then(() => {
//             dispatch(fetchStudentCounsellingBookings(studentId));
//             message.success("Session cancelled successfully");
//           });
//       },
//     });
//   };

//   const hasActiveSession = filteredSessions.some(
//     (s) => s.status === "booked" || s.status === "completed"
//   );

//   return (
//     <div style={{ padding: screens.md ? 24 : 12 }}>

//       <Row
//         style={{
//           marginBottom: 20,
//           paddingBottom: 8,
//           borderBottom: "1px solid #f0f0f0",
//         }}
//       >
//         <Col span={24} style={{ textAlign: "center", marginBottom: 16 }}>
//           <Title level={2} style={{ margin: 0 }}>
//             My Counselling Sessions
//           </Title>

//           <Text type="colorTextSecondary"><br></br>
//             View and manage your booked sessions
//           </Text>
//         </Col>

//         {/* {!examCompleted && (
//           <Col span={24}>
//             <Alert
//               message="Exam not completed"
//               description="You can book a counselling session only after completing your exam."
//               type="warning"
//               showIcon
//             />
//           </Col>
//         )} */}

//       {canBookSession && filteredSessions.length > 0 && !isNotBooked && (
//   <Col span={24} style={{ textAlign: "end" }}>
//     <Button
//       type="primary"
//       icon={<PlusOutlined />}
//       size="large"
//       disabled={hasActiveSession}
//       onClick={() => {
//         setRescheduleData(null);
//         setIsModalOpen(true);
//       }}
//     >
//       Book Session
//     </Button>
//   </Col>
// )}
//       </Row>

//       {!canBookSession ? (
//         <Empty description="Complete exam to unlock session booking" />
//       ) : loading ? (
//         <Text>Loading sessions...</Text>
//       ) : filteredSessions.length === 0 ? (

//         <div style={{ textAlign: "center", padding: 40 }}>
//           <Empty
//             description={
//               <Text type="colorTextSecondary">
//                 No counselling sessions found
//               </Text>
//             }
//           />

//           <div style={{ marginTop: 20 }}>
//             <Button
//               type="primary"
//               icon={<PlusOutlined />}
//               size="large"
//               onClick={() => {
//                 setRescheduleData(null);
//                 setIsModalOpen(true);
//               }}
//             >
//               Book Session
//             </Button>
//           </div>
//         </div>

//       ) : isNotBooked ? (

//         <Space direction="vertical" size={24} style={{ width: "100%" }}>
//           <Card
//             style={{
//               borderRadius: 16,
//               border: "1px solid #e5e7eb",
//               width: "100%",
//             }}
//           >
//             <Row justify="space-between" align="middle">
//               <Space>
//                 <Avatar size={48} icon={<UserOutlined />} />

//                 <div>
//                   <Text strong>N/A</Text>
//                   <br />
//                   <Tag>N/A</Tag>
//                 </div>
//               </Space>

//               <Tag>Not Booked</Tag>
//             </Row>

//             <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
//               <Col xs={24} sm={12} md={8}>
//                 <Card bordered={false}>
//                   <Text>Date</Text>
//                   <br />
//                   <Text strong>
//                     <CalendarOutlined />  Not Scheduled
//                   </Text>
//                 </Card>
//               </Col>

//               <Col xs={24} sm={12} md={8}>
//                 <Card bordered={false}>
//                   <Text>Time</Text>
//                   <br />
//                   <Text strong>
//                     <ClockCircleOutlined /> N/A
//                   </Text>
//                 </Card>
//               </Col>

//               <Col xs={24} sm={12} md={8}>
//                 <Card bordered={false}>
//                   <Text>Mode</Text>
//                   <br />
//                   <Text strong>
//                     <VideoCameraOutlined /> N/A
//                   </Text>
//                 </Card>
//               </Col>
//             </Row>

//             <Divider />

//             <div style={{ textAlign: "center", marginTop: 10 }}>
//               <Text type="colorTextSecondary">
//                 You have not booked session yet. Please click the
//                 <b> Book Session </b> button below.
//               </Text>

//               <div style={{ marginTop: 20 }}>
//                 <Button
//                   type="primary"
//                   icon={<PlusOutlined />}
//                   size="large"
//                   onClick={() => {
//                     setRescheduleData(filteredSessions[0]);
//                     setIsModalOpen(true);
//                   }}
//                 >
//                   Book Session
//                 </Button>
//               </div>
//             </div>


//           </Card>
//         </Space>

//       ) : (

//         <Space direction="vertical" size={24} style={{ width: "100%" }}>
//           {filteredSessions.map((session) => (
//             <Card
//               key={session.id}
//               style={{
//                 borderRadius: 16,
//                 border: "1px solid #e5e7eb",
//               }}
//             >

//               <Row justify="space-between" align="middle">
//                 <Space>
//                   <Avatar size={48} icon={<UserOutlined />} />

//                   <div>
//                     {session.counsellorsList.length > 0 ? (
//                       session.counsellorsList.map((c) => (
//                         <div key={c.id}>
//                           <Text strong>{c.name}</Text>
//                           <br />
//                           <Tag>{c.role}</Tag>
//                         </div>
//                       ))
//                     ) : (
//                       <Text strong>N/A</Text>
//                     )}
//                   </div>
//                 </Space>

//                 <Tag color={statusColor(session.status)}>
//                   {session.status}
//                 </Tag>
//               </Row>

//               <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
//                 <Col xs={24} sm={12} md={8}>
//                   <Card bordered={false}>
//                     <Text>Date</Text>
//                     <br />
//                     <Text strong>
//                       <CalendarOutlined /> {session.date}
//                     </Text>
//                   </Card>
//                 </Col>

//                 <Col xs={24} sm={12} md={8}>
//                   <Card bordered={false}>
//                     <Text>Time</Text>
//                     <br />
//                     <Text strong>
//                       <ClockCircleOutlined /> {session.time}
//                     </Text>
//                   </Card>
//                 </Col>

//                 <Col xs={24} sm={12} md={8}>
//                   <Card bordered={false}>
//                     <Text>Mode</Text>
//                     <br />
//                     <Text strong>
//                       <VideoCameraOutlined /> {session.mode}
//                     </Text>
//                   </Card>
//                 </Col>
//               </Row>

//              {session.status === "booked" &&  (
//   <Row justify="end" style={{ marginTop: 24 }}>
//     <Space
//       wrap
//       size={12} // space between buttons
//       style={{ width: "100%", justifyContent: "flex-end" }}
//     >
//      {session.rawMode.toLowerCase() === "online" ? (
//   <Button
//     type="primary"
//     icon={<VideoCameraOutlined />}
//     disabled={!isJoinAllowed(session)}
//     onClick={() => handleJoin(session)}
//   >
//     Join
//   </Button>
// ) : (
//   <Button
//     type="primary"
//     icon={<EnvironmentOutlined />}
//     onClick={() => setIsLocationModalOpen(true)}
//   >
//     Location Details
//   </Button>
// )}
//       <Button
//         danger
//         icon={<CloseOutlined />}
//         onClick={() => handleCancel(session.id)}
//       >
//         Cancel
//       </Button>
//     </Space>
//   </Row>
// )}

//             </Card>
//           ))}
//         </Space>

//       )}

//       <Modal
//         open={isLocationModalOpen}
//         onCancel={() => setIsLocationModalOpen(false)}
//         footer={null}
//         width={620}
//         centered={false}
//       >
//         <div style={{ padding: 2 }}>

//           {/* Header */}
//           <div style={{ marginBottom: 20 }}>
//             <Title level={4} style={{ marginBottom: 6, color: "#111827" }}>
//               📍 Counselling Office
//             </Title>
//             <Text type="colorTextSecondary">
//               Please arrive on time for your offline counselling session
//             </Text>
//           </div>

//           {/* Counsellor + Address Box */}
//           <div
//             style={{
//               borderRadius: 12,
//               background: "#f5f7ff",
//               padding: 16,
//               marginBottom: 20,
//               boxShadow: "0 3px 8px rgba(0,0,0,0.08)",
//             }}
//           >
//             {/* Counsellor Info */}
//             <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
//               <Avatar
//                 size={48}
//                 icon={<UserOutlined />}
//                 style={{ backgroundColor: "#3b82f6", marginRight: 12 }}
//               />
//               <div>
//                 <Text strong style={{ fontSize: 16 }}>
//                   Mrs. Reena Bhutada
//                 </Text>
//                 <br />
//                 {/* <Text type="colorTextSecondary">Career Counsellor</Text> */}
//               </div>
//             </div>

//             {/* Office Address */}
//             <div style={{ marginTop: 8, paddingLeft: 4 }}>
//               <Text strong style={{ display: "block", marginBottom: 4 }}>
//                 🏢 Office Address
//               </Text>
//               <Text style={{ lineHeight: 1.5 }}>
//                 Abhinav Career Scope, Pune <br />
//                 Bhagwati Maestros, Miller 403 <br />
//                 LMD Chowk, Above Indian Smart Bazaar <br />
//                 Bavdhan, Pune – 411021
//               </Text>
//             </div>
//           </div>

//           {/* Important Notes */}
//           <div
//             style={{
//               borderRadius: 12,
//               background: "#fff7ed",
//               padding: 16,
//               marginBottom: 20,
//               borderLeft: "4px solid #f59e0b",
//             }}
//           >
//             <Text strong style={{ fontSize: 15 }}>
//               📌 Important Notes
//             </Text>
//             <ul style={{ marginTop: 8, paddingLeft: 18, lineHeight: 1.6 }}>
//               <li>Office is near Chandani Chowk, Bavdhan</li>
//               <li>Start 20 minutes earlier due to traffic</li>
//               <li>Parking available outside the building gate</li>
//             </ul>
//           </div>

//           <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
//             <Button onClick={() => setIsLocationModalOpen(false)}>
//               Close
//             </Button>
//           </div>

//           {/* Buttons */}
//           {/* <div style={{ display: "flex", gap: 12 }}>
//       <Button
//         type="primary"
//         block
//         style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6" }}
//         onClick={() =>
//           window.open(
//             "https://www.google.com/maps/search/?api=1&query=Abhinav+Career+Scope+Bavdhan+Pune",
//             "_blank"
//           )
//         }
//       >
//         Open in Google Maps
//       </Button>
//       <Button block onClick={() => setIsLocationModalOpen(false)}>
//         Close
//       </Button>
//     </div> */}
//         </div>
//       </Modal>

//       <Modal
//         open={isModalOpen}
//         onCancel={() => setIsModalOpen(false)}
//         footer={null}
//         destroyOnClose
//         width={screens.md ? 1000 : "100%"}
//       >
//         <BookSessionModal
//           rescheduleData={rescheduleData}
//           closeModal={() => setIsModalOpen(false)}
//           onSave={() => dispatch(fetchStudentCounsellingBookings(studentId))}
//         />
//       </Modal>

//     </div>
//   );
// };

// export default SlotBookingList;