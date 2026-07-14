import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Typography,
  Input,
  Select,
  Tag,
  Button,
  Spin,
  Tooltip,
  Pagination,
} from "antd";
import {
  SearchOutlined,
  InboxOutlined,
  LockOutlined,
  DownCircleOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProgramContent,
  fetchStudentCounsellingNotes,
  fetchContentList,
  incrementDownloadCount,
  fetchStudentContent
} from "../../../adminSlices/contentSlice";

const { Title, Text } = Typography;
const { Option } = Select;

const getFileNameFromUrl = (url = "") => {
  try {
    return decodeURIComponent(url.split("/").pop()?.split("?")[0] || "");
  } catch {
    return url.split("/").pop()?.split("?")[0] || "";
  }
};

const getFileExtension = (source = "", fallback = "pdf") => {
  const match = source.match(/\.([a-z0-9]+)($|\?)/i);
  return match?.[1]?.toLowerCase() || fallback;
};

const ContentLibrary = () => {
  const dispatch = useDispatch();
  const { contentList, studentContent, loading } = useSelector((state) => state.content);

  const { studentCounsellingNotes, studentCounsellingNotesLoading } = useSelector((state) => state.content);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [accessLevel, setAccessLevel] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const selectedProgramId = Number(localStorage.getItem("selectedProgramId"));
  const studentPackage = Number(localStorage.getItem("selectedPackageId"));
  const studentStream = Number(localStorage.getItem("selectedStreamId"));
  const studentId = localStorage.getItem("studentId");


  const isFreeUser = !selectedProgramId || !studentPackage;

  // ================= FETCH DATA =================
  useEffect(() => {


    if (isFreeUser) {
      // FREE USER → get all content
      dispatch(fetchContentList());
    } else {
      // PAID USER → get program specific content
      dispatch(fetchProgramContent(selectedProgramId));
      dispatch(fetchStudentContent(studentId));
    }
  }, [dispatch]);

  useEffect(() => {
    if (studentId && selectedProgramId && studentPackage) {
      dispatch(
        fetchStudentCounsellingNotes({
          studentId,
          programId: selectedProgramId,
          packageId: studentPackage,
        })
      );
    }
  }, [
    dispatch,
    studentId,
    selectedProgramId,
    studentPackage,
  ]);



  // ================= PROGRAM CONTENT =================
  // const programContent =
  //   (contentList || [])
  //     .filter((item) => {
  //       if (item.is_draft) return false;

  //       // Apply ONLY for Program Content API
  //       if (!item.is_student_visible) return false;

  //       if (isFreeUser) {
  //         return item.free_content || item.payment_required;
  //       }

  //       // Premium Content
  //       if (item.payment_required) {
  //         if (item.package_details?.length > 0) {
  //           return item.package_details.some(
  //             (pkg) => Number(pkg.id) === Number(studentPackage)
  //           );
  //         }

  //         if (item.program_details?.length > 0) {
  //           return item.program_details.some(
  //             (prog) => Number(prog.id) === Number(selectedProgramId)
  //           );
  //         }

  //         return false;
  //       }

  //       // Free Content
  //       if (item.package_details?.length > 0) {
  //         return item.package_details.some(
  //           (pkg) => Number(pkg.id) === Number(studentPackage)
  //         );
  //       }

  //       if (item.program_details?.length > 0) {
  //         return item.program_details.some(
  //           (prog) => Number(prog.id) === Number(selectedProgramId)
  //         );
  //       }

  //       return false;
  //     })
  //     .map((item) => ({
  //       id: item.id,
  //       title: item.title,
  //       description: item.description,
  //       type: item.type === "video" ? "Video" : "Article",
  //       accessType: item.payment_required ? "Premium" : "Free",
  //       programs: item.program_details?.map((p) => p.name) || [],
  //       viewUrl: item.video_link || item.file_url,
  //       image: item.image,
  //       fileName:
  //         item.file_name || getFileNameFromUrl(item.file_url || ""),
  //     }));

  const programContent = (contentList || [])
    .filter((item) => {
      if (item.is_draft) return false;
      if (!item.is_student_visible) return false;

      // FREE USER
      if (isFreeUser) {
        return item.free_content || item.payment_required;
      }

      const hasPrograms = item.program_details?.length > 0;
      const hasPackages = item.package_details?.length > 0;
      const hasStreams = item.stream_details?.length > 0;

      const programMatch =
        !hasPrograms ||
        item.program_details.some(
          (p) => Number(p.id) === selectedProgramId
        );

      const packageMatch =
        !hasPackages ||
        item.package_details.some(
          (p) => Number(p.id) === studentPackage
        );

      const streamMatch =
        !hasStreams ||
        item.stream_details.some(
          (s) => Number(s.id) === studentStream
        );

      // Program only
      if (hasPrograms && !hasPackages && !hasStreams) {
        return programMatch;
      }

      // Program + Package
      if (hasPrograms && hasPackages && !hasStreams) {
        return programMatch && packageMatch;
      }

      // Program + Package + Stream
      if (hasPrograms && hasPackages && hasStreams) {
        return programMatch && packageMatch && streamMatch;
      }

      // Program + Stream
      if (hasPrograms && !hasPackages && hasStreams) {
        return programMatch && streamMatch;
      }

      // Package only
      if (!hasPrograms && hasPackages && !hasStreams) {
        return packageMatch;
      }

      // Stream only
      if (!hasPrograms && !hasPackages && hasStreams) {
        return streamMatch;
      }

      // Package + Stream
      if (!hasPrograms && hasPackages && hasStreams) {
        return packageMatch && streamMatch;
      }

      // Program + Package empty + Stream empty
      // Hide content that has no mapping at all
      return false;
    })
    .map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      type: item.type === "video" ? "Video" : "Article",
      accessType: item.payment_required ? "Premium" : "Free",
      programs: item.program_details?.map((p) => p.name) || [],
      viewUrl: item.video_link || item.file_url,
      image: item.image,
      fileName:
        item.file_name || getFileNameFromUrl(item.file_url || ""),

      isCounsellorContent: true,
      sender: "Counsellor",
    }));

  // ================= STUDENT CONTENT =================
  const studentContents =
    (studentContent || []).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      type: item.type === "video" ? "Video" : "Article",
      accessType: item.payment_required ? "Premium" : "Free",
      programs: item.program_details?.map((p) => p.name) || [],
      viewUrl: item.video_link || item.file_url,
      image: item.image,
      fileName:
        item.file_name || getFileNameFromUrl(item.file_url || ""),
    }));

  // ================= MERGE BOTH =================
  const transformedData = [
    ...programContent,
    ...studentContents,
  ];


  const getFilePreviewImage = (fileName = "") => {
    const ext = getFileExtension(fileName);

    switch (ext) {
      case "pdf":
        return "https://cdn-icons-png.flaticon.com/512/337/337946.png";

      case "xlsx":
      case "xls":
        return "https://cdn-icons-png.flaticon.com/512/732/732220.png";

      case "doc":
      case "docx":
        return "https://cdn-icons-png.flaticon.com/512/281/281760.png";

      default:
        return "https://cdn-icons-png.flaticon.com/512/2991/2991108.png";
    }
  };

  // console.log("selectedProgramId", selectedProgramId);
  // console.log("studentPackage", studentPackage);
  // console.log("studentCounsellingNotes", studentCounsellingNotes);

  const counsellingNoteCards =
    studentCounsellingNotes
      ?.filter(
        (note) =>
          Number(note.program) === selectedProgramId &&
          Number(note.package) === studentPackage
      )

      ?.flatMap((note) => {
        const files = [
          note.file1,
          note.file2,
          note.file3,
          note.file4,
          note.file5,
        ].filter(Boolean);

        // console.log("note", note);


        return files.map((fileUrl, index) => {
          const fileName = getFileNameFromUrl(fileUrl);
          const extension = getFileExtension(fileName).toUpperCase();

          return {
            id: `note-${note.id}-${index}`,
            title: "Counselling Notes",
            description: `${extension} Document`,
            type: "Article",
            accessType: "Free",
            programs: [],
            viewUrl: fileUrl,
            image: getFilePreviewImage(fileName),
            fileName,
            isCounsellingNote: true,
          };
        });
      }) || [];

  const allContent = [
    ...counsellingNoteCards,
    ...transformedData,
  ];

  // ================= FILTERING =================
  const filteredData = allContent.filter((item) => {
    return (
      item.title?.toLowerCase().includes(search.toLowerCase()) &&
      (type === "All" || item.type === type) &&
      (!accessLevel || item.accessType === accessLevel)
    );
  });

  // ================= PAGINATION =================
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + pageSize
  );

  // ================= VIEW HANDLER =================
  // const handleView = (item) => {
  //   if (item.accessType === "Premium" && !paymentCompleted) return;

  //   if (item.viewUrl) {
  //     window.open(item.viewUrl, "_blank");
  //   }
  // };

  const handleView = (item) => {
    if (item.accessType === "Premium" && !paymentCompleted) return;
    if (!item.viewUrl) return;

    const ext = getFileExtension(item.fileName, "pdf");

    // Videos → open directly
    if (item.type === "Video") {
      window.open(item.viewUrl, "_blank");
      return;
    }

    // PDF → open directly
    if (ext === "pdf") {
      window.open(item.viewUrl, "_blank");
      return;
    }

    // All other file types → do nothing (button is disabled anyway)
  };

  const paymentCompleted =
    localStorage.getItem("paymentCompleted") === "true";


  const handleDownload = async (url, fileName) => {
    try {
      const response = await fetch(url, {
        method: "GET",
      });

      if (!response.ok) throw new Error("Failed to fetch file");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.setAttribute("download", fileName || "downloaded_file"); // Use passed filename or default
      document.body.appendChild(a);
      a.click();
      a.remove();

      // Clean up URL object
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      // console.error("Download error:", err);
    }
  };

  // ====================== handleDownloadClick ======================
  const handleDownloadClick = (item) => {
    // 1️⃣ Increment download count via API
    dispatch(incrementDownloadCount(item.id));

    // 2️⃣ Trigger actual file download
    const extension = getFileExtension(item.fileName || item.viewUrl, "pdf");
    const safeTitle = item.title?.replace(/[\\/:*?"<>|]+/g, "_").replace(/\s+/g, "_");

    handleDownload(
      item.viewUrl,
      item.fileName || `${safeTitle}.${extension}`
    );
  };




  return (
    <div style={{ padding: "20px 0px" }}>
      {/* HEADER */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <Title level={2}>Content Library</Title>
        <Text type="colorTextSecondary">
          Explore free and premium learning resources
        </Text>
      </div>

      {/* FILTERS */}
      <Row gutter={[12, 12]} justify="center" style={{ marginBottom: 32 }}>
        <Col xs={24} sm={24} md={8}>
          <Input
            size="large"
            placeholder="Search content..."
            prefix={<SearchOutlined />}
            allowClear
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </Col>

        <Col xs={24} sm={12} md={4}>
          <Select
            size="large"
            value={type}
            onChange={(val) => {
              setType(val);
              setCurrentPage(1);
            }}
            style={{ width: "100%" }}
          >
            <Option value="All">All Types</Option>
            <Option value="Article">Article</Option>
            <Option value="Video">Video</Option>
          </Select>
        </Col>

        <Col xs={24} sm={12} md={4}>
          <Select
            size="large"
            placeholder="Access Level"
            value={accessLevel}
            allowClear
            onChange={(val) => {
              setAccessLevel(val);
              setCurrentPage(1);
            }}
            style={{ width: "100%" }}
          >
            <Option value="Free">Free</Option>
            <Option value="Premium">Premium</Option>
          </Select>
        </Col>
      </Row>

      {/* LOADING */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 50 }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Row gutter={[24, 24]}>
            {paginatedData.map((item) => {
              const isPdf = getFileExtension(item.fileName || item.viewUrl, "pdf") === "pdf";

              return (
                <Col xs={24} sm={12} md={8} key={item.id}>
                  <Card
                    hoverable
                    style={{
                      borderRadius: 14,
                      height: 420,
                      display: "flex",
                      flexDirection: "column",
                    }}
                    styles={{
                      body: {
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                      },
                    }}
                  >
                    {/* IMAGE */}
                    <div
                      style={{
                        position: "relative",
                        height: 160,
                        borderRadius: 10,
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={
                          item.image
                            ? item.image
                            : "https://via.placeholder.com/400x200?text=Content"
                        }
                        alt={item.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          filter:
                            item.accessType === "Premium" && !paymentCompleted
                              ? "brightness(0.4)"
                              : "none",
                        }}
                      />

                      {item.isCounsellingNote && (
                        <Tag
                          color="cyan"
                          style={{
                            position: "absolute",
                            top: 10,
                            left: 10,
                            fontWeight: 600,
                          }}
                        >
                          Counselling Note
                        </Tag>
                      )}

                      <Tag
                        color={item.accessType === "Free" ? "green" : "gold"}
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          fontWeight: 600,
                        }}
                      >
                        {item.accessType.toUpperCase()}
                      </Tag>

                      {item.accessType === "Premium" && !paymentCompleted && (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(0,0,0,0.6)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                          }}
                        >
                          <LockOutlined
                            style={{ fontSize: 32, marginBottom: 8 }}
                          />
                          Premium Content
                        </div>
                      )}
                    </div>

                    {/* CONTENT */}
                    <div
                      style={{
                        marginTop: 16,
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                      }}
                    >
                      <Title level={5}>{item.title}</Title>

                      <Text
                        type="colorTextSecondary"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          minHeight: 40,
                        }}
                      >
                        {item.description}
                      </Text>

                      {/* PROGRAM TAGS */}
                      <div
                        style={{
                          marginTop: 12,
                          gap: 8,
                          display: "flex",
                          flexWrap: "wrap",
                        }}
                      >
                        {item.programs.slice(0, 2).map((prog) => (
                          <Tag key={prog} color="blue">
                            {prog}
                          </Tag>
                        ))}

                        {item.programs.length > 2 && (
                          <Tooltip title={item.programs.join(", ")}>
                            <Tag color="default" style={{ cursor: "pointer" }}>
                              +{item.programs.length - 2} more
                            </Tag>
                          </Tooltip>
                        )}

                        <Tag color="purple">{item.type}</Tag>
                      </div>

                      {/* BUTTON */}
                      <div
                        style={{
                          marginTop: "auto",
                          display: "flex",
                          justifyContent: "space-between", // space between left and right
                          alignItems: "center",
                        }}
                      >
                        {/* Left side: View Content Button */}
                        {/* Left side: View Content Button */}
                        <Button
                          type="link"
                          disabled={
                            (item.accessType === "Premium" && !paymentCompleted) ||
                            (item.type !== "Video" && getFileExtension(item.fileName, "pdf") !== "pdf")
                          }
                          style={{
                            padding: 0,
                            fontWeight: 600,
                          }}
                          onClick={() => handleView(item)}
                        >
                          {item.accessType === "Premium" && !paymentCompleted
                            ? "Complete Payment to Unlock →"
                            : item.type !== "Video" && getFileExtension(item.fileName, "pdf") !== "pdf"
                              ? "View Not Available →"
                              : "View Content →"}
                        </Button>
                        {/* Right side: Download Button - icon + text, only when content is unlocked and not a video */}
                        {!(item.accessType === "Premium" && !paymentCompleted) &&
                          item.viewUrl &&
                          item.type !== "Video" &&
                          getFileExtension(item.fileName || item.viewUrl, "pdf") !== "pdf" && (
                            <Button
                              type="link"
                              size="small"
                              icon={<DownloadOutlined />}
                              style={{
                                fontWeight: 600,
                                padding: "0 8px",
                                display: "flex",
                                alignItems: "center",
                              }}
                              onClick={(e) => handleDownloadClick(item, e)}
                            >
                              Download
                            </Button>
                          )}
                      </div>
                    </div>
                  </Card>
                </Col>
              );
            })}

            {/* EMPTY */}
            {filteredData.length === 0 && (
              <Col span={24} style={{ textAlign: "center", marginTop: 40 }}>
                <InboxOutlined style={{ fontSize: 48, color: "#9CA3AF" }} />
                <Title level={4} style={{ marginTop: 12 }}>
                  No content found
                </Title>
                <Text type="colorTextSecondary">Try adjusting filters</Text>
              </Col>
            )}
          </Row>

          {/* PAGINATION */}
          {filteredData.length > pageSize && (
            <Row justify="end" style={{ marginTop: 40 }}>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredData.length}
                showSizeChanger
                pageSizeOptions={[5, 10, 20, 50]}
                showLessItems={false}
                onChange={(page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                }}
              />
            </Row>
          )}
        </>
      )}
    </div>
  );
};

export default ContentLibrary;
