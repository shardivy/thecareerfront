// src/components/counsellor/modals/UploadContentModal.jsx

import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Select,
  Row,
  Col,
  Card,
  Typography,
  Avatar,
  Divider,
  Space,
  Tag,
  Button,
  Empty,
  Spin,
  Checkbox,
  Input,
  Pagination,
  Badge,
  Grid,
  message,
} from "antd";
import {
  GlobalOutlined,
  UserOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  FileImageOutlined,
  FileUnknownOutlined,
  VideoCameraOutlined,
  SearchOutlined,
  CheckCircleFilled,
  EyeOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import adminTheme from "../../../theme/adminTheme";
import { fetchActivePrograms } from "../../../adminSlices/programSlice";
import { fetchStreams } from "../../../adminSlices/streamSlice";
import { fetchPackagesByProgram, clearPackages } from "../../../adminSlices/packageSlice";
import { fetchFilteredContent, assignStreamContent, updateStreamContent, clearFilteredContent } from "../../../adminSlices/contentSlice";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const ALL_PROGRAM_VALUE = "__ALL__";
const PAGE_SIZE = 6;

/* ---------------- HELPERS ---------------- */
const getDocumentUrl = (item = {}) => {
  let url =
    item.file_url ||
    item.file ||
    item.document_url ||
    item.document ||
    "";

  if (!url) return "";

  // Fix old incorrect urls
  if (url.includes("/api/content-file/")) {
    url = url.replace(
      "/api/content-file/",
      "/api/content/content-file/"
    );
  }

  return url;
};
const getFileExtension = (fileName = "") => {
  const match = fileName.match(/\.([a-z0-9]+)$/i);
  return match?.[1]?.toLowerCase() || "";
};


const getFileMeta = (item) => {
  if (item.type === "video") {
    return { icon: <VideoCameraOutlined />, color: "#1677ff", bg: "#e6f4ff", label: "Video" };
  }

  const ext = getFileExtension(item.file_name || getDocumentUrl(item));

  if (ext === "pdf") {
    return { icon: <FilePdfOutlined />, color: "#cf1322", bg: "#fff1f0", label: "PDF" };
  }
  if (["xls", "xlsx", "csv"].includes(ext)) {
    return { icon: <FileExcelOutlined />, color: "#389e0d", bg: "#f6ffed", label: "Excel" };
  }
  if (["doc", "docx"].includes(ext)) {
    return { icon: <FileWordOutlined />, color: "#1677ff", bg: "#e6f4ff", label: "Word" };
  }
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    return { icon: <FileImageOutlined />, color: "#d46b08", bg: "#fff7e6", label: "Image" };
  }
  return { icon: <FileUnknownOutlined />, color: "#595959", bg: "#f5f5f5", label: "Document" };
};

const UploadContentModal = ({
  open,
  onCancel,
  onSubmit,
  initialValues,
  viewMode = false,
  studentInfo,
  studentContent,
}) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { token } = adminTheme;
  const screens = useBreakpoint();
  const isMobile = !screens.md; 

  const { activeList: programs, loading: programLoading } = useSelector((state) => state.programs);
  const { list: packages, loading: packageLoading } = useSelector((state) => state.packages);
  const { streamList, loading: streamsLoading } = useSelector((state) => state.streams);
  const { contentList, loading: contentLoading, assignLoading, updateLoading } = useSelector((state) => state.content);

  const [selectedPrograms, setSelectedPrograms] = useState([]);
  const [selectedContentIds, setSelectedContentIds] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const selectedPackage = Form.useWatch("package", form);
  const selectedStream = Form.useWatch("stream", form);

  const isSingleSpecificProgram =
    selectedPrograms.length === 1 && !selectedPrograms.includes(ALL_PROGRAM_VALUE);

  const hasExistingAssignment = !!(
    studentContent?.contents && studentContent.contents.length > 0
  );


  useEffect(() => {
    if (open) {
      dispatch(fetchActivePrograms());
      dispatch(fetchStreams());
    }
  }, [open, dispatch]);

  useEffect(() => {
    if (
      open &&
      studentContent?.contents &&
      studentContent.contents.length > 0
    ) {
      const assignedIds = studentContent.contents.map(
        (item) => item.id
      );

      setSelectedContentIds(assignedIds);
    }
  }, [open, studentContent]);

  useEffect(() => {
    if (!open) return;

    // form.resetFields();
    dispatch(clearPackages());
    // setSelectedContentIds([]);
    setSearchText("");
    setCurrentPage(1);

    const prefilledProgramValues =
      initialValues?.program_details?.map((p) => p.id) ||
      (studentInfo?.programId ? [studentInfo.programId] : []);

    let packageValue = null;

    if (initialValues?.package_details?.length > 0) {
      packageValue = initialValues.package_details[0].id;
    } else if (studentInfo?.packageId) {
      packageValue = studentInfo.packageId;
    }

    form.setFieldsValue({
      program: prefilledProgramValues,
      package: packageValue,
      stream:
        initialValues?.stream?.stream_id ||
        initialValues?.stream_id ||
        (studentInfo?.streamId?.length > 0 ? studentInfo.streamId : null),
     });

    setSelectedPrograms(prefilledProgramValues);

    if (prefilledProgramValues.length === 1) {
      dispatch(fetchPackagesByProgram(prefilledProgramValues[0]));
    } else {
      dispatch(clearPackages());
    }
  }, [
    open,
    initialValues,
    studentInfo?.student_id,
    studentInfo?.programId,
    studentInfo?.packageId,
    studentInfo?.streamId,
    dispatch,
    form,
  ]);


  // Auto-trigger search if stream ids are already set when modal opens
  useEffect(() => {
    if (!open) return;

    const streamIds = studentInfo?.streamId;
    const programId = studentInfo?.programId;
    const packageId = studentInfo?.packageId;

    if (
      streamIds && streamIds.length > 0 &&
      programId &&
      packageId
    ) {
      dispatch(
        fetchFilteredContent({
          programId,
          packageId,
          streamIds,
        })
      );
    }
  }, [
    open,
    studentInfo?.streamId,
    studentInfo?.programId,
    studentInfo?.packageId,
    dispatch,
  ]);

  const handleSearchContent = () => {
    const programId = selectedPrograms?.[0];

    if (!programId) {
      return message.warning("Program is required");
    }

    if (!selectedPackage) {
      return message.warning("Counselling Service is required");
    }

    if (!selectedStream || selectedStream.length === 0) {
      return message.warning("Please select at least one stream");
    }

    dispatch(
      fetchFilteredContent({
        programId,
        packageId: selectedPackage,
        streamIds: selectedStream,
      })
    );
  };

  const handleStreamChange = (value) => {
    form.setFieldsValue({ stream: value });

    setSelectedContentIds([]);
    setSearchText("");
    setCurrentPage(1);

    // If stream is cleared
    if (!value || value.length === 0) {
      dispatch(clearFilteredContent());
    }
  };

  /* Reset pagination + search when filters change */
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPackage, searchText]);

  const handleProgramChange = (values) => {
    setSelectedContentIds([]);

    if (values.includes(ALL_PROGRAM_VALUE)) {
      const allProgramIds = programs.map((p) => p.id);
      form.setFieldsValue({ program: allProgramIds, package: null, stream: null });
      setSelectedPrograms(allProgramIds);
      dispatch(clearPackages());
      return;
    }

    const hadAllPrograms = selectedPrograms.includes(ALL_PROGRAM_VALUE);
    if (hadAllPrograms) {
      form.setFieldsValue({ program: [], package: null, stream: null });
      setSelectedPrograms([]);
      dispatch(clearPackages());
      return;
    }

    setSelectedPrograms(values);
    form.setFieldsValue({ package: null, stream: null });

    if (values.length === 1) {
      dispatch(fetchPackagesByProgram(values[0]));
    } else {
      dispatch(clearPackages());
    }
  };

  // const filteredContent = (contentList || []).filter((item) => {
  //   const search = searchText.toLowerCase().trim();

  //   return (
  //     item.title?.toLowerCase().includes(search) ||
  //     item.category?.toLowerCase().includes(search) ||
  //     item.type?.toLowerCase().includes(search)
  //   );
  // });

  // IDs already assigned to this student — excluded from the filtered/available list
  const assignedContentIds = new Set(
    (studentContent?.contents || []).map((item) => item.id)
  );

  const filteredContent = (contentList || []).filter((item) => {
    // Hide items already shown in the "Already Assigned" section above
    if (assignedContentIds.has(item.id)) return false;

    const search = searchText.toLowerCase().trim();
    return (
      item.title?.toLowerCase().includes(search) ||
      item.category?.toLowerCase().includes(search) ||
      item.type?.toLowerCase().includes(search)
    );
  });

  const paginatedContent = filteredContent.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const toggleContent = (id) => {
    setSelectedContentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const buildAssignPayload = () => {
    // From assigned section: only include if still checked
    const checkedAssignedItems = (studentContent?.contents || []).filter(
      (item) => selectedContentIds.includes(item.id)
    );

    // From filtered/available section: only newly selected (non-assigned)
    const newlySelectedItems = filteredContent.filter((item) =>
      selectedContentIds.includes(item.id)
    );

    // Merge, dedupe by id
    const allItemsMap = new Map();
    [...checkedAssignedItems, ...newlySelectedItems].forEach((item) => {
      allItemsMap.set(item.id, item);
    });
    const allSelectedItems = Array.from(allItemsMap.values());

    return {
      selectedItems: allSelectedItems,
      payload: {
        student_id: studentInfo?.student_id,
        program_id: studentInfo?.programId,
        package_id: studentInfo?.packageId,
        stream_id: selectedStream,
        content_ids: allSelectedItems.map((item) => item.id),
      },
    };
  };

  const handleAssign = async () => {
    try {
      const { selectedItems, payload } = buildAssignPayload();

      // console.log("Assign Payload:", payload);

      const result = await dispatch(
        assignStreamContent(payload)
      ).unwrap();

      message.success(
        result?.message || "Content assigned successfully"
      );

      onSubmit?.(selectedItems, selectedStream);
      onCancel();
    } catch (error) {
      message.error(
        error?.message || "Failed to assign content"
      );
    }
  };

  const handleUpdateAssign = async () => {
    try {
      const { selectedItems, payload } = buildAssignPayload();

      // console.log("Update Payload:", payload);

      const result = await dispatch(
        updateStreamContent(payload)
      ).unwrap();

      message.success(
        result?.message || "Content updated successfully"
      );

      onSubmit?.(selectedItems, selectedStream);
      onCancel();
    } catch (error) {
      message.error(
        error?.message || "Failed to update content"
      );
    }
  };

  /* ---------------- PREVIEW: OPEN IN NEW TAB ---------------- */
  const handlePreviewClick = (item, e) => {
    e.stopPropagation();

    const url =
      item.type === "video"
        ? item.video_link
        : getDocumentUrl(item);

    // console.log("Item:", item);
    // console.log("Opening:", url);

    if (!url) {
      message.error("No file found");
      return;
    }

    window.open(url, "_blank");
  };


  return (
    <Modal
      title="Assign Content"
      open={open}
      centered
      onCancel={onCancel}
      destroyOnClose
      width={isMobile ? "94%" : 1200}
      style={isMobile ? { top: 8 } : undefined}
      bodyStyle={{ padding: 0 }}
      footer={
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
            justifyContent: "flex-end",
            gap: isMobile ? 8 : 12,
          }}
        >
          <Text
            style={{
              marginRight: isMobile ? 0 : "auto",
              color: token.colorTextSecondary,
              textAlign: isMobile ? "center" : "left",
              fontSize: isMobile ? 12 : 14,
            }}
          >
            {selectedContentIds.length > 0
              ? `${selectedContentIds.length} item${selectedContentIds.length > 1 ? "s" : ""} selected`
              : "No content selected"}
          </Text>

          <div style={{ display: "flex", gap: 8, width: isMobile ? "100%" : "auto" }}>
            <Button onClick={onCancel} block={isMobile} style={{ flex: isMobile ? 1 : "initial" }}>
              Close
            </Button>
            <Button
              type="primary"
              disabled={selectedContentIds.length === 0}
              loading={hasExistingAssignment ? updateLoading : assignLoading}
              onClick={hasExistingAssignment ? handleUpdateAssign : handleAssign}
              block={isMobile}
              style={{ flex: isMobile ? 1 : "initial" }}
            >
              {hasExistingAssignment ? "Update Selected" : "Assign Selected"}
            </Button>
          </div>
        </div>
      }
    >
      {/* Scrollable body; footer above stays fixed outside this */}
      <div
        style={{
          maxHeight: isMobile ? "72vh" : "75vh",
          overflowY: "auto",
          padding: isMobile ? 12 : 24,
        }}
      >
        <Row gutter={[16, 16]}>
          {/* LEFT PANEL - Student Info */}
          <Col xs={24} md={8}>
            <Card bordered>
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <Avatar size={80} icon={<UserOutlined />} />

                <Title level={5} style={{ marginTop: 10 }}>
                  {studentInfo?.name || "N/A"}
                </Title>

                <Text type="colorTextSecondary">
                  {studentInfo?.email || "N/A"}
                </Text>
              </div>

              <Divider />

              <Space direction="vertical">
                <div>
                  <Text strong>Mobile:</Text>
                  <br />
                  {studentInfo?.mobile || "N/A"}
                </div>

                <div>
                  <Text strong>Program:</Text>
                  <br />
                  {studentInfo?.programName || "N/A"}
                </div>

                <div>
                  <Text strong>Service:</Text>
                  <br />
                  {studentInfo?.packageName || "N/A"}
                </div>


              </Space>
            </Card>
          </Col>

          {/* RIGHT PANEL - Filters + Content List */}
          <Col xs={24} md={16}>
            <Card bordered style={{ borderRadius: 12 }} bodyStyle={{ padding: isMobile ? 14 : 24 }}>
              <Title level={5} style={{ marginBottom: 12 }}>
                Filter Content
              </Title>

              <Form form={form} layout="vertical">
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Program"
                      name="program"
                      style={{ marginBottom: 12 }}
                    >
                      <Select
                        mode="multiple"
                        disabled
                        value={selectedPrograms}
                      >
                        {programs.map((program) => (
                          <Option key={program.id} value={program.id}>
                            {program.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Counselling Service"
                      name="package"
                      style={{ marginBottom: 12 }}
                    >
                      <Select
                        disabled
                        value={form.getFieldValue("package")}
                        loading={packageLoading}
                      >
                        {packages.map((pkg) => (
                          <Option key={pkg.id} value={pkg.id}>
                            {pkg.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                {isSingleSpecificProgram && (
                  <Row gutter={16} align="bottom">
                    <Col xs={24} md={18}>
                      <Form.Item
                        label="Stream"
                        name="stream"
                        style={{ marginBottom: 0 }}
                      >
                        <Select
                          mode="multiple"
                          placeholder="Select Stream(s)"
                          allowClear
                          value={selectedStream}
                          loading={streamsLoading}
                          onChange={handleStreamChange}
                        >
                          {streamList.map((stream) => (
                            <Option key={stream.id} value={stream.id}>
                              {stream.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={6}>
                      <Button
                        type="primary"
                        icon={<SearchOutlined />}
                        loading={contentLoading}
                        onClick={handleSearchContent}
                        block
                      >
                        Search
                      </Button>
                    </Col>
                  </Row>
                )}
              </Form>

              <Divider style={{ margin: "12px 0" }} />

              <Row gutter={[8, 8]} align="middle" style={{ marginBottom: 12 }}>
                <Col xs={24} sm={12}>
                  <Title level={5} style={{ margin: 0 }}>
                    Available Content{" "}
                    {filteredContent.length > 0 && (
                      <Badge
                        count={filteredContent.length}
                        style={{ backgroundColor: token.colorPrimary, marginLeft: 4 }}
                      />
                    )}
                  </Title>
                </Col>
                {isSingleSpecificProgram && filteredContent.length > 0 && (
                  <Col xs={24} sm={12}>
                    <Input
                      placeholder="Search by title"
                      prefix={<SearchOutlined />}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      allowClear
                      style={{ width: "100%" }}
                    />
                  </Col>
                )}
              </Row>

              {!isSingleSpecificProgram ? (
                <Empty description="Select a single program to view available content" />
              ) : contentLoading ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <Spin />
                </div>
              ) : (
                <>
                  {/* Fixed-height scroll area so card doesn't grow unbounded */}
                  <div
                    style={{
                      maxHeight: isMobile ? 320 : 420,
                      overflowY: "auto",
                      paddingRight: 6,
                    }}
                  >
                    {/* ALREADY ASSIGNED CONTENT - shown at top */}
                    {studentContent?.contents && studentContent.contents.length > 0 && (
                      <>
                        <Text
                          strong
                          style={{
                            display: "block",
                            marginBottom: 8,
                            color: token.colorPrimary,
                            fontSize: 13,
                          }}
                        >
                          Already Assigned ({studentContent.contents.length})
                        </Text>
                        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                          {studentContent.contents.map((item) => {
                            const meta = getFileMeta(item);
                            const isChecked = selectedContentIds.includes(item.id);

                            return (
                              <Col xs={24} md={12} key={`assigned-${item.id}`}>
                                <Card
                                  hoverable
                                  onClick={() => toggleContent(item.id)}
                                  bodyStyle={{
                                    padding: 12,
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                  }}
                                  style={{
                                    minHeight: 170,
                                    borderRadius: 10,
                                    border: isChecked
                                      ? `2px solid ${token.colorPrimary}`
                                      : `1px solid ${token.colorBorder}`,
                                    background: isChecked ? token.colorPrimaryBg : "#fff",
                                  }}
                                >
                                  {/* Top */}
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: 42,
                                        height: 42,
                                        borderRadius: 8,
                                        background: meta.bg,
                                        color: meta.color,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 20,
                                      }}
                                    >
                                      {meta.icon}
                                    </div>
                                    <Checkbox
                                      checked={isChecked}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={() => toggleContent(item.id)}
                                    />
                                  </div>

                                  {/* Title */}
                                  <Text
                                    strong
                                    style={{ display: "block", marginTop: 12, fontSize: 15 }}
                                    ellipsis={{ tooltip: item.title }}
                                  >
                                    {item.title}
                                  </Text>

                                  {/* Tags */}
                                  <Space wrap size={4} style={{ marginTop: 10 }}>
                                    <Tag color="blue">{item.category}</Tag>
                                    <Tag color={meta.color}>{meta.label}</Tag>
                                    <Tag color="green">Assigned</Tag>
                                  </Space>

                                  {/* Footer */}
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      marginTop: 12,
                                    }}
                                  >
                                    {isChecked ? (
                                      <CheckCircleFilled
                                        style={{ color: token.colorSuccess, fontSize: 18 }}
                                      />
                                    ) : (
                                      <span />
                                    )}
                                    <Button
                                      type="text"
                                      icon={<EyeOutlined />}
                                      onClick={(e) => handlePreviewClick(item, e)}
                                    >
                                      Preview
                                    </Button>
                                  </div>
                                </Card>
                              </Col>
                            );
                          })}
                        </Row>
                        {filteredContent.length > 0 && (
                          <Divider style={{ margin: "0 0 12px 0" }}>
                            <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
                              More Content
                            </Text>
                          </Divider>
                        )}
                      </>
                    )}

                    {/* FILTERED CONTENT from search */}
                    {filteredContent.length === 0 && !(studentContent?.contents?.length > 0) ? (
                      <Empty description="No content found for the selected filters" />
                    ) : (
                      <Row gutter={[16, 16]}>
                        {paginatedContent.map((item) => {
                          const meta = getFileMeta(item);
                          const isChecked = selectedContentIds.includes(item.id);

                          return (
                            <Col xs={24} md={12} key={item.id}>
                              <Card
                                hoverable
                                onClick={() => toggleContent(item.id)}
                                bodyStyle={{
                                  padding: 12,
                                  height: "100%",
                                  display: "flex",
                                  flexDirection: "column",
                                }}
                                style={{
                                  minHeight: 170,
                                  borderRadius: 10,
                                  border: isChecked
                                    ? `2px solid ${token.colorPrimary}`
                                    : `1px solid ${token.colorBorder}`,
                                  background: isChecked ? token.colorPrimaryBg : "#fff",
                                }}
                              >
                                {/* Top */}
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 42,
                                      height: 42,
                                      borderRadius: 8,
                                      background: meta.bg,
                                      color: meta.color,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: 20,
                                    }}
                                  >
                                    {meta.icon}
                                  </div>

                                  <Checkbox
                                    checked={isChecked}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={() => toggleContent(item.id)}
                                  />
                                </div>

                                {/* Title */}
                                <Text
                                  strong
                                  style={{ display: "block", marginTop: 12, fontSize: 15 }}
                                  ellipsis={{ tooltip: item.title }}
                                >
                                  {item.title}
                                </Text>

                                {/* Tags */}
                                <Space wrap size={4} style={{ marginTop: 10 }}>
                                  <Tag color="blue">{item.category}</Tag>
                                  <Tag color={meta.color}>{meta.label}</Tag>
                                  {item.free_content && <Tag color="green">Free</Tag>}
                                </Space>

                                {/* Footer */}
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginTop: 12,
                                  }}
                                >
                                  {isChecked ? (
                                    <CheckCircleFilled
                                      style={{ color: token.colorSuccess, fontSize: 18 }}
                                    />
                                  ) : (
                                    <span />
                                  )}
                                  <Button
                                    type="text"
                                    icon={<EyeOutlined />}
                                    onClick={(e) => handlePreviewClick(item, e)}
                                  >
                                    Preview
                                  </Button>
                                </div>
                              </Card>
                            </Col>
                          );
                        })}
                      </Row>
                    )}
                  </div>

                  {/* Pagination stays below scroll area, always visible */}
                  {filteredContent.length > PAGE_SIZE && (
                    <Row justify="center" style={{ marginTop: 16 }}>
                      <Pagination
                        current={currentPage}
                        pageSize={PAGE_SIZE}
                        total={filteredContent.length}
                        onChange={setCurrentPage}
                        size="small"
                        showLessItems={false}
                      />
                    </Row>
                  )}

                </>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </Modal>
  );
};

export default UploadContentModal;