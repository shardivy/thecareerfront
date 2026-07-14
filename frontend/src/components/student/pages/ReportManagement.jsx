// import React, { useState, useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   Card,
//   Row,
//   Col,
//   Typography,
//   Button,
//   Divider,
//   Alert,
//   Tag,
// } from "antd";
// import {
//   FilePdfOutlined,
//   LockOutlined,
//   DownloadOutlined,
//   EyeOutlined,
//   CalendarOutlined,
//   InfoCircleOutlined,
//   StarOutlined,
// } from "@ant-design/icons";
// import SubmitReviewModal from "../modals/SubmitReviewModal";
// import { fetchCompletedExamReportsByStudent } from "../../../adminSlices/reportSlice";


// const { Title, Text } = Typography;

// const ReportManagement = () => {
//   /* ---------------- REVIEW STATE ---------------- */
//   const [reviewModalOpen, setReviewModalOpen] = useState(false);
//   const [rating, setRating] = useState(4);
//   const [feedback, setFeedback] = useState("");
//   const [reviewSubmitted, setReviewSubmitted] = useState(false);
//   const dispatch = useDispatch();

//    const { reports, loading, error } = useSelector(
//     (state) => state.reports
//   );


// useEffect(() => {
//   const studentId = localStorage.getItem("studentId");

//   if (studentId) {
//     dispatch(fetchCompletedExamReportsByStudent(studentId));
//   }
// }, [dispatch]);

//   /* ---------------- HANDLERS ---------------- */
//   const handleSubmitReview = () => {
//     setReviewSubmitted(true);
//     setReviewModalOpen(false);
//   };

//   const handleDownload = () => {
//     const link = document.createElement("a");
//     link.href = "/Career Counselling & Assessment Platform.pdf";
//     link.download = "Career_Report.pdf";
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   const handleView = () => {
//     window.open("/Career Counselling & Assessment Platform.pdf", "_blank");
//   };

//   /* ---------------- REPORT CARD ---------------- */
//   const ReportCard = ({ title, locked, reason }) => (
//     <Card
//       style={{
//         borderRadius: 16,
//         boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
//         height: "100%",
//       }}
//     >
//       {/* Header */}
//       <Row justify="space-between">
//         <Title level={5}>{title}</Title>
//         <Tag color={locked ? "red" : "green"}>
//           {locked ? "Locked" : "Unlocked"}
//         </Tag>
//       </Row>

//       <Divider />

//       {/* Preview */}
//       <div
//         style={{
//           height: 220,
//           borderRadius: 12,
//           background: locked
//             ? "linear-gradient(180deg,#020617,#0f172a)"
//             : "#f3f4f6",
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "center",
//           marginBottom: 16,
//         }}
//       >
//         {locked ? (
//           <LockOutlined style={{ fontSize: 46, color: "#fff" }} />
//         ) : (
//           <FilePdfOutlined style={{ fontSize: 46 }} />
//         )}
//       </div>

//       {/* Info */}
//       <Row gutter={16} style={{ marginBottom: 12 }}>
//         <Col>
//           <CalendarOutlined /> <Text>07 Jan 2026</Text>
//         </Col>
//         <Col>
//           <InfoCircleOutlined /> <Text>2.4 MB</Text>
//         </Col>
//       </Row>

//       <Divider />

//       {/* Actions */}
//       {!locked ? (
//         <>
//           <Button
//             block
//             icon={<EyeOutlined />}
//             style={{ marginBottom: 10 }}
//             onClick={handleView}
//           >
//             View Report
//           </Button>
//           <Button block icon={<DownloadOutlined />} onClick={handleDownload}>
//             Download PDF
//           </Button>
//         </>
//       ) : reason === "payment" ? (
//         <Alert
//           type="warning"
//           showIcon
//           message="Payment Pending"
//           description="Complete payment to unlock this report"
//         />
//       ) : (
//         <>
//           {!reviewSubmitted ? (
//             <>
//               <Alert
//                 type="info"
//                 showIcon
//                 message="Review Required"
//                 description="Submit your review to unlock the report"
//                 style={{ marginBottom: 12 }}
//               />
//               <Button
//                 block
//                 icon={<StarOutlined />}
//                 type="primary"
//                 onClick={() => setReviewModalOpen(true)}
//               >
//                 Submit Review
//               </Button>
//             </>
//           ) : (
//             <Alert
//               type="info"
//               showIcon
//               message="Review Submitted"
//               description="Waiting for admin verification"
//             />
//           )}
//         </>
//       )}
//     </Card>
//   );

//   return (
//     <div style={{ padding: 16 }}>
//       <Title level={2} style={{ textAlign: "center" }}>
//         My Reports
//       </Title>
//       <Text
//         type="colorTextSecondary"
//         style={{ display: "block", textAlign: "center" }}
//       >
//         View and manage your assessment reports
//       </Text>

//       <Divider />

//      <Row gutter={[24, 24]}>
//   {reports && reports.length > 0 ? (
//     reports.map((report) => (
//       <Col xs={24} md={8} key={report.id}>
//         <ReportCard
//           title={report.exam_name || "Career Assessment Report"}
//           locked={!report.is_unlocked}
//           reason={report.lock_reason}
//         />
//       </Col>
//     ))
//   ) : (
//     !loading && (
//       <Col span={24}>
//         <Alert
//           type="info"
//           message="No Reports Available"
//           showIcon
//         />
//       </Col>
//     )
//   )}
// </Row>


//       {/* ---------------- REVIEW MODAL ---------------- */}
//       <SubmitReviewModal
//         open={reviewModalOpen}
//         onCancel={() => setReviewModalOpen(false)}
//         onSubmit={handleSubmitReview}
//         rating={rating}
//         setRating={setRating}
//         feedback={feedback}
//         setFeedback={setFeedback}
//       />
//     </div>
//   );
// };

// export default ReportManagement;



import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Divider,
  Alert,
  Tag,
  Spin,
} from "antd";
import {
  FilePdfOutlined,
  LockOutlined,
  DownloadOutlined,
  EyeOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { fetchCompletedExamReportsByStudent } from "../../../adminSlices/reportSlice";

const { Title, Text } = Typography;

const ReportManagement = () => {
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { reports, loading, error } = useSelector((state) => state.reports);

  useEffect(() => {
    const studentId = localStorage.getItem("studentId");

    if (studentId) {
      dispatch(fetchCompletedExamReportsByStudent(studentId));
    }
  }, [dispatch]);

  /* ---------------- HANDLERS ---------------- */

  const handleDownload = async (url, fileName) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();

      const downloadUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = fileName || "report"; // ✅ use backend filename

      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      // console.error("Download error:", err);
    }
  };

  const getFileType = (fileName = "") => {
    const ext = fileName.split(".").pop()?.toLowerCase();

    if (ext === "pdf") return "pdf";
    if (["xls", "xlsx"].includes(ext)) return "excel";
    if (["doc", "docx"].includes(ext)) return "word";

    return "other";
  };

  const handleView = (url) => {
    if (!url) return;
    window.open(url, "_blank");
  };

  const selectedProgram = localStorage.getItem("selectedProgram");
  const selectedPackage = localStorage.getItem("selectedPackage");
  const selectedProgramId = localStorage.getItem("selectedProgramId");
  const selectedPackageId = localStorage.getItem("selectedPackageId");
  const selectedProgramIdNum = selectedProgramId ? Number(selectedProgramId) : null;
  const selectedPackageIdNum = selectedPackageId ? Number(selectedPackageId) : null;

  const filteredReports = reports?.filter((report) => {
    if (!selectedProgramIdNum || !selectedPackageIdNum) return true;
    return (
      Number(report.program_id) === selectedProgramIdNum &&
      Number(report.package_id) === selectedPackageIdNum
    );
  });

  const handleReviewRedirect = (reportId) => {
    navigate(`/student/write-review`);
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /* ---------------- REPORT CARD ---------------- */

  const ReportCard = ({ title, locked, reason, report }) => {
    const type = getFileType(report?.file_name);
    const isPdf = type === "pdf";

    return (
      <Card
        style={{
          borderRadius: 16,
          boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
          height: "100%",
        }}
      >
        {/* Header */}
        <Row justify="space-between">
          <Title level={5}>{title}</Title>
          <Tag color={locked ? "red" : "green"}>
            {locked ? "Locked" : "Unlocked"}
          </Tag>
        </Row>

        <Divider />

        {/* Preview */}
        <div
          style={{
            height: 220,
            borderRadius: 12,
            background: locked
              ? "linear-gradient(180deg,#020617,#0f172a)"
              : "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          {locked ? (
            <LockOutlined style={{ fontSize: 46, color: "#fff" }} />
          ) : (
            <FilePdfOutlined style={{ fontSize: 46 }} />
          )}
        </div>

        {/* Info */}
        <Row gutter={16} style={{ marginBottom: 12 }}>
          <Col>
            <CalendarOutlined /> <Text>{formatDate(report.uploaded_at)}</Text>
          </Col>
          {/* <Col>
          <InfoCircleOutlined /> <Text>2.4 MB</Text>
        </Col> */}
        </Row>

        <Divider />

        {/* Actions */}
        {!locked ? (
          <>
            {isPdf ? (
              <Button
                block
                icon={<EyeOutlined />}
                onClick={() => handleView(report.file_path)}
              >
                View Report
              </Button>
            ) : (
              <Button
                block
                icon={<DownloadOutlined />}
                onClick={() => handleDownload(report.file_path, report.file_name)}
              >
                Download {type.toUpperCase()}
              </Button>
            )}
          </>
        ) : reason === "payment" ? (
          <Alert
            type="warning"
            showIcon
            message="Payment Pending"
            description="Complete payment to unlock this report"
          />
        ) : reason === "counselling" ? (
          <Alert
            type="warning"
            showIcon
            message="Counselling Session Not Completed"
            description="Please complete your counselling session to unlock this report"
          />
        ) : (
          <>
            {!reviewSubmitted ? (
              <>
                <Alert
                  type="info"
                  showIcon
                  message="Review Required"
                  description="Submit your review to unlock the report"
                  style={{ marginBottom: 12 }}
                />
                <Button
                  block
                  icon={<StarOutlined />}
                  type="primary"
                  onClick={handleReviewRedirect}
                >
                  Submit Review
                </Button>
              </>
            ) : (
              <Alert
                type="info"
                showIcon
                message="Review Submitted"
                description="Waiting for admin verification"
              />
            )}
          </>
        )}
      </Card>
    );
  };



  /* ---------------- PENDING CARD ---------------- */

  const PendingUploadCard = () => (
    <Card
      style={{
        borderRadius: 16,
        boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
        height: "100%",
      }}
    >
      <Row justify="space-between">
        <Title level={5}>Aptitude Test Report</Title>
        <Tag color="orange">Pending Upload</Tag>
      </Row>

      <Divider />

      {/* Preview */}
      <div
        style={{
          height: 220,
          borderRadius: 12,
          background: "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <FilePdfOutlined style={{ fontSize: 46 }} />
      </div>


      <Divider />

      {/* Buttons disabled but UI normal */}
      <Row gutter={10}>
        <Col xs={24} md={12}>
          <Button block icon={<EyeOutlined />} disabled>
            View Report
          </Button>
        </Col>

        <Col xs={24} md={12}>
          <Button block icon={<DownloadOutlined />} disabled>
            Download Report
          </Button>
        </Col>
      </Row>

      <Divider />

      <Alert
        type="info"
        showIcon
        message="Report Not Uploaded Yet"
        description="Your report will appear here once the counsellor uploads it."
      />
    </Card>
  );

  return (
    <div style={{ padding: 16 }}>
      <Title level={2} style={{ textAlign: "center" }}>
        My Reports
      </Title>

      <Text
        type="colorTextSecondary"
        style={{ display: "block", textAlign: "center" }}
      >
        View and manage your assessment reports
      </Text>

      <Divider />

      {loading ? (
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[24, 24]} justify="center">
          {filteredReports?.length > 0 ? (
            filteredReports.map((report) => {
              if (report.report_status === "not_received" || !report.file_path) {
                return (
                  <Col xs={24} md={10} key={report.id}>
                    <PendingUploadCard />
                  </Col>
                );
              }

              const isUnlocked = report.report_status === "received_unlocked";

              const reason =
                report.payment_status !== "fully_paid"
                  ? "payment"
                  : report.booking_status !== "completed"
                    ? "counselling"
                    : report.report_status === "received_locked"
                      ? "review"
                      : null;

              return (
                <Col xs={24} md={10} key={report.id}>
                  <ReportCard
                    report={report}
                    title="Aptitude Test Report"
                    locked={!isUnlocked}
                    reason={reason}
                  />
                </Col>
              );
            })
          ) : (
            <Col xs={24} md={10}>
              <PendingUploadCard />
            </Col>
          )}
        </Row>
      )}
    </div>
  );
};

export default ReportManagement;