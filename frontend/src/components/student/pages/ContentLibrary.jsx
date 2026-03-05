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
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchContentList } from "../../../adminSlices/contentSlice";

const { Title, Text } = Typography;
const { Option } = Select;

const ContentLibrary = () => {
  const dispatch = useDispatch();
  const { contentList, loading } = useSelector((state) => state.content);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [accessLevel, setAccessLevel] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // ================= FETCH DATA =================
  useEffect(() => {
    dispatch(fetchContentList());
  }, [dispatch]);

  // ================= TRANSFORM API DATA =================
  const transformedData =
    contentList
      ?.filter((item) => !item.is_draft)
      ?.map((item) => {
        let accessType = "Free";

        if (item.payment_required) {
          accessType = "Premium";
        }

        let contentType = "Article";
        if (item.type === "video") contentType = "Video";
        if (item.type === "pdf") contentType = "Article";

        return {
          id: item.id,
          title: item.title,
          description: item.description,
          type: contentType,
          accessType: accessType,
          programs: item.program_details?.map((p) => p.name) || [],
          viewUrl: item.video_link || item.file_url,
          image: item.image,
        };
      }) || [];

  // ================= FILTERING =================
  const filteredData = transformedData.filter((item) => {
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
  const handleView = (item) => {
    if (item.accessType === "Premium") return;

    if (item.viewUrl) {
      window.open(item.viewUrl, "_blank");
    }
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
            {paginatedData.map((item) => (
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
                          item.accessType === "Premium"
                            ? "brightness(0.4)"
                            : "none",
                      }}
                    />

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

                    {item.accessType === "Premium" && (
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
                        justifyContent: "flex-start",
                      }}
                    >
                      <Button
                        type="link"
                        disabled={item.accessType === "Premium"}
                        style={{
                          padding: 0,
                          fontWeight: 600,
                        }}
                        onClick={() => handleView(item)}
                      >
                        {item.accessType === "Premium"
                          ? "Upgrade to Access →"
                          : "View Content →"}
                      </Button>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}

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
            <div style={{ textAlign: "center", marginTop: 40 }}>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredData.length}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ContentLibrary;