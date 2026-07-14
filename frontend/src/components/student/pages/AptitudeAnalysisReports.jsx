// import React, { useState, useEffect, useRef } from "react";
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
//   Spin,
//   message,
// } from "antd";
// import {
//   FilePdfOutlined,
//   LockOutlined,
//   DownloadOutlined,
//   EyeOutlined,
//   CalendarOutlined,
//   StarOutlined,
//   UploadOutlined,
//   FileExcelOutlined,
//   FileWordOutlined,
//   FileOutlined,
// } from "@ant-design/icons";
// import { useNavigate } from "react-router-dom";
// import {
//   fetchCompletedExamReportsByStudent,
//   uploadStudentV2Report,
//   updateStudentV2Report,
// } from "../../../adminSlices/reportSlice";

// const { Title, Text } = Typography;

// /* ─────────────────────────────────────────
//    Helpers
// ───────────────────────────────────────── */
// const formatDate = (date) => {
//   if (!date) return "-";
//   return new Date(date).toLocaleDateString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// };

// const getFileType = (fileName) => {
//   if (!fileName) return "other";
//   const ext = fileName.split(".").pop()?.toLowerCase();
//   if (ext === "pdf") return "pdf";
//   if (["xls", "xlsx"].includes(ext)) return "excel";
//   if (["doc", "docx"].includes(ext)) return "word";
//   return "other";
// };

// const isV1Unlocked = (status) =>
//   status === "received_unlocked" || status === "v1_received_unlocked";

// const FileTypeIcon = ({ fileName, size = 46, color }) => {
//   const type = getFileType(fileName);
//   const style = { fontSize: size, color };
//   if (type === "excel") return <FileExcelOutlined style={{ ...style, color: color || "#217346" }} />;
//   if (type === "word") return <FileWordOutlined style={{ ...style, color: color || "#2b579a" }} />;
//   if (type === "pdf") return <FilePdfOutlined style={{ ...style, color: color || "#e84118" }} />;
//   return <FileOutlined style={style} />;
// };

// /* ─────────────────────────────────────────
//    Shared preview box
// ───────────────────────────────────────── */
// const PreviewBox = ({ locked, fileName }) => (
//   <div
//     style={{
//       height: 180,
//       borderRadius: 12,
//       background: locked ? "linear-gradient(180deg,#020617,#0f172a)" : "#f3f4f6",
//       display: "flex",
//       alignItems: "center",
//       justifyContent: "center",
//       marginBottom: 16,
//     }}
//   >
//     {locked ? (
//       <LockOutlined style={{ fontSize: 46, color: "#fff" }} />
//     ) : (
//       <FileTypeIcon fileName={fileName} />
//     )}
//   </div>
// );

// /* ─────────────────────────────────────────
//    V1 Card
// ───────────────────────────────────────── */
// const V1Card = ({ report, reviewSubmitted, onReviewRedirect }) => {
//   const type = getFileType(report?.file_name);
//   const isPdf = type === "pdf";
//   const locked = !isV1Unlocked(report?.report_status);

//   const handleDownload = async () => {
//     try {
//       const res = await fetch(report.file_path);
//       const blob = await res.blob();
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = report.file_name;
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       window.URL.revokeObjectURL(url);
//     } catch {
//       message.error("Download failed");
//     }
//   };

//   const lockReason =
//     report?.booking_status !== "completed" ? "counselling" : "review";

//   return (
//     <Card style={{ borderRadius: 16, boxShadow: "0 12px 30px rgba(0,0,0,0.08)", height: "100%" }}>
//       <Row justify="space-between" align="middle">
//         <Title level={5} style={{ margin: 0 }}>V1 — Analysis Report</Title>
//         <Tag color={locked ? "red" : "green"}>{locked ? "Locked" : "Unlocked"}</Tag>
//       </Row>
//       <Divider />
//       <PreviewBox locked={locked} fileName={report?.file_name} />
//       <Row style={{ marginBottom: 12 }}>
//         <Col>
//           <CalendarOutlined /> <Text>Uploaded: {formatDate(report?.uploaded_at)}</Text>
//         </Col>
//       </Row>
//       <Divider />
//       {!locked ? (
//         <>
//           {isPdf && (
//             <Button block icon={<EyeOutlined />} style={{ marginBottom: 10 }}
//               onClick={() => window.open(report.file_path, "_blank")}>
//               View Report
//             </Button>
//           )}
//           <Button block icon={<DownloadOutlined />} onClick={handleDownload}>
//             Download {type.toUpperCase()}
//           </Button>
//         </>
//       ) : lockReason === "counselling" ? (
//         <Alert type="warning" showIcon message="Counselling Session Not Completed"
//           description="Please complete your counselling session to unlock this report" />
//       ) : !reviewSubmitted ? (
//         <>
//           <Alert type="info" showIcon message="Review Required"
//             description="Submit your review to unlock the report" style={{ marginBottom: 12 }} />
//           <Button block icon={<StarOutlined />} type="primary" onClick={onReviewRedirect}>
//             Submit Review
//           </Button>
//         </>
//       ) : (
//         <Alert type="info" showIcon message="Review Submitted"
//           description="Waiting for admin verification" />
//       )}
//     </Card>
//   );
// };

// /* ─────────────────────────────────────────
//    V2 Card
//    Key fix: local state drives everything;
//    dispatch is called with {abort: true} so
//    Redux loading flag never flips to true.
// ───────────────────────────────────────── */
// const V2Card = ({ report, v1Unlocked }) => {
//   const dispatch = useDispatch();
//   const fileInputRef = useRef(null);

//   // ── Local state only — never touched by Redux loading ──
//   const [uploading, setUploading] = useState(false);
//   const [localFileName, setLocalFileName] = useState(report?.file_name1 || null);
//   const [localDate, setLocalDate] = useState(report?.uploaded_at1 || null);

//   // Sync when initial report prop arrives (first fetch)
//   useEffect(() => {
//     setLocalFileName(report?.file_name1 || null);
//     setLocalDate(report?.uploaded_at1 || null);
//   }, [report?.file_name1, report?.uploaded_at1]);

//   // hasFile is driven by local state so it updates immediately after upload
//   const hasFile = !!localFileName || !!report?.file_path1 ||
//     report?.report_status_v2 === "v2_received_unlocked";

//   const studentId = localStorage.getItem("studentId");

//   const handleFileChange = async (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     const allowed = [
//       "application/pdf",
//       "application/msword",
//       "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//       "application/vnd.ms-excel",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//     ];
//     if (!allowed.includes(file.type)) {
//       message.error("Only PDF, Word, or Excel files are allowed");
//       if (fileInputRef.current) fileInputRef.current.value = "";
//       return;
//     }

//     const formData = new FormData();
//     formData.append("file_path1", file);

//     try {
//       setUploading(true); // local spinner only — does NOT touch Redux loading

//       const thunk = hasFile
//         ? updateStudentV2Report({ studentId, formData })
//         : uploadStudentV2Report({ studentId, formData });

//       await dispatch(thunk).unwrap();

//       // Call GET API again
//       await dispatch(
//         fetchCompletedExamReportsByStudent(studentId)
//       ).unwrap();

//       // Update card instantly without any re-fetch
//       setLocalFileName(file.name);
//       setLocalDate(new Date().toISOString());
//       message.success(hasFile ? "File updated successfully" : "File uploaded successfully");
//     } catch (error) {
//       message.error(error?.message || error?.detail || "Upload failed");
//     } finally {
//       setUploading(false);
//       if (fileInputRef.current) fileInputRef.current.value = "";
//     }
//   };

//   const truncateFileName = (fileName, maxLength = 25) => {
//     if (!fileName) return "";
//     return fileName.length > maxLength
//       ? `${fileName.substring(0, maxLength)}...`
//       : fileName;
//   };

//   // ── Locked state ──
//   if (!v1Unlocked) {
//     return (
//       <Card style={{ borderRadius: 16, boxShadow: "0 12px 30px rgba(0,0,0,0.08)", height: "100%" }}>
//         <Row justify="space-between" align="middle">
//           <Title level={5} style={{ margin: 0 }}>V2 — Your College Preference List</Title>
//           <Tag color="red">Locked</Tag>
//         </Row>
//         <Divider />
//         <PreviewBox locked={true} fileName="" />
//         <Divider />
//         <Alert type="info" showIcon message="Locked"
//           description="Your V1 report must be unlocked before you can upload your college preference list." />
//       </Card>
//     );
//   }

//   const displayName = localFileName || report?.file_name1;
//   const displayDate = localDate || report?.uploaded_at1;

//   return (
//     <Card style={{ borderRadius: 16, boxShadow: "0 12px 30px rgba(0,0,0,0.08)", height: "100%" }}>
//       <Row justify="space-between" align="middle">
//         <Title level={5} style={{ margin: 0 }}>V2 — Your College Preference List</Title>
//         <Tag color={hasFile ? "blue" : "orange"}>{hasFile ? "Uploaded" : "Pending Upload"}</Tag>
//       </Row>

//       <Divider />

//       {/* Preview box */}
//       <div style={{
//         height: 180, borderRadius: 12, background: "#f3f4f6",
//         display: "flex", flexDirection: "column", alignItems: "center",
//         justifyContent: "center", marginBottom: 16, gap: 8,
//       }}>
//         {uploading ? (
//           <>
//             <Spin size="large" />
//             <Text type="colorTextSecondary" style={{ fontSize: 12, marginTop: 8 }}>Uploading...</Text>
//           </>
//         ) : hasFile ? (
//           <>
//             <FileTypeIcon fileName={displayName} />
//             <Text
//               type="colorTextSecondary"
//               style={{
//                 fontSize: 12,
//                 maxWidth: "180px",
//                 textAlign: "center",
//                 wordBreak: "break-word",
//               }}
//               title={displayName}
//             >
//               {truncateFileName(displayName, 20)}
//             </Text>
//           </>
//         ) : (
//           <>
//             <FileOutlined style={{ fontSize: 46, color: "#ccc" }} />
//             <Text type="colorTextSecondary" style={{ fontSize: 12 }}>No file uploaded yet</Text>
//           </>
//         )}
//       </div>

//       {hasFile && (
//         <Row style={{ marginBottom: 12 }}>
//           <Col>
//             <CalendarOutlined /> <Text>Uploaded: {formatDate(displayDate)}</Text>
//           </Col>
//         </Row>
//       )}

//       <Divider />

//       <input
//         ref={fileInputRef}
//         type="file"
//         accept=".pdf,.doc,.docx,.xls,.xlsx"
//         style={{ display: "none" }}
//         onChange={handleFileChange}
//       />

//       <Button
//         block
//         type="primary"
//         icon={<UploadOutlined />}
//         loading={uploading}
//         onClick={() => fileInputRef.current?.click()}
//       >
//         {uploading ? "Uploading..." : hasFile ? "Replace File" : "Upload File"}
//       </Button>

//       {!hasFile && (
//         <>
//           <Divider />
//           <Alert type="info" showIcon message="Upload Required"
//             description="Please upload your filled college preference list so the counsellor can prepare your V3 report." />
//         </>
//       )}
//     </Card>
//   );
// };

// /* ─────────────────────────────────────────
//    V3 Card
// ───────────────────────────────────────── */
// const V3Card = ({ report }) => {
//   const hasFile = !!report?.file_path2;
//   const type = getFileType(report?.file_name2);
//   const isPdf = type === "pdf";
//   const locked = report?.report_status_v3 === "v3_received_locked";

//   const handleDownload = async () => {
//     try {
//       const res = await fetch(report.file_path2);
//       const blob = await res.blob();
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = report.file_name2;
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       window.URL.revokeObjectURL(url);
//     } catch {
//       message.error("Download failed");
//     }
//   };

//   if (!hasFile) {
//     return (
//       <Card style={{ borderRadius: 16, boxShadow: "0 12px 30px rgba(0,0,0,0.08)", height: "100%" }}>
//         <Row justify="space-between" align="middle">
//           <Title level={5} style={{ margin: 0 }}>V3 — Final Report</Title>
//           <Tag color="orange">Pending Upload</Tag>
//         </Row>
//         <Divider />
//         <div style={{
//           height: 180, borderRadius: 12, background: "#f3f4f6",
//           display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16
//         }}>
//           <FilePdfOutlined style={{ fontSize: 46, color: "#ccc" }} />
//         </div>
//         <Divider />
//         <Alert type="info" showIcon message="Report Not Uploaded Yet"
//           description="Your final report will appear here once the counsellor uploads it." />
//       </Card>
//     );
//   }

//   return (
//     <Card style={{ borderRadius: 16, boxShadow: "0 12px 30px rgba(0,0,0,0.08)", height: "100%" }}>
//       <Row justify="space-between" align="middle">
//         <Title level={5} style={{ margin: 0 }}>V3 — Final Report</Title>
//         <Tag color={locked ? "red" : "green"}>{locked ? "Locked" : "Unlocked"}</Tag>
//       </Row>
//       <Divider />
//       <PreviewBox locked={locked} fileName={report?.file_name2} />
//       <Row style={{ marginBottom: 12 }}>
//         <Col>
//           <CalendarOutlined /> <Text>Uploaded: {formatDate(report?.uploaded_at2)}</Text>
//         </Col>
//       </Row>
//       <Divider />
//       {locked ? (
//         <Alert type="warning" showIcon message="Report Locked"
//           description="This report is currently locked. Please contact your counsellor." />
//       ) : (
//         <>
//           {isPdf && (
//             <Button block icon={<EyeOutlined />} style={{ marginBottom: 10 }}
//               onClick={() => window.open(report.file_path2, "_blank")}>
//               View Report
//             </Button>
//           )}
//           <Button block icon={<DownloadOutlined />} onClick={handleDownload}>
//             Download {type.toUpperCase()}
//           </Button>
//         </>
//       )}
//     </Card>
//   );
// };

// /* ─────────────────────────────────────────
//    Main page
//    NOTE: uploadStudentV2Report and updateStudentV2Report
//    are excluded from the global loading flag in the slice
//    so they don't trigger the full-page spinner.
// ───────────────────────────────────────── */
// const AptitudeAnalysisReports = () => {
//   const [reviewSubmitted, setReviewSubmitted] = useState(false);
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   const { reports, loading } = useSelector((state) => state.reports);

//   useEffect(() => {
//     const studentId = localStorage.getItem("studentId");
//     if (studentId) dispatch(fetchCompletedExamReportsByStudent(studentId));
//   }, [dispatch]);

//   useEffect(() => {
//     if (reports?.length > 0) {
//       localStorage.setItem("report_status", reports[0].report_status);
//     }
//   }, [reports]);

//   const selectedProgramId = localStorage.getItem("selectedProgramId");
//   const selectedPackageId = localStorage.getItem("selectedPackageId");
//   const selectedProgramIdNum = selectedProgramId ? Number(selectedProgramId) : null;
//   const selectedPackageIdNum = selectedPackageId ? Number(selectedPackageId) : null;

//   const filteredReports = reports?.filter((r) => {
//     if (!selectedProgramIdNum || !selectedPackageIdNum) return false;
//     return (
//       Number(r.program_id) === selectedProgramIdNum &&
//       Number(r.package_id) === selectedPackageIdNum
//     );
//   });

//   const report = filteredReports?.[0] || null;
//   const v1Exists = !!report && !!report.file_path && report.report_status !== "not_received";
//   const v1Unlocked = isV1Unlocked(report?.report_status);
//   const v2Exists = report?.report_status_v2 === "v2_received_unlocked" || !!report?.file_path1;
//   const v3Exists = v2Exists;

//   return (
//     <div style={{ padding: 16 }}>
//       <Title level={2} style={{ textAlign: "center" }}>My Reports</Title>
//       <Text type="colorTextSecondary" style={{ display: "block", textAlign: "center" }}>
//         View and manage your assessment reports
//       </Text>
//       <Divider />

//       {loading ? (
//         <div style={{ textAlign: "center", marginTop: 40 }}>
//           <Spin size="large" />
//         </div>
//       ) : (
//         <Row gutter={[24, 24]} justify="center">

//           <Col xs={24} md={8}>
//             {v1Exists ? (
//               <V1Card
//                 report={report}
//                 reviewSubmitted={reviewSubmitted}
//                 onReviewRedirect={() => navigate("/student/write-review")}
//               />
//             ) : (
//               <Card style={{ borderRadius: 16, boxShadow: "0 12px 30px rgba(0,0,0,0.08)", height: "100%" }}>
//                 <Row justify="space-between" align="middle">
//                   <Title level={5} style={{ margin: 0 }}>V1 — Analysis Report</Title>
//                   <Tag color="orange">Pending Upload</Tag>
//                 </Row>
//                 <Divider />
//                 <div style={{
//                   height: 180, borderRadius: 12, background: "#f3f4f6",
//                   display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16
//                 }}>
//                   <FilePdfOutlined style={{ fontSize: 46, color: "#ccc" }} />
//                 </div>
//                 <Divider />
//                 <Alert type="info" showIcon message="Report Not Uploaded Yet"
//                   description="Your V1 report will appear here once the counsellor uploads it." />
//               </Card>
//             )}
//           </Col>

//           <Col xs={24} md={8}>
//             <V2Card report={report} v1Unlocked={v1Unlocked} />
//           </Col>

//           {v2Exists && (
//             <Col xs={24} md={8}>
//               <V3Card report={report} />
//             </Col>
//           )}

//         </Row>
//       )}
//     </div>
//   );
// };

// export default AptitudeAnalysisReports;









import React, { useState, useEffect, useRef } from "react";
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
  message,
} from "antd";
import {
  FilePdfOutlined,
  LockOutlined,
  DownloadOutlined,
  EyeOutlined,
  CalendarOutlined,
  StarOutlined,
  UploadOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  FileOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  fetchCompletedExamReportsByStudent,
  uploadStudentV2Report,
  updateStudentV2Report,
} from "../../../adminSlices/reportSlice";

const { Title, Text } = Typography;

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getFileType = (fileName) => {
  if (!fileName) return "other";
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (["xls", "xlsx"].includes(ext)) return "excel";
  if (["doc", "docx"].includes(ext)) return "word";
  return "other";
};

/*
  V1 is considered "received/unlocked" if backend sends any of:
    - new: "v1_received"
    - old (backward compat): "v1_received_unlocked" | "received_unlocked"
*/
const isV1Received = (status) =>
  status === "v1_received" ||
  status === "v1_received_unlocked" ||
  status === "received_unlocked";

/*
  V2 is considered received if backend sends any of:
    - new: "v2_received"
    - old (backward compat): "v2_received_unlocked"
*/
const isV2Received = (status) =>
  status === "v2_received" ||
  status === "v2_received_unlocked";

/*
  V3 is locked only when explicitly marked locked.
  new: "v3_received" means unlocked/accessible.
  old backward compat: "v3_received_locked" means locked.
*/
const isV3Locked = (status) =>
  status === "v3_received_locked"; // new "v3_received" = unlocked, so no lock

const FileTypeIcon = ({ fileName, size = 46, color }) => {
  const type = getFileType(fileName);
  const style = { fontSize: size, color };
  if (type === "excel") return <FileExcelOutlined style={{ ...style, color: color || "#217346" }} />;
  if (type === "word") return <FileWordOutlined style={{ ...style, color: color || "#2b579a" }} />;
  if (type === "pdf") return <FilePdfOutlined style={{ ...style, color: color || "#e84118" }} />;
  return <FileOutlined style={style} />;
};

/* ─────────────────────────────────────────
   Shared preview box
───────────────────────────────────────── */
const PreviewBox = ({ locked, fileName }) => (
  <div
    style={{
      height: 180,
      borderRadius: 12,
      background: locked ? "linear-gradient(180deg,#020617,#0f172a)" : "#f3f4f6",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    }}
  >
    {locked ? (
      <LockOutlined style={{ fontSize: 46, color: "#fff" }} />
    ) : (
      <FileTypeIcon fileName={fileName} />
    )}
  </div>
);

/* ─────────────────────────────────────────
   V1 Card
───────────────────────────────────────── */
const V1Card = ({ report, reviewSubmitted, onReviewRedirect }) => {
  const type = getFileType(report?.file_name);
  const isPdf = type === "pdf";
  // locked when V1 has NOT been received/unlocked yet
  const locked = !isV1Received(report?.report_status);

  const handleDownload = async () => {
    try {
      const res = await fetch(report.file_path);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = report.file_name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      message.error("Download failed");
    }
  };

  const lockReason =
    report?.booking_status !== "completed" ? "counselling" : "review";

  return (
    <Card style={{ borderRadius: 16, boxShadow: "0 12px 30px rgba(0,0,0,0.08)", height: "100%" }}>
      <Row justify="space-between" align="middle">
        <Title level={5} style={{ margin: 0 }}>
          V1 — Analysis Report
        </Title>

        <div>
          <Tag color="blue">
            Updates: {report?.file_path_count || 0}
          </Tag>

          <Tag color={locked ? "red" : "green"}>
            {locked ? "Locked" : "Unlocked"}
          </Tag>
        </div>
      </Row>
      <Divider />
      <PreviewBox locked={locked} fileName={report?.file_name} />
      <Row style={{ marginBottom: 12 }}>
        <Col>
          <CalendarOutlined /> <Text>Uploaded: {formatDate(report?.uploaded_at)}</Text>
        </Col>
      </Row>
      <Divider />
      {!locked ? (
        <>
          {isPdf && (
            <Button block icon={<EyeOutlined />} style={{ marginBottom: 10 }}
              onClick={() => window.open(report.file_path, "_blank")}>
              View Report
            </Button>
          )}
          <Button block icon={<DownloadOutlined />} onClick={handleDownload}>
            Download {type.toUpperCase()}
          </Button>
        </>
      ) : lockReason === "counselling" ? (
        <Alert type="warning" showIcon message="Counselling Session Not Completed"
          description="Please complete your counselling session to unlock this report" />
      ) : !reviewSubmitted ? (
        <>
          <Alert type="info" showIcon message="Review Required"
            description="Submit your review to unlock the report" style={{ marginBottom: 12 }} />
          <Button block icon={<StarOutlined />} type="primary" onClick={onReviewRedirect}>
            Submit Review
          </Button>
        </>
      ) : (
        <Alert type="info" showIcon message="Review Submitted"
          description="Waiting for admin verification" />
      )}
    </Card>
  );
};

/* ─────────────────────────────────────────
   V2 Card
───────────────────────────────────────── */
const V2Card = ({ report, v1Received }) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [localFileName, setLocalFileName] = useState(report?.file_name1 || null);
  const [localDate, setLocalDate] = useState(report?.uploaded_at1 || null);

  useEffect(() => {
    setLocalFileName(report?.file_name1 || null);
    setLocalDate(report?.uploaded_at1 || null);
  }, [report?.file_name1, report?.uploaded_at1]);

  // hasFile: local state first, then fall back to API fields
  const hasFile =
    !!localFileName ||
    !!report?.file_path1 ||
    isV2Received(report?.report_status_v2);

  const studentId = localStorage.getItem("studentId") || report?.student_id;

  const handleFileChange = async (e) => {
    const studentId = localStorage.getItem("studentId");
const programId = localStorage.getItem("selectedProgramId");
const packageId = localStorage.getItem("selectedPackageId");

    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (!allowed.includes(file.type)) {
      message.error("Only PDF, Word, or Excel files are allowed");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file_path1", file);

    try {
      setUploading(true);

      const thunk = hasFile
        ? updateStudentV2Report({ studentId, programId, packageId, formData })
        : uploadStudentV2Report({ studentId, programId, packageId, formData });

      await dispatch(thunk).unwrap();
      await dispatch(fetchCompletedExamReportsByStudent(studentId)).unwrap();

      setLocalFileName(file.name);
      setLocalDate(new Date().toISOString());
      message.success(hasFile ? "File updated successfully" : "File uploaded successfully");
    } catch (error) {
      message.error(error?.message || error?.detail || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const truncateFileName = (fileName, maxLength = 25) => {
    if (!fileName) return "";
    return fileName.length > maxLength
      ? `${fileName.substring(0, maxLength)}...`
      : fileName;
  };

  // ── Locked state — V1 not yet received ──
  if (!v1Received) {
    return (
      <Card style={{ borderRadius: 16, boxShadow: "0 12px 30px rgba(0,0,0,0.08)", height: "100%" }}>
        <Row justify="space-between" align="middle">
          <Title level={5} style={{ margin: 0 }}>V2 — Your College Preference List</Title>
          <Tag color="red">Locked</Tag>
        </Row>
        <Divider />
        <PreviewBox locked={true} fileName="" />
        <Divider />
        <Alert type="info" showIcon message="Locked"
          description="Your V1 report must be unlocked before you can upload your college preference list." />
      </Card>
    );
  }

  const displayName = localFileName || report?.file_name1;
  const displayDate = localDate || report?.uploaded_at1;

  return (
    <Card style={{ borderRadius: 16, boxShadow: "0 12px 30px rgba(0,0,0,0.08)", height: "100%" }}>
      <Row justify="space-between" align="middle">
        <Title level={5} style={{ margin: 0 }}>V2 — Your College Preference List</Title>
        <div>
          <Tag color="purple">
            Updates: {report?.file_path1_count || 0}
          </Tag>

          <Tag color={hasFile ? "blue" : "orange"}>
            {hasFile ? "Uploaded" : "Pending Upload"}
          </Tag>
        </div>
      </Row>

      <Divider />

      <div style={{
        height: 180, borderRadius: 12, background: "#f3f4f6",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", marginBottom: 16, gap: 8,
      }}>
        {uploading ? (
          <>
            <Spin size="large" />
            <Text type="colorTextSecondary" style={{ fontSize: 12, marginTop: 8 }}>Uploading...</Text>
          </>
        ) : hasFile ? (
          <>
            <FileTypeIcon fileName={displayName} />
            <Text
              type="colorTextSecondary"
              style={{ fontSize: 12, maxWidth: "180px", textAlign: "center", wordBreak: "break-word" }}
              title={displayName}
            >
              {truncateFileName(displayName, 20)}
            </Text>
          </>
        ) : (
          <>
            <FileOutlined style={{ fontSize: 46, color: "#ccc" }} />
            <Text type="colorTextSecondary" style={{ fontSize: 12 }}>No file uploaded yet</Text>
          </>
        )}
      </div>

      {/* {hasFile && (
        <Row style={{ marginBottom: 12 }}>
          <Col>
            <CalendarOutlined /> <Text>Uploaded: {formatDate(displayDate)}</Text>
          </Col>
        </Row>
      )} */}

      <Divider />

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <Button
        block
        type="primary"
        icon={<UploadOutlined />}
        loading={uploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? "Uploading..." : hasFile ? "Replace File" : "Upload File"}
      </Button>

      {!hasFile && (
        <>
          <Divider />
          <Alert type="info" showIcon message="Upload Required"
            description="Please upload your filled college preference list so the counsellor can prepare your V3 report." />
        </>
      )}
    </Card>
  );
};

/* ─────────────────────────────────────────
   V3 Card
───────────────────────────────────────── */
const V3Card = ({ report }) => {
  const hasFile = !!report?.file_path2;
  const type = getFileType(report?.file_name2);
  const isPdf = type === "pdf";
  // new: "v3_received" = unlocked; old "v3_received_locked" = locked
  const locked = isV3Locked(report?.report_status_v3);

  const handleDownload = async () => {
    try {
      const res = await fetch(report.file_path2);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = report.file_name2;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      message.error("Download failed");
    }
  };

  if (!hasFile) {
    return (
      <Card style={{ borderRadius: 16, boxShadow: "0 12px 30px rgba(0,0,0,0.08)", height: "100%" }}>
        <Row justify="space-between" align="middle">
          <Title level={5} style={{ margin: 0 }}>V3 — Final Report</Title>
          <Tag color="orange">Pending Upload</Tag>
        </Row>
        <Divider />
        <div style={{
          height: 180, borderRadius: 12, background: "#f3f4f6",
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
        }}>
          <FilePdfOutlined style={{ fontSize: 46, color: "#ccc" }} />
        </div>
        <Divider />
        <Alert type="info" showIcon message="Report Not Uploaded Yet"
          description="Your final report will appear here once the counsellor uploads it." />
      </Card>
    );
  }

  return (
    <Card style={{ borderRadius: 16, boxShadow: "0 12px 30px rgba(0,0,0,0.08)", height: "100%" }}>
      <Row justify="space-between" align="middle">
        <Title level={5} style={{ margin: 0 }}>V3 — Final Report</Title>
        <div>
          <Tag color="cyan">
            Updates: {report?.file_path2_count || 0}
          </Tag>

          <Tag color={locked ? "red" : "green"}>
            {locked ? "Locked" : "Unlocked"}
          </Tag>
        </div>
      </Row>
      <Divider />
      <PreviewBox locked={locked} fileName={report?.file_name2} />
      {/* <Row style={{ marginBottom: 12 }}>
        <Col>
          <CalendarOutlined /> <Text>Uploaded: {formatDate(report?.uploaded_at2)}</Text>
        </Col>
      </Row> */}
      <Divider />
      {locked ? (
        <Alert type="warning" showIcon message="Report Locked"
          description="This report is currently locked. Please contact your counsellor." />
      ) : (
        <>
          {isPdf && (
            <Button block icon={<EyeOutlined />} style={{ marginBottom: 10 }}
              onClick={() => window.open(report.file_path2, "_blank")}>
              View Report
            </Button>
          )}
          <Button block icon={<DownloadOutlined />} onClick={handleDownload}>
            Download {type.toUpperCase()}
          </Button>
        </>
      )}
    </Card>
  );
};

/* ─────────────────────────────────────────
   Main page
───────────────────────────────────────── */
const AptitudeAnalysisReports = () => {
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { reports, loading } = useSelector((state) => state.reports);
  const { uploadingReportId } = useSelector(
    (state) => state.reports
  );

  useEffect(() => {
    const studentId = localStorage.getItem("studentId");
    if (studentId) dispatch(fetchCompletedExamReportsByStudent(studentId));
  }, [dispatch]);

  useEffect(() => {
    if (reports?.length > 0) {
      localStorage.setItem("report_status", reports[0].report_status);
    }
  }, [reports]);

  const selectedProgramId = localStorage.getItem("selectedProgramId");
  const selectedPackageId = localStorage.getItem("selectedPackageId");
  const selectedProgramIdNum = selectedProgramId ? Number(selectedProgramId) : null;
  const selectedPackageIdNum = selectedPackageId ? Number(selectedPackageId) : null;

  const filteredReports = reports?.filter((r) => {
    if (!selectedProgramIdNum || !selectedPackageIdNum) return false;
    return (
      Number(r.program_id) === selectedProgramIdNum &&
      Number(r.package_id) === selectedPackageIdNum
    );
  });

  const report = filteredReports?.[0] || null;

  // V1 exists if file is present and status is not "not_received"
  const v1Exists = !!report && !!report.file_path && report.report_status !== "not_received";
  // V1 is accessible (unlocked) — drives V2 lock state
  const v1Received = isV1Received(report?.report_status);
  // V2 exists (student has uploaded) — drives V3 card visibility
  const v2Exists = isV2Received(report?.report_status_v2) || !!report?.file_path1;

  return (
    <div style={{ padding: 16 }}>
      <Title level={2} style={{ textAlign: "center" }}>My Reports</Title>
      <Text type="colorTextSecondary" style={{ display: "block", textAlign: "center" }}>
        View and manage your assessment reports
      </Text>
      <Divider />

      {loading ? (
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[24, 24]} justify="center">

          {/* V1 */}
          <Col xs={24} md={8}>
            {v1Exists ? (
              <V1Card
                report={report}
                reviewSubmitted={reviewSubmitted}
                onReviewRedirect={() => navigate("/student/write-review")}
              />
            ) : (
              <Card style={{ borderRadius: 16, boxShadow: "0 12px 30px rgba(0,0,0,0.08)", height: "100%" }}>
                <Row justify="space-between" align="middle">
                  <Title level={5} style={{ margin: 0 }}>V1 — Analysis Report</Title>
                  <Tag color="orange">Pending Upload</Tag>
                </Row>
                <Divider />
                <div style={{
                  height: 180, borderRadius: 12, background: "#f3f4f6",
                  display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
                }}>
                  <FilePdfOutlined style={{ fontSize: 46, color: "#ccc" }} />
                </div>
                <Divider />
                <Alert type="info" showIcon message="Report Not Uploaded Yet"
                  description="Your V1 report will appear here once the counsellor uploads it." />
              </Card>
            )}
          </Col>

          {/* V2 — always rendered; locked state handled inside */}
          <Col xs={24} md={8}>
            <V2Card loading={uploadingReportId === (localStorage.getItem("studentId") || report?.student_id)} report={report} v1Received={v1Received} />
          </Col>

          {/* V3 — shown only after V2 is uploaded */}
          {v2Exists && (
            <Col xs={24} md={8}>
              <V3Card report={report} />
            </Col>
          )}

        </Row>
      )}
    </div>
  );
};

export default AptitudeAnalysisReports;