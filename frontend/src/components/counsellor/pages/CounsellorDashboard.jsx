// src/pages/CounsellorDashboard.jsx
import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Typography,
  Select,
  Table,
  Button,
  Modal,
  Tag,
  message,
  Grid,
  Divider,
  Empty,
  Spin, // Make sure Spin is imported
} from "antd";
import {
  TeamOutlined,
  CalendarOutlined,
  UserOutlined,
  VideoCameraOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  EyeOutlined ,
  DownloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import adminTheme from "../../../theme/adminTheme";
import SessionNotesModal from "../../counsellor/modals/SessionNotesModal";
import StudentProfileModal from "../modals/StudentProfileModal";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyStudentsNew, fetchCounsellorDashboardCount, fetchCounsellingNote } from "../../../adminSlices/counsellorSlice";
import { getStudentProfile } from "../../../adminSlices/profileSlice";
import { markCounsellingBookingCompleted } from "../../../adminSlices/counsellingBookingSlice";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const CounsellorDashboard = () => {
  const screens = useBreakpoint();

  const [period, setPeriod] = useState("monthly");
  const [notesModal, setNotesModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [profileModal, setProfileModal] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
  });
  const [locationModal, setLocationModal] = useState(false);
  const [reportLoading, setReportLoading] = useState(true); // Add this state
  const dispatch = useDispatch();

  const { students, studentsLoading, notes } = useSelector(
    (state) => state.counsellors
  );

const { studentProfile, loading: profileLoading } = useSelector(
  (state) => state.profile
);
  const { dashboardStats, dashboardLoading } = useSelector(
    (state) => state.counsellors
  );

  // Remove or comment out this line if not needed
  // const { reports } = useSelector((state) => state.reports);

  useEffect(() => {
    dispatch(fetchMyStudentsNew());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchCounsellorDashboardCount(period));
  }, [dispatch, period]);

  // Add safe split for slot_time
  const upcomingSessions = (students || []).map((item) => {
    const [startTime, endTime] = item.slot_time ? item.slot_time.split(" - ") : ["", ""];

    return {
      id: item.id,
      key: item.id,
      student_id: item.student_id,
      studentName: item.student_name,
      studentEmail: item.student_email,
      studentPhone: item.student_phone,       
      counsellorName: item.counsellor_name,
      date: item.date,
      startTime,
      endTime,
      mode: item.mode === "online" ? "Online" : "Offline",
      status: item.status,
      preferredMode: item.preferred_counselling_mode === "online" ? "Online" : "Offline",
      report_file: item.report_file, 
    };
  });

  // Handle PDF download
// Handle PDF download
const handleDownloadReport = async () => {
  if (!selectedReport?.report_file) {
    message.warning("No report file available");
    return;
  }

  setDownloading(true);
  console.log("⬇️ Download initiated");

  try {
    const response = await fetch(selectedReport.report_file);
    const blob = await response.blob();

    // Create filename from student name or use default
    const fileName = selectedReport.studentName 
      ? `${selectedReport.studentName.replace(/\s+/g, '_')}_Report.pdf`
      : "Report.pdf";

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log("✅ Download successful");
    message.success("Report downloaded successfully");
    
    // Close the modal after successful download
    setReportModal(false);
    setSelectedReport(null);
    setReportLoading(true);
  } catch (error) {
    console.error("❌ Download failed:", error);
    message.error("Failed to download report");
  } finally {
    setDownloading(false);
  }
};

  const columns = [
    {
      title: "Sr No",
      key: "serial",
      width: 80,
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: "User Name",
      dataIndex: "studentName",
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.studentName}</div>
          <div>{record.studentEmail}</div>
        </div>
      ),
    },
    {
      title: "Date",
      dataIndex: "date",
      render: (date) => dayjs(date).format("DD-MM-YYYY"),
      width: 120,
    },
    {
      title: "Slot Time",
      render: (_, record) => `${record.startTime} - ${record.endTime}`,
    },
    {
      title: "Preferred Counselling Mode",
      dataIndex: "preferredMode",
      width: 140,
      render: (mode) => (
        <div style={{ whiteSpace: "normal", lineHeight: "18px" }}>
          {mode === "Online" ? (
            <Tag color="green">Online</Tag>
          ) : (
            <Tag color="blue">Offline</Tag>
          )}
        </div>
      ),
    },
    {
      title: "Actions",
      render: (_, record) => {
        const now = dayjs();

        const sessionStart = dayjs(
          `${record.date} ${record.startTime}`,
          "YYYY-MM-DD hh:mm A"
        );

        const sessionEnd = dayjs(
          `${record.date} ${record.endTime}`,
          "YYYY-MM-DD hh:mm A"
        );

        const isJoinEnabled =
          now.isAfter(sessionStart.subtract(5, "minute")) &&
          now.isBefore(sessionEnd);

        const showCompleteButton =
          record.status !== "completed" &&
          now.isAfter(sessionStart.subtract(15, "minute"));

        const isSessionOver = now.isAfter(sessionEnd);

        return (
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              flexDirection: screens.xs ? "column" : "row",
            }}
          >
            {/* View Profile Button */}
            <Button
              icon={<UserOutlined />}
              onClick={() => {
                dispatch(getStudentProfile(record.student_id))
                  .unwrap()
                  .then(() => setProfileModal(true))
                  .catch(() =>
                    message.error("Failed to load student profile")
                  );
              }}
            >
              View Profile
            </Button>

            {/* View Report Button - FIXED: Use record.report_file directly */}
            <Button
              icon={<EyeOutlined />}
              onClick={() => {
                // Use report_file directly from the record
                if (record.report_file) {
                  setSelectedReport({
                    report_file: record.report_file,
                    studentName: record.studentName,
                    studentEmail: record.studentEmail,
                    studentId: record.student_id,
                  });
                  setReportModal(true);
                  setReportLoading(true); // Reset loading state
                } else {
                  message.warning("No report available for this student");
                }
              }}
            >
              View Report
            </Button>

            {/* ONLINE SESSION */}
            {record.preferredMode === "Online" && !isSessionOver && (
              <Button
                type="primary"
                icon={<VideoCameraOutlined />}
                disabled={!isJoinEnabled}
                onClick={() => {
                  window.open(
                    "https://us06web.zoom.us/j/78343615915?pwd=ZjU2UnlGNEl3K2JvcHY0WGYyb1ZKQT09",
                    "_blank"
                  );
                }}
              >
                Join
              </Button>
            )}

            {/* OFFLINE SESSION */}
            {record.preferredMode === "Offline" && !isSessionOver && (
              <Button
                type="primary"
                icon={<EnvironmentOutlined />}
                onClick={() => {
                  setSelectedSession({
                    ...record,
                    location: staticLocation,
                  });
                  setLocationModal(true);
                }}
              >
                Location Details
              </Button>
            )}

            {/* SESSION COMPLETED */}
            {record.status === "completed" && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                disabled
              >
                Completed
              </Button>
            )}

            {/* MARK COMPLETE */}
            {record.status !== "completed" && showCompleteButton && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                style={{
                  backgroundColor: "#52c41a",
                  borderColor: "#52c41a",
                }}
                onClick={() => {
                  setSelectedSession(record);
                  setConfirmModal(true);
                }}
              >
                Mark as Complete
              </Button>
            )}

            {/* ADD NOTES */}
            <Button
              icon={<FileTextOutlined />}
              onClick={() => {
                dispatch(fetchCounsellingNote(record.id)).then(() => {
                  setSelectedSession(record);
                  setNotesModal(true);
                });
              }}
            >
              View / Add Notes
            </Button>
          </div>
        );
      },
    }
  ];

  const stats = [
    {
      title: "Assigned Students",
      value: dashboardStats.assignedStudents,
      icon: <TeamOutlined />,
    },
    {
      title: "Upcoming Sessions",
      value: dashboardStats.upcomingSessions,
      icon: <CalendarOutlined />,
    },
    {
      title: "Completed Sessions",
      value: dashboardStats.completedSessions,
      icon: <CalendarOutlined />,
    },
  ];

  const staticLocation = {
    officeName: "Abhinav Career Scope",
    building: "Bhagwati Maestros, Miller 403",
    landmarkLine1: "LMD Chowk, Above Indian Smart Bazaar",
    area: "Bavdhan",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411021",
    nearby: "Near Chandani Chowk, Bavdhan",
    instructions: "Start 20 minutes earlier due to traffic",
    parking: "Parking available outside the building gate"
  };

  return (
    <div style={{ padding: screens.xs ? 12 : 20 }}>
      {/* HEADER */}
      <Row gutter={[16, 16]} justify="space-between">
        <Col xs={24} md={12}>
          <Title level={3}>Dashboard</Title>
        </Col>
        <Col xs={24} md={6}>
          <Select
            value={period}
            onChange={setPeriod}
            style={{ width: "100%" }}
            options={[
              { label: "Weekly", value: "weekly" },
              { label: "Monthly", value: "monthly" },
              { label: "Yearly", value: "yearly" },
            ]}
          />
        </Col>
      </Row>

      {/* STATS */}
      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        {stats.map((item, index) => (
          <Col xs={24} sm={12} md={8} key={index}>
            <Card
              loading={dashboardLoading}
              style={{
                borderRadius: adminTheme.token.borderRadius,
                boxShadow: adminTheme.token.boxShadow,
              }}
            >
              <div style={{ display: "flex", gap: 10 }}>
                <span style={{ fontSize: 24 }}>
                  {item.icon}
                </span>
                <Text>{item.title}</Text>
              </div>
              <Title level={2}>{item.value}</Title>
            </Card>
          </Col>
        ))}
      </Row>

      {/* TABLE */}
      <Row style={{ marginTop: 30 }}>
        <Col span={24}>
          <Card title={`All Sessions (${upcomingSessions.length})`}>
            <div style={{ overflowX: "auto" }}>
              <Table
                columns={columns}
                dataSource={upcomingSessions}
                loading={studentsLoading}
                rowKey="id"
                scroll={{ x: 1150 }}
                pagination={{
                  ...pagination,
                  total: upcomingSessions.length,
                  showSizeChanger: true,
                  pageSizeOptions: ["5", "10", "20", "50"],
                }}
                onChange={(pag) => {
                  setPagination(pag);
                }}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* COMPLETE MODAL */}
      <Modal
        title="Confirm Completion"
        open={confirmModal}
        onCancel={() => {
          setConfirmModal(false);
          setSelectedSession(null);
        }}
        onOk={async () => {
          if (!selectedSession?.id) return;

          try {
            await dispatch(
              markCounsellingBookingCompleted(selectedSession.id)
            ).unwrap();

            message.success("Session marked as completed!");
            dispatch(fetchMyStudentsNew());
            dispatch(fetchCounsellingNote(selectedSession.id));
            setConfirmModal(false);
          } catch (error) {
            message.error(error || "Failed to mark session as completed");
          }
        }}
        okText="Yes, Complete"
        cancelText="Cancel"
        okButtonProps={{
          style: {
            backgroundColor: "#52c41a",
            borderColor: "#52c41a",
            color: "#fff",
          },
        }}
      >
        <p>
          Are you sure you want to mark session{" "}
          <strong>{selectedSession?.studentName}</strong> as completed?
        </p>
      </Modal>

      {/* LOCATION MODAL */}
      <Modal
        title="Location Details"
        open={locationModal}
        onCancel={() => setLocationModal(false)}
        footer={[
          <Button key="close" onClick={() => setLocationModal(false)}>
            Close
          </Button>,
        ]}
      >
        {selectedSession?.location && (
          <div style={{ lineHeight: "1.8" }}>
            <p><strong>{selectedSession.location.officeName}</strong></p>
            <p>{selectedSession.location.building}</p>
            <p>{selectedSession.location.landmarkLine1}</p>
            <p>{selectedSession.location.area}, {selectedSession.location.city} – {selectedSession.location.pincode}</p>
            <p>{selectedSession.location.state}</p>

            <Divider />

            <h4>📌 Important Notes</h4>
            <p>• {selectedSession.location.nearby}</p>
            <p>• {selectedSession.location.instructions}</p>
            <p>• {selectedSession.location.parking}</p>
          </div>
        )}
      </Modal>

      {/* NOTES MODAL */}
      <Modal
        title={`Session Notes - ${selectedSession?.studentName || ""}`}
        open={notesModal}
        onCancel={() => setNotesModal(false)}
        footer={null}
        width={screens.xs ? "95%" : 900}
      >
        <SessionNotesModal
          session={selectedSession}
          onClose={() => setNotesModal(false)}
          isViewMode={!!notes?.[selectedSession?.id]}
        />
      </Modal>

      {/* PROFILE MODAL */}
      <StudentProfileModal
        open={profileModal}
        onClose={() => setProfileModal(false)}
       student={studentProfile} 
        loading={profileLoading}
      />

  {/* REPORT MODAL - WITHOUT PAGE CONTROLS */}
<Modal
  title={`Report - ${selectedReport?.studentName || ""}`}
  open={reportModal}
  onCancel={() => {
    setReportModal(false);
    setSelectedReport(null);
    setReportLoading(true);
  }}
footer={[
  <Button 
    key="download" 
    type="primary" 
    icon={<DownloadOutlined />} 
    onClick={handleDownloadReport}
    disabled={!selectedReport?.report_file || downloading}
    loading={downloading}
  >
    {downloading ? "Downloading..." : "Download"}
  </Button>,
  <Button 
    key="close" 
    onClick={() => {
      setReportModal(false);
      setSelectedReport(null);
      setReportLoading(true);
    }}
  >
    Close
  </Button>,
]}
  width={screens.xs ? "95%" : 800}
  style={{ top: 20 }}
>
  {selectedReport?.report_file ? (
    <div style={{ 
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "500px",
      width: "100%", 
      position: "relative",
      backgroundColor: "#f5f5f5",
      borderRadius: "4px",
      overflow: "hidden",
      padding: "10px"
    }}>
      <div style={{
        width: "100%",
        height: "500px",
        border: "1px solid #e8e8e8",
        borderRadius: "4px",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <iframe
          src={`${selectedReport.report_file}#toolbar=0&navpanes=0&scrollbar=0`}
          title="Report Preview"
          width="100%"
          height="100%"
          style={{ 
            border: "none",
            backgroundColor: "#fff"
          }}
          onLoad={() => setReportLoading(false)}
          onError={() => {
            setReportLoading(false);
            message.error("Failed to load report. You can download it instead.");
          }}
        />
      </div>
      {reportLoading && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          padding: "20px",
          borderRadius: "8px",
          zIndex: 1,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <Spin size="large" />
          <p style={{ marginTop: 16, marginBottom: 0 }}>Loading report...</p>
        </div>
      )}
    </div>
  ) : (
    <div style={{ 
      minHeight: "300px", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center" 
    }}>
      <Empty description="No report available for this student" />
    </div>
  )}
</Modal>
    </div>
  );
};

export default CounsellorDashboard;


// // src/pages/CounsellorDashboard.jsx
// import React, { useState, useEffect } from "react";
// import {
//   Row,
//   Col,
//   Card,
//   Typography,
//   Select,
//   Table,
//   Button,
//   Modal,
//   Tag,
//   message,
//   Grid,
//   Divider,
// } from "antd";
// import {
//   TeamOutlined,
//   CalendarOutlined,
//   UserOutlined,
//   VideoCameraOutlined,
//   EnvironmentOutlined,
//   CheckCircleOutlined,
//   FileTextOutlined,
// } from "@ant-design/icons";
// import dayjs from "dayjs";
// import adminTheme from "../../../theme/adminTheme";
// import SessionNotesModal from "../../counsellor/modals/SessionNotesModal";
// import StudentProfileModal from "../modals/StudentProfileModal";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchMyStudentsNew, fetchCounsellorDashboardCount, fetchCounsellingNote } from "../../../adminSlices/counsellorSlice";
// import { getStudentProfile } from "../../../adminSlices/profileSlice";
// import { markCounsellingBookingCompleted } from "../../../adminSlices/counsellingBookingSlice";

// const { Title, Text } = Typography;
// const { useBreakpoint } = Grid;

// const CounsellorDashboard = () => {
//   const screens = useBreakpoint();

//   const [period, setPeriod] = useState("monthly");
//   const [notesModal, setNotesModal] = useState(false);
//   const [confirmModal, setConfirmModal] = useState(false);
//   const [selectedSession, setSelectedSession] = useState(null);
//   const [profileModal, setProfileModal] = useState(false);
//   const [pagination, setPagination] = useState({
//     current: 1,
//     pageSize: 5,
//   });
//   const [locationModal, setLocationModal] = useState(false);
//   const dispatch = useDispatch();

//   const { students, studentsLoading, notes } = useSelector(
//     (state) => state.counsellors
//   );

//   const { profile, loading: profileLoading } = useSelector(
//     (state) => state.profile
//   );

//   const { dashboardStats, dashboardLoading } = useSelector(
//     (state) => state.counsellors
//   );

//   useEffect(() => {
//       dispatch(fetchMyStudentsNew());
//   }, [dispatch]);

//   useEffect(() => {
//     dispatch(fetchCounsellorDashboardCount(period));
//   }, [dispatch, period]);



//   const upcomingSessions = (students || []).map((item) => {
//     const [startTime, endTime] = item.slot_time.split(" - ");

//     return {
//       id: item.id,
//       key: item.id,
//       student_id: item.student_id,
//       studentName: item.student_name,
//       studentEmail: item.student_email,
//       studentPhone: item.student_phone,       // ✅ Add this
//       counsellorName: item.counsellor_name,
//       date: item.date,
//       startTime,
//       endTime,
//       mode: item.mode === "online" ? "Online" : "Offline",
//       status: item.status,
//       preferredMode: item.preferred_counselling_mode === "online" ? "Online" : "Offline",
//     };
//   });

//   const columns = [
//     {
//       title: "Sr No",
//       key: "serial",
//       width: 80,
//       render: (_, __, index) =>
//         (pagination.current - 1) * pagination.pageSize + index + 1,
//     },
//     {
//       title: "User Name",
//       dataIndex: "studentName",
//       render: (text, record) => (
//         <div>
//           <div style={{ fontWeight: 600 }}>{record.studentName}</div>
//           <div>{record.studentEmail}</div>
//         </div>
//       ),
//     },
//     {
//       title: "Date",
//       dataIndex: "date",
//       render: (date) => dayjs(date).format("DD-MM-YYYY"),
//       width: 120,
//     },
//     {
//       title: "Slot Time",
//       render: (_, record) => `${record.startTime} - ${record.endTime}`,
//     },
//     {
//       title: "Preferred Counselling Mode",
//       dataIndex: "preferredMode",
//       width: 140,
//       render: (mode) => (
//         <div style={{ whiteSpace: "normal", lineHeight: "18px" }}>
//           {mode === "Online" ? (
//             <Tag color="green">Online</Tag>
//           ) : (
//             <Tag color="blue">Offline</Tag>
//           )}
//         </div>
//       ),
//     },
//     {
//       title: "Actions",
//       render: (_, record) => {

//         const now = dayjs();

//         const sessionStart = dayjs(
//           `${record.date} ${record.startTime}`,
//           "YYYY-MM-DD hh:mm A"
//         );

//         const sessionEnd = dayjs(
//           `${record.date} ${record.endTime}`,
//           "YYYY-MM-DD hh:mm A"
//         );

//         const isJoinEnabled =
//           now.isAfter(sessionStart.subtract(5, "minute")) &&
//           now.isBefore(sessionEnd);

//         const showCompleteButton =
//           record.status !== "completed" &&
//           now.isAfter(sessionStart.subtract(15, "minute"));

//         const isSessionOver = now.isAfter(sessionEnd);

//         return (
//           <div
//             style={{
//               display: "flex",
//               gap: 8,
//               flexWrap: "wrap",
//               flexDirection: screens.xs ? "column" : "row",
//             }}
//           >

//             {/* ALWAYS SHOW PROFILE BUTTON */}
//             <Button
//               icon={<UserOutlined />}
//               onClick={() => {
//                 dispatch(getStudentProfile(record.student_id))
//                   .unwrap()
//                   .then(() => setProfileModal(true))
//                   .catch(() =>
//                     message.error("Failed to load student profile")
//                   );
//               }}
//             >
//               View Profile
//             </Button>

//             {/* ONLINE SESSION */}
//             {record.preferredMode === "Online" && !isSessionOver && (
//               <Button
//                 type="primary"
//                 icon={<VideoCameraOutlined />}
//                 disabled={!isJoinEnabled}
//                 onClick={() => {
//                   window.open(
//                     "https://us06web.zoom.us/j/78343615915?pwd=ZjU2UnlGNEl3K2JvcHY0WGYyb1ZKQT09",
//                     "_blank"
//                   );
//                 }}
//               >
//                 Join
//               </Button>
//             )}

//             {/* OFFLINE SESSION */}
//             {record.preferredMode === "Offline" && !isSessionOver && (
//               <Button
//                 type="primary"
//                 icon={<EnvironmentOutlined />}
//                 onClick={() => {
//                   setSelectedSession({
//                     ...record,
//                     location: staticLocation,
//                   });
//                   setLocationModal(true);
//                 }}
//               >
//                 Location Details
//               </Button>
//             )}

//             {/* SESSION COMPLETED */}
//             {record.status === "completed" && (
//               <Button
//                 type="primary"
//                 icon={<CheckCircleOutlined />}
//                 disabled
//               >
//                 Completed
//               </Button>
//             )}

//             {/* MARK COMPLETE */}
//             {record.status !== "completed" && showCompleteButton && (
//               <Button
//                 type="primary"
//                 icon={<CheckCircleOutlined />}
//                 style={{
//                   backgroundColor: "#52c41a",
//                   borderColor: "#52c41a",
//                 }}
//                 onClick={() => {
//                   setSelectedSession(record);
//                   setConfirmModal(true);
//                 }}
//               >
//                 Mark as Complete
//               </Button>
//             )}

//             {/* ADD NOTES */}
//             {/* {(isSessionOver || record.status === "completed") && ( */}
//             <Button
//               icon={<FileTextOutlined />}
//               onClick={() => {
//                 dispatch(fetchCounsellingNote(record.id)).then(() => {
//                   setSelectedSession(record);
//                   setNotesModal(true);
//                 });
//               }}
//             >
//               View / Add Notes
//             </Button>
//             {/* )} */}

//           </div>
//         );
//       },
//     }
//   ];

//   const stats = [
//     {
//       title: "Assigned Students",
//       value: dashboardStats.assignedStudents,
//       icon: <TeamOutlined />,
//     },
//     {
//       title: "Upcoming Sessions",
//       value: dashboardStats.upcomingSessions,
//       icon: <CalendarOutlined />,
//     },
//     {
//       title: "Completed Sessions",
//       value: dashboardStats.completedSessions,
//       icon: <CalendarOutlined />,
//     },
//   ];

//   const staticLocation = {
//     officeName: "Abhinav Career Scope",
//     building: "Bhagwati Maestros, Miller 403",
//     landmarkLine1: "LMD Chowk, Above Indian Smart Bazaar",
//     area: "Bavdhan",
//     city: "Pune",
//     state: "Maharashtra",
//     pincode: "411021",
//     nearby: "Near Chandani Chowk, Bavdhan",
//     instructions: "Start 20 minutes earlier due to traffic",
//     parking: "Parking available outside the building gate"
//   };

//   return (
//     <div style={{ padding: screens.xs ? 12 : 20 }}>
//       {/* HEADER */}
//       <Row gutter={[16, 16]} justify="space-between">
//         <Col xs={24} md={12}>
//           <Title level={3}>Dashboard</Title>
//         </Col>
//         <Col xs={24} md={6}>
//           <Select
//             value={period}
//             onChange={setPeriod}
//             style={{ width: "100%" }}
//             options={[
//               { label: "Weekly", value: "weekly" },
//               { label: "Monthly", value: "monthly" },
//               { label: "Yearly", value: "yearly" },
//             ]}
//           />
//         </Col>
//       </Row>

//       {/* STATS */}
//       <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
//         {stats.map((item, index) => (
//           <Col xs={24} sm={12} md={8} key={index}>
//             <Card
//               loading={dashboardLoading}
//               style={{
//                 borderRadius: adminTheme.token.borderRadius,
//                 boxShadow: adminTheme.token.boxShadow,
//               }}
//             >
//               <div style={{ display: "flex", gap: 10 }}>
//                 <span style={{ fontSize: 24 }}>
//                   {item.icon}
//                 </span>
//                 <Text>{item.title}</Text>
//               </div>
//               <Title level={2}>{item.value}</Title>
//             </Card>
//           </Col>
//         ))}
//       </Row>

//       {/* TABLE */}
//       <Row style={{ marginTop: 30 }}>
//         <Col span={24}>
//           <Card title={`All Sessions (${upcomingSessions.length})`}>
//             <div style={{ overflowX: "auto" }}>
//               <Table
//                 columns={columns}
//                 dataSource={upcomingSessions}
//                 loading={studentsLoading}
//                 rowKey="id"
//                 scroll={{ x: 1150 }}
//                 pagination={{
//                   ...pagination,
//                   total: upcomingSessions.length,
//                   showSizeChanger: true,
//                   pageSizeOptions: ["5", "10", "20", "50"],
//                 }}
//                 onChange={(pag) => {
//                   setPagination(pag);
//                 }}
//               />
//             </div>
//           </Card>
//         </Col>
//       </Row>


//       {/* COMPLETE MODAL */}
//       <Modal
//         title="Confirm Completion"
//         open={confirmModal}
//         onCancel={() => {
//           setConfirmModal(false);
//           setSelectedSession(null);
//         }}
//       onOk={async () => {
//   if (!selectedSession?.id) return;

//   try {
//     await dispatch(
//       markCounsellingBookingCompleted(selectedSession.id)
//     ).unwrap();

//     message.success("Session marked as completed!");

//     // ✅ Refresh sessions list
//     dispatch(fetchMyStudentsNew());

//     // ✅ Refresh notes for that session
//     dispatch(fetchCounsellingNote(selectedSession.id));

//     setConfirmModal(false);
//   } catch (error) {
//     message.error(error || "Failed to mark session as completed");
//   }
// }}
//         okText="Yes, Complete"
//         cancelText="Cancel"
//         okButtonProps={{
//           style: {
//             backgroundColor: "#52c41a",
//             borderColor: "#52c41a",
//             color: "#fff",
//           },
//         }}
//       >
//         <p>
//           Are you sure you want to mark session{" "}
//           <strong>{selectedSession?.studentName}</strong> as completed?
//         </p>
//       </Modal>


//       {/* LOCATION MODAL */}
//       <Modal
//         title={`Location Details`}
//         open={locationModal}
//         onCancel={() => setLocationModal(false)}
//         footer={[
//           <Button key="close" onClick={() => setLocationModal(false)}>
//             Close
//           </Button>,
//           // <Button key="map" type="primary" onClick={() => {
//           //   const address = `${selectedSession.location.officeName}, ${selectedSession.location.area}, ${selectedSession.location.city}`;
//           //   window.open(
//           //     `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
//           //     "_blank"
//           //   );
//           // }}>
//           //   Open in Google Maps
//           // </Button>,

//         ]}
//       >
//         {selectedSession?.location && (
//           <div style={{ lineHeight: "1.8" }}>
//             {/* <h3>{selectedSession.location.counselorName}</h3> */}
//             <p><strong>{selectedSession.location.officeName}</strong></p>
//             <p>{selectedSession.location.building}</p>
//             <p>{selectedSession.location.landmarkLine1}</p>
//             <p>{selectedSession.location.area}, {selectedSession.location.city} – {selectedSession.location.pincode}</p>
//             <p>{selectedSession.location.state}</p>

//             <Divider />

//             <h4>📌 Important Notes</h4>
//             <p>• {selectedSession.location.nearby}</p>
//             <p>• {selectedSession.location.instructions}</p>
//             <p>• {selectedSession.location.parking}</p>
//           </div>
//         )}
//       </Modal>
//       {/* NOTES MODAL */}
//       <Modal
//         title={`Session Notes - ${selectedSession?.studentName || ""}`}
//         open={notesModal}
//         onCancel={() => setNotesModal(false)}
//         footer={null}
//         width={screens.xs ? "95%" : 900}
//       >
//         <SessionNotesModal
//           session={selectedSession}
//           onClose={() => setNotesModal(false)}
//           isViewMode={!!notes?.[selectedSession?.id]}
//         />
//       </Modal>

//       {/* PROFILE MODAL */}
//       <StudentProfileModal
//         open={profileModal}
//         onClose={() => setProfileModal(false)}
//         student={profile}
//         loading={profileLoading}
//       />
//     </div>
//   );
// };

// export default CounsellorDashboard;