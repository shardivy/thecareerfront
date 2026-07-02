// // src/components/counsellor/modals/SessionNotesModal.jsx

// import React, { useState, useEffect } from "react";
// import {
//   Row,
//   Col,
//   Card,
//   Typography,
//   Input,
//   Button,
//   Divider,
//   Tag,
//   message,
//   Avatar,
//   Upload,
//   Empty,
//   Grid,
//   Space,
// } from "antd";
// import {
//   UserOutlined,
//   CalendarOutlined,
//   ClockCircleOutlined,
//   UploadOutlined,
//   FileImageOutlined,
//   FilePdfOutlined,
//   DownloadOutlined,
// } from "@ant-design/icons";
// import dayjs from "dayjs";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   createCounsellingNote,
//   updateCounsellingNote,
//   deleteCounsellingFile
// } from "../../../adminSlices/counsellorSlice";
// import { fetchStudentContent } from "../../../adminSlices/contentSlice";
// import jsPDF from "jspdf";
// import UploadContentModal from "../../counsellor/modals/UploadContentModal";
// import { stream } from "xlsx";

// const { Title, Text } = Typography;
// const { TextArea } = Input;
// const { useBreakpoint } = Grid;

// const SessionNotesModal = ({ session, onClose, isViewMode = false, hideSessionDetails = false, showStudentName = false }) => {

//   const screens = useBreakpoint();

//   const [discussion, setDiscussion] = useState("");
//   const [uploadedFiles, setUploadedFiles] = useState([]);
//   const [editMode, setEditMode] = useState(false);
//   const [contentModalOpen, setContentModalOpen] = useState(false);

//   const dispatch = useDispatch();

//   const notesState = useSelector((state) => state.counsellors.notes || {});
//   const { studentContent, loading } = useSelector((state) => state.content);

//   const capitalizeName = (name) => {
//     if (!name) return "";
//     return name
//       .split(" ")
//       .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
//       .join(" ");
//   };

//   const cleanFileName = (url) => {
//     if (!url) return "file";

//     let name = url.split("/").pop();

//     // remove query params if any
//     name = name.split("?")[0];

//     // truncate long names
//     if (name.length > 25) {
//       const ext = name.split(".").pop();
//       name = name.substring(0, 18) + "..." + ext;
//     }

//     return name;
//   };

//   /* LOAD NOTES */
//   useEffect(() => {
//     if (session?.id && notesState[session.id]) {
//       const note = notesState[session.id];

//       setDiscussion(note.notes || "");

//       // ✅ Use the parsed file_urls array from Redux
//       const filesArray = note.file_urls || [];

//       setUploadedFiles(
//         filesArray.map((file, index) => ({
//           name: cleanFileName(file.url) || `File-${index + 1}`,
//           url: file.url,
//           type:
//             file.url.endsWith(".pdf")
//               ? "application/pdf"
//               : file.url.match(/\.(jpg|jpeg|png|gif)$/i)
//                 ? "image/*"
//                 : file.url.match(/\.(doc|docx)$/i)
//                   ? "word"
//                   : file.url.match(/\.(xls|xlsx)$/i)
//                     ? "excel"
//                     : "other",
//           key: file.key, // store backend key
//         }))
//       );

//       // allow editing if note exists
//       setEditMode(true);

//     } else {
//       setDiscussion("");
//       setUploadedFiles([]);
//       setEditMode(true); // allow adding notes
//     }
//   }, [notesState, session]);

//   /* SESSION DATA */
//   const sessionData = session
//     ? {
//       studentName: session.studentName || "N/A",
//       email: session.studentEmail || "N/A",
//       phone: session.studentPhone || "N/A",
//       programId: session.programId || "",
//       programName: session.programName || "N/A",
//       packageId: session.packageId || "",
//       packageName: session.packageName || "N/A",

//       counsellorList: Array.isArray(session.counsellorList)
//         ? session.counsellorList.map((c) => capitalizeName(c.counsellor_name))
//         : [],

//       date: session.date ? dayjs(session.date).format("DD-MM-YYYY") : "N/A",
//       time: session.slot_time || `${session.startTime}`,
//       status: session.status || "N/A",
//       id: session.id,
//       // stream: session.stream,
//       student_id: session.student_id
//     }
//     : {};

//   const noteExists =
//     !!notesState?.[session?.id]?.notes?.trim() ||
//     (notesState?.[session?.id]?.file_urls?.length || 0) > 0;

//   /* DOWNLOAD PDF */
//   const downloadTextNotes = () => {

//     const pdf = new jsPDF();

//     const pageWidth = pdf.internal.pageSize.getWidth();

//     pdf.setFontSize(16);
//     pdf.text("Session Notes", pageWidth / 2, 20, { align: "center" });

//     pdf.setFontSize(12);

//     pdf.text(`Session ID: ${sessionData.id}`, 10, 40);
//     pdf.text(`Student: ${sessionData.studentName}`, 10, 50);
//     // pdf.text(`Counsellor: ${sessionData.counsellorName}`, 10, 60);
//     pdf.text(`Date: ${sessionData.date}`, 10, 70);
//     pdf.text(`Time: ${sessionData.time}`, 10, 80);

//     pdf.text("Discussion:", 10, 100);

//     const splitText = pdf.splitTextToSize(
//       discussion || "No notes added",
//       180
//     );

//     pdf.text(splitText, 10, 110);

//     pdf.save(`Session-${sessionData.id}-Notes.pdf`);

//   };

//   /* FILE UPLOAD */
//   const uploadProps = {

//     multiple: true,

//     beforeUpload: (file) => {
//       const isAllowed =
//         file.type === "application/pdf" ||
//         file.type.startsWith("image/") ||

//         // ✅ ADD THESE
//         file.type === "application/msword" || // .doc
//         file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || // .docx
//         file.type === "application/vnd.ms-excel" || // .xls
//         file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"; // .xlsx

//       if (!isAllowed) {
//         message.error("Only PDF, Image, Word, and Excel files allowed!");
//         return Upload.LIST_IGNORE;
//       }

//       const fileUrl = URL.createObjectURL(file);

//       setUploadedFiles((prev) => [
//         ...prev,
//         {
//           name: file.name,
//           url: fileUrl,
//           type: file.type,
//           originFileObj: file,
//         },
//       ]);

//       return false;
//     },
//     showUploadList: false,
//     accept: "application/pdf,image/*,.doc,.docx,.xls,.xlsx",

//   };

//   /* REMOVE FILE */

//   const handleRemoveFile = async (index) => {
//     const file = uploadedFiles[index];
//     const existingNote = notesState?.[session?.id];

//     // If it's a newly uploaded file, remove locally
//     if (file.originFileObj) {
//       URL.revokeObjectURL(file.url);
//       const newFiles = [...uploadedFiles];
//       newFiles.splice(index, 1);
//       setUploadedFiles(newFiles);
//       return;
//     }

//     // If it's an existing file from server, call API to delete
//     if (existingNote?.id && file.key) {
//       try {
//         await dispatch(
//           deleteCounsellingFile({
//             bookingId: session.id,
//             noteId: existingNote.id,
//             fileKey: file.key, // 👈 use correct key from server
//           })
//         ).unwrap();

//         message.success("File deleted successfully");

//         const newFiles = [...uploadedFiles];
//         newFiles.splice(index, 1);
//         setUploadedFiles(newFiles);

//       } catch {
//         message.error("Failed to delete file");
//       }
//     }
//   };

//   const handleSave = async () => {
//     const formData = new FormData();
//     formData.append("notes", discussion);
//     formData.append("program", session?.programId);
//     formData.append("package", session?.packageId);

//     // Only append NEW uploaded files
//     uploadedFiles.slice(0, 5).forEach((file, index) => {
//       if (file.originFileObj) {
//         // New uploaded file
//         formData.append(`file${index + 1}`, file.originFileObj);
//       }
//     });

//     const existingNote = notesState?.[session?.id];

//     try {
//       if (existingNote?.id) {
//         await dispatch(
//           updateCounsellingNote({
//             bookingId: session.id,
//             noteId: existingNote.id,
//             payload: formData,
//           })
//         ).unwrap();

//         message.success("Notes updated successfully");
//       } else {
//         await dispatch(
//           createCounsellingNote({
//             bookingId: session.id,
//             payload: formData,
//           })
//         ).unwrap();

//         message.success("Notes saved successfully");
//       }

//       onClose();
//     } catch {
//       message.error("Failed to save notes");
//     }
//   };

//   useEffect(() => {
//     if (sessionData?.student_id) {
//       dispatch(fetchStudentContent(sessionData.student_id));
//     }
//   }, [dispatch, sessionData?.student_id]);

//   return (
//     <div style={{ padding: screens.xs ? 10 : 20 }}>

//       {/* HEADER */}
//       <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
//         <Title level={screens.xs ? 5 : 4} style={{ margin: 0 }}>
//           Session Notes
//           {showStudentName && sessionData.studentName
//             ? ` (${sessionData.studentName})`
//             : ""}
//         </Title>

//         <Tag color="green">{sessionData.status}</Tag>
//       </Row>

//       <div style={{ maxHeight: "75vh", overflowY: "auto", paddingRight: 8 }}>
//         <Row gutter={[16, 16]}>

//           {/* LEFT PANEL */}
//           {!hideSessionDetails && (
//             <Col xs={24} md={8}>
//               <Card bordered>

//                 <div style={{ textAlign: "center", marginBottom: 16 }}>
//                   <Avatar size={80} icon={<UserOutlined />} />

//                   <Title level={5} style={{ marginTop: 10 }}>
//                     {sessionData.studentName}
//                   </Title>

//                   <Text type="colorTextSecondary">{sessionData.email}</Text>
//                 </div>

//                 <Divider />

//                 <Space direction="vertical">

//                   <div>
//                     <Text strong>Mobile:</Text>
//                     <br />
//                     {sessionData.phone}
//                   </div>
//                   <div>
//                     <Text strong>Program:</Text>
//                     <br />
//                     {sessionData.programName}
//                   </div>

//                   <div>
//                     <Text strong>Service:</Text>
//                     <br />
//                     {sessionData.packageName}
//                   </div>
//                   <div>
//                     <Text strong>Counsellor:</Text>
//                     <br />
//                     {sessionData.counsellorList.length > 0 ? (
//                       sessionData.counsellorList.map((name, index) => (
//                         <div key={index}>{name}</div>
//                       ))
//                     ) : (
//                       <span>N/A</span>
//                     )}
//                   </div>


//                   <div>
//                     <CalendarOutlined /> {sessionData.date}
//                   </div>

//                   <div>
//                     <ClockCircleOutlined /> {sessionData.time}
//                   </div>


//                 </Space>

//               </Card>
//             </Col>
//           )}

//           {/* RIGHT PANEL */}
//           <Col xs={24} md={hideSessionDetails ? 24 : 16}>
//             <Card bordered>

//               <Title level={5}>Discussion Notes</Title>

//               {noteExists && (
//                 <div style={{ textAlign: "right", marginBottom: 10 }}>
//                   <Button icon={<DownloadOutlined />} onClick={downloadTextNotes}>
//                     Download Notes
//                   </Button>
//                 </div>
//               )}

//               {(!isViewMode || editMode || !noteExists) && (
//                 <TextArea
//                   rows={8}
//                   value={discussion}
//                   readOnly={isViewMode && !editMode && noteExists}
//                   placeholder="Enter discussion notes..."
//                   onChange={(e) => setDiscussion(e.target.value)}
//                 />
//               )}

//               {/* FILE UPLOAD */}
//               {(!isViewMode || editMode || !noteExists) && (
//                 <>
//                   <Divider />

//                   <Space>
//                     <Upload {...uploadProps}>
//                       <Button icon={<UploadOutlined />}>
//                         Upload From Local
//                       </Button>
//                     </Upload>

//                     <Button
//                       type="default"
//                       icon={<UploadOutlined />}
//                       onClick={() => setContentModalOpen(true)}
//                     >
//                       Upload From Content Library
//                     </Button>
//                   </Space>
//                 </>
//               )}

//               {/* FILE LIST */}
//               <div style={{ marginTop: 15 }}>

//                 {uploadedFiles.length === 0 && isViewMode && !editMode && (
//                   <Empty description="No files uploaded" />
//                 )}

//                 {uploadedFiles.map((file, index) => (

//                   <div
//                     key={index}
//                     style={{
//                       display: "flex",
//                       justifyContent: "space-between",
//                       background: "#f6f6f6",
//                       padding: 10,
//                       borderRadius: 6,
//                       marginBottom: 8,
//                     }}
//                   >

//                     <div style={{ display: "flex", gap: 8 }}>

//                       {file.type === "application/pdf" ? (
//                         <FilePdfOutlined style={{ color: "red" }} />
//                       ) : (
//                         <FileImageOutlined style={{ color: "green" }} />
//                       )}

//                       {file.name}

//                     </div>

//                     <Space wrap>

//                       <Button
//                         size="small"
//                         onClick={() => window.open(file.url)}
//                       >
//                         Preview
//                       </Button>

//                       {/* <Button
//                       size="small"
//                       icon={<DownloadOutlined />}
//                       onClick={() => {

//                         const link = document.createElement("a");
//                         link.href = file.url;
//                         link.download = file.name;
//                         link.click();

//                       }}
//                     >
//                       Download
//                     </Button> */}

//                       {(!isViewMode || editMode || !noteExists) && (
//                         <Button
//                           size="small"
//                           danger
//                           onClick={() => handleRemoveFile(index)}
//                         >
//                           Remove
//                         </Button>
//                       )}

//                     </Space>

//                   </div>

//                 ))}

//               </div>

//               {/* ACTIONS */}
//               {/* ACTIONS - aligned right */}
//               <div style={{ marginTop: 24, textAlign: "right" }}>
//                 {(!isViewMode || editMode || !noteExists) && (
//                   <Button type="primary" onClick={handleSave} style={{ marginRight: 8 }}>
//                     {noteExists ? "Update Notes" : "Add Notes"}
//                   </Button>
//                 )}
//                 <Button onClick={onClose}>Close</Button>
//               </div>

//             </Card>
//           </Col>


//           <UploadContentModal
//             open={contentModalOpen}
//             onCancel={() => setContentModalOpen(false)}
//             studentContent={studentContent}
//             studentInfo={{
//               student_id: sessionData.student_id,
//               name: sessionData.studentName,
//               email: sessionData.email,
//               mobile: sessionData.phone,
//               programId: sessionData.programId,
//               programName: sessionData.programName,
//               packageId: sessionData.packageId,
//               packageName: sessionData.packageName,
//               // streamName: sessionData.streamName,
//             }}
//             onSubmit={(content) => {
//               console.log("Selected Content:", content);

//               // Add selected content to uploaded files list
//               setUploadedFiles((prev) => [
//                 ...prev,
//                 {
//                   name: content.title,
//                   url: content.file_url,
//                   type: "application/pdf",
//                 },
//               ]);

//               setContentModalOpen(false);
//             }}
//           />

//         </Row>
//       </div>
//     </div>
//   );
// };

// export default SessionNotesModal;




// src/components/counsellor/modals/SessionNotesModal.jsx

import React, { useState, useEffect, useMemo } from "react";
import {
  Row,
  Col,
  Card,
  Typography,
  Input,
  Button,
  Divider,
  Tag,
  message,
  Avatar,
  Upload,
  Empty,
  Grid,
  Space,
} from "antd";
import {
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UploadOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  DownloadOutlined,
  CheckCircleFilled,
  EditOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import {
  createCounsellingNote,
  updateCounsellingNote,
  deleteCounsellingFile
} from "../../../adminSlices/counsellorSlice";
import { fetchStudentContent } from "../../../adminSlices/contentSlice";
import jsPDF from "jspdf";
import UploadContentModal from "../../counsellor/modals/UploadContentModal";
// import { stream } from "xlsx";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

const SessionNotesModal = ({ session, onClose, isViewMode = false, hideSessionDetails = false, showStudentName = false }) => {

  const screens = useBreakpoint();

  const [discussion, setDiscussion] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [lastStreamIds, setLastStreamIds] = useState([]);

  const dispatch = useDispatch();

  const notesState = useSelector((state) => state.counsellors.notes || {});
  const { studentContent, loading } = useSelector((state) => state.content);

  const capitalizeName = (name) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const cleanFileName = (url) => {
    if (!url) return "file";

    let name = url.split("/").pop();

    // remove query params if any
    name = name.split("?")[0];

    // truncate long names
    if (name.length > 25) {
      const ext = name.split(".").pop();
      name = name.substring(0, 18) + "..." + ext;
    }

    return name;
  };

  /* LOAD NOTES */
  useEffect(() => {
    if (session?.id && notesState[session.id]) {
      const note = notesState[session.id];

      setDiscussion(note.notes || "");

      // ✅ Use the parsed file_urls array from Redux
      const filesArray = note.file_urls || [];

      setUploadedFiles(
        filesArray.map((file, index) => ({
          name: cleanFileName(file.url) || `File-${index + 1}`,
          url: file.url,
          type:
            file.url.endsWith(".pdf")
              ? "application/pdf"
              : file.url.match(/\.(jpg|jpeg|png|gif)$/i)
                ? "image/*"
                : file.url.match(/\.(doc|docx)$/i)
                  ? "word"
                  : file.url.match(/\.(xls|xlsx)$/i)
                    ? "excel"
                    : "other",
          key: file.key, // store backend key
        }))
      );

      // allow editing if note exists
      setEditMode(true);

    } else {
      setDiscussion("");
      setUploadedFiles([]);
      setEditMode(true); // allow adding notes
    }
  }, [notesState, session]);

  /* SESSION DATA */
  const sessionData = session
    ? {
      studentName: session.studentName || "N/A",
      email: session.studentEmail || "N/A",
      phone: session.studentPhone || "N/A",
      programId: session.programId || "",
      programName: session.programName || "N/A",
      packageId: session.packageId || "",
      packageName: session.packageName || "N/A",

      counsellorList: Array.isArray(session.counsellorList)
        ? session.counsellorList.map((c) => capitalizeName(c.counsellor_name))
        : [],

      date: session.date ? dayjs(session.date).format("DD-MM-YYYY") : "N/A",
      time: session.slot_time || `${session.startTime}`,
      status: session.status || "N/A",
      id: session.id,
      // stream: session.stream,
      student_id: session.student_id
    }
    : {};

  const noteExists =
    !!notesState?.[session?.id]?.notes?.trim() ||
    (notesState?.[session?.id]?.file_urls?.length || 0) > 0;

  /* DOWNLOAD PDF */
  const downloadTextNotes = () => {

    const pdf = new jsPDF();

    const pageWidth = pdf.internal.pageSize.getWidth();

    pdf.setFontSize(16);
    pdf.text("Session Notes", pageWidth / 2, 20, { align: "center" });

    pdf.setFontSize(12);

    pdf.text(`Session ID: ${sessionData.id}`, 10, 40);
    pdf.text(`Student: ${sessionData.studentName}`, 10, 50);
    // pdf.text(`Counsellor: ${sessionData.counsellorName}`, 10, 60);
    pdf.text(`Date: ${sessionData.date}`, 10, 70);
    pdf.text(`Time: ${sessionData.time}`, 10, 80);

    pdf.text("Discussion:", 10, 100);

    const splitText = pdf.splitTextToSize(
      discussion || "No notes added",
      180
    );

    pdf.text(splitText, 10, 110);

    pdf.save(`Session-${sessionData.id}-Notes.pdf`);

  };

  /* FILE UPLOAD */
  const uploadProps = {

    multiple: true,

    beforeUpload: (file) => {
      const isAllowed =
        file.type === "application/pdf" ||
        file.type.startsWith("image/") ||

        // ✅ ADD THESE
        file.type === "application/msword" || // .doc
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || // .docx
        file.type === "application/vnd.ms-excel" || // .xls
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"; // .xlsx

      if (!isAllowed) {
        message.error("Only PDF, Image, Word, and Excel files allowed!");
        return Upload.LIST_IGNORE;
      }

      const fileUrl = URL.createObjectURL(file);

      setUploadedFiles((prev) => [
        ...prev,
        {
          name: file.name,
          url: fileUrl,
          type: file.type,
          originFileObj: file,
        },
      ]);

      return false;
    },
    showUploadList: false,
    accept: "application/pdf,image/*,.doc,.docx,.xls,.xlsx",

  };

  /* REMOVE FILE */

  const handleRemoveFile = async (index) => {
    const file = uploadedFiles[index];
    const existingNote = notesState?.[session?.id];

    // If it's a newly uploaded file, remove locally
    if (file.originFileObj) {
      URL.revokeObjectURL(file.url);
      const newFiles = [...uploadedFiles];
      newFiles.splice(index, 1);
      setUploadedFiles(newFiles);
      return;
    }

    // If it's an existing file from server, call API to delete
    if (existingNote?.id && file.key) {
      try {
        await dispatch(
          deleteCounsellingFile({
            bookingId: session.id,
            noteId: existingNote.id,
            fileKey: file.key, 
          })
        ).unwrap();

        message.success("File deleted successfully");

        const newFiles = [...uploadedFiles];
        newFiles.splice(index, 1);
        setUploadedFiles(newFiles);

      } catch {
        message.error("Failed to delete file");
      }
    }
  };

  const handleSave = async () => {
    const formData = new FormData();
    formData.append("notes", discussion);
    formData.append("program", session?.programId);
    formData.append("package", session?.packageId);

    // Only append NEW uploaded files
    uploadedFiles.slice(0, 5).forEach((file, index) => {
      if (file.originFileObj) {
        // New uploaded file
        formData.append(`file${index + 1}`, file.originFileObj);
      }
    });

    const existingNote = notesState?.[session?.id];

    try {
      if (existingNote?.id) {
        await dispatch(
          updateCounsellingNote({
            bookingId: session.id,
            noteId: existingNote.id,
            payload: formData,
          })
        ).unwrap();

        message.success("Notes updated successfully");
      } else {
        await dispatch(
          createCounsellingNote({
            bookingId: session.id,
            payload: formData,
          })
        ).unwrap();

        message.success("Notes saved successfully");
      }

      onClose();
    } catch {
      message.error("Failed to save notes");
    }
  };

  useEffect(() => {
    if (sessionData?.student_id) {
      dispatch(fetchStudentContent(sessionData.student_id));
    }
  }, [dispatch, sessionData?.student_id]);

  useEffect(() => {
    setLastStreamIds([]);
  }, [sessionData?.student_id]);

  const uploadStudentInfo = useMemo(
    () => ({
      student_id: sessionData.student_id,
      name: sessionData.studentName,
      email: sessionData.email,
      mobile: sessionData.phone,
      programId: sessionData.programId,
      programName: sessionData.programName,
      packageId: sessionData.packageId,
      packageName: sessionData.packageName,
      streamId:
        lastStreamIds.length > 0
          ? lastStreamIds
          : (studentContent?.stream?.map((s) => s.id) || []),
    }),
    [
      sessionData.student_id,
      sessionData.studentName,
      sessionData.email,
      sessionData.phone,
      sessionData.programId,
      sessionData.programName,
      sessionData.packageId,
      sessionData.packageName,
      lastStreamIds,
      studentContent,
    ]
  );

  const hasAssignedContent =
    studentContent?.contents?.length > 0;

  return (
    <div style={{ padding: screens.xs ? 10 : 20 }}>

      {/* HEADER */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Title level={screens.xs ? 5 : 4} style={{ margin: 0 }}>
          Session Notes
          {showStudentName && sessionData.studentName
            ? ` (${sessionData.studentName})`
            : ""}
        </Title>

        <Tag color="green">{sessionData.status}</Tag>
      </Row>

      <div style={{ maxHeight: "75vh", overflowY: "auto", paddingRight: 8 }}>
        <Row gutter={[16, 16]}>

          {/* LEFT PANEL */}
          {!hideSessionDetails && (
            <Col xs={24} md={8}>
              <Card bordered>

                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <Avatar size={80} icon={<UserOutlined />} />

                  <Title level={5} style={{ marginTop: 10 }}>
                    {sessionData.studentName}
                  </Title>

                  <Text type="colorTextSecondary">{sessionData.email}</Text>
                </div>

                <Divider />

                <Space direction="vertical">

                  <div>
                    <Text strong>Mobile:</Text>
                    <br />
                    {sessionData.phone}
                  </div>
                  <div>
                    <Text strong>Program:</Text>
                    <br />
                    {sessionData.programName}
                  </div>

                  <div>
                    <Text strong>Service:</Text>
                    <br />
                    {sessionData.packageName}
                  </div>
                  <div>
                    <Text strong>Counsellor:</Text>
                    <br />
                    {sessionData.counsellorList.length > 0 ? (
                      sessionData.counsellorList.map((name, index) => (
                        <div key={index}>{name}</div>
                      ))
                    ) : (
                      <span>N/A</span>
                    )}
                  </div>


                  <div>
                    <CalendarOutlined /> {sessionData.date}
                  </div>

                  <div>
                    <ClockCircleOutlined /> {sessionData.time}
                  </div>


                </Space>

              </Card>
            </Col>
          )}

          {/* RIGHT PANEL */}
          <Col xs={24} md={hideSessionDetails ? 24 : 16}>
            <Card bordered>

              <Title level={5}>Discussion Notes</Title>

              {noteExists && (
                <div style={{ textAlign: "right", marginBottom: 10 }}>
                  <Button icon={<DownloadOutlined />} onClick={downloadTextNotes}>
                    Download Notes
                  </Button>
                </div>
              )}

              {(!isViewMode || editMode || !noteExists) && (
                <TextArea
                  rows={8}
                  value={discussion}
                  readOnly={isViewMode && !editMode && noteExists}
                  placeholder="Enter discussion notes..."
                  onChange={(e) => setDiscussion(e.target.value)}
                />
              )}

              {/* FILE UPLOAD */}
              {(!isViewMode || editMode || !noteExists) && (
                <>
                  <Divider />

                  <Space>
                    <Upload {...uploadProps}>
                      <Button icon={<UploadOutlined />}>
                        Upload From Local
                      </Button>
                    </Upload>

                    {hasAssignedContent ? (
                      <>


                        <Button
                          type="primary"
                          icon={<EditOutlined />}
                          onClick={() => setContentModalOpen(true)}
                        >
                          Manage From Content Library
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="primary"
                        icon={<UploadOutlined />}
                        onClick={() => setContentModalOpen(true)}
                      >
                        Upload From Content Library
                      </Button>
                    )}

                    {/* <Button
                      type="default"
                      icon={<UploadOutlined />}
                      onClick={() => setContentModalOpen(true)}
                    >
                      Upload From Content Library
                    </Button> */}
                  </Space>
                </>
              )}

              {/* FILE LIST */}
              <div style={{ marginTop: 15 }}>

                {uploadedFiles.length === 0 && isViewMode && !editMode && (
                  <Empty description="No files uploaded" />
                )}

                {uploadedFiles.map((file, index) => (

                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      background: "#f6f6f6",
                      padding: 10,
                      borderRadius: 6,
                      marginBottom: 8,
                    }}
                  >

                    <div style={{ display: "flex", gap: 8 }}>

                      {file.type === "application/pdf" ? (
                        <FilePdfOutlined style={{ color: "red" }} />
                      ) : (
                        <FileImageOutlined style={{ color: "green" }} />
                      )}

                      {file.name}

                    </div>

                    <Space wrap>

                      <Button
                        size="small"
                        onClick={() => window.open(file.url)}
                      >
                        Preview
                      </Button>

                      {/* <Button
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={() => {

                        const link = document.createElement("a");
                        link.href = file.url;
                        link.download = file.name;
                        link.click();

                      }}
                    >
                      Download
                    </Button> */}

                      {(!isViewMode || editMode || !noteExists) && (
                        <Button
                          size="small"
                          danger
                          onClick={() => handleRemoveFile(index)}
                        >
                          Remove
                        </Button>
                      )}

                    </Space>

                  </div>

                ))}

              </div>

              {/* ACTIONS */}
                     <div style={{ marginTop: 24, textAlign: "right" }}>
                {(!isViewMode || editMode || !noteExists) && (
                  <Button type="primary" onClick={handleSave} style={{ marginRight: 8 }}>
                    {noteExists ? "Update Notes" : "Add Notes"}
                  </Button>
                )}
                <Button onClick={onClose}>Close</Button>
              </div>

            </Card>
          </Col>


          <UploadContentModal
            open={contentModalOpen}
            onCancel={() => setContentModalOpen(false)}
            studentContent={studentContent}
            studentInfo={uploadStudentInfo}
            onSubmit={(content, streamIds) => {
              // console.log("Selected Content:", content);

              if (streamIds && streamIds.length > 0) {
                setLastStreamIds(streamIds);
              }

              if (sessionData?.student_id) {
                dispatch(fetchStudentContent(sessionData.student_id));
              }

              // Add selected content to uploaded files list
              // setUploadedFiles((prev) => [
              //   ...prev,
              //   {
              //     name: content.title,
              //     url: content.file_url,
              //     type: "application/pdf",
              //   },
              // ]);

              setContentModalOpen(false);
            }}
          />

        </Row>
      </div>
    </div>
  );
};

export default SessionNotesModal;