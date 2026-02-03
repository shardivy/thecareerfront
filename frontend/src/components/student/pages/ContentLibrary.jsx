import React, { useState } from "react";
import {
  Row,
  Col,
  Card,
  Typography,
  Input,
  Select,
  Tag,
  Button,
} from "antd";
import {
  ReadOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  SearchOutlined,
  InboxOutlined,
  LockOutlined,
} from "@ant-design/icons";

import engineeringImg from "../../../assets/freecontent1.jpg";


const { Title, Text } = Typography;
const { Option } = Select;

/* ===================== CONTENT DATA ===================== */

const contentData = [
  {
    id: 1,
    title: "Engineering Career Roadmap",
    program: "Engineering",
    type: "Article",
    classLevel: "12",
    accessType: "Free",
    icon: <ReadOutlined />,
    description:
      "Step-by-step roadmap to pursue engineering — exams, branches, and college options.",
    image: engineeringImg,
    viewUrl: "/content/engineering-roadmap",
    downloadUrl: "/files/engineering-roadmap.pdf",

  },
  {
    id: 2,
    title: "JEE Preparation Strategy",
    program: "Engineering",
    type: "Video",
    classLevel: "11",
    accessType: "Premium",
    icon: <VideoCameraOutlined />,
    description:
      "A practical strategy to prepare for JEE with study schedules and practice tips.",
    image: engineeringImg,
    viewUrl: "/content/engineering-roadmap",
    downloadUrl: "/files/engineering-roadmap.pdf",

  },
  {
    id: 3,
    title: "NEET Sample Test",
    program: "Medical",
    type: "Test",
    classLevel: "12",
    accessType: "Basic",
    icon: <FileTextOutlined />,
    description:
      "A short timed sample to evaluate readiness for medical entrance exams.",
    image: engineeringImg,
    viewUrl: "/content/engineering-roadmap",
    downloadUrl: "/files/engineering-roadmap.pdf",

  },
  {
    id: 4,
    title: "Design Thinking Basics",
    program: "Design",
    type: "Article",
    classLevel: "10",
    accessType: "Free",
    icon: <ReadOutlined />,
    description:
      "Intro to design thinking with practical exercises and portfolio tips.",
    image: engineeringImg,
    viewUrl: "/content/engineering-roadmap",
    downloadUrl: "/files/engineering-roadmap.pdf",

  },
  {
    id: 5,
    title: "Commerce Career Options",
    program: "Commerce",
    type: "Video",
    classLevel: "11",
    accessType: "Premium",
    icon: <VideoCameraOutlined />,
    description:
      "Overview of careers in commerce — CA, CS, CFA and related paths.",
    image: engineeringImg,
    viewUrl: "/content/engineering-roadmap",
    downloadUrl: "/files/engineering-roadmap.pdf",

  },
];

const programColors = {
  Engineering: "#4B7CF3",
  Medical: "#F44336",
  Design: "#9C27B0",
  Commerce: "#4CAF50",
};

/* ===================== COMPONENT ===================== */

const ContentLibrary = () => {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [accessLevel, setAccessLevel] = useState("All"); // ✅ NEW

  const filteredData = contentData.filter((item) => {
  return (
    item.title.toLowerCase().includes(search.toLowerCase()) &&
    (type === "All" || item.type === type) &&
    (accessLevel === "All" || item.accessType === accessLevel)
  );
});


  const handleView = (item) => {
  if (item.accessType === "Premium") return;
  window.open(item.viewUrl, "_blank");
};

const handleDownload = (item) => {
  if (item.accessType === "Premium" || !item.downloadUrl) return;

  const link = document.createElement("a");
  link.href = item.downloadUrl;
  link.download = "";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


  return (
    <div style={{ padding: "40px 20px" }}>
      {/* HEADER */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <Title level={2}>Content Library</Title>
        <Text type="colorTextSecondary">
          Explore free, basic and premium learning resources
        </Text>
      </div>

      {/* FILTERS */}
      <Row gutter={[12, 12]} justify="center" style={{ marginBottom: 32 }}>
        {/* SEARCH */}
        <Col xs={24} sm={24} md={8}>
          <Input
            size="large"
            placeholder="Search content..."
            prefix={<SearchOutlined />}
            allowClear
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>

  
        {/* TYPE */}
        <Col xs={24} sm={12} md={4}>
          <Select size="large" value={type} onChange={setType} style={{ width: "100%" }}>
            <Option value="All">All Types</Option>
            <Option value="Article">Article</Option>
            <Option value="Video">Video</Option>
            <Option value="Test">Test</Option>
          </Select>
        </Col>

        {/* ACCESS */}
        <Col xs={24} sm={12} md={4}>
          <Select size="large" value={accessLevel} onChange={setAccessLevel} style={{ width: "100%" }}>
            <Option value="All">All Access</Option>
            <Option value="Free">Free</Option>
            <Option value="Basic">Basic</Option>
            <Option value="Premium">Premium</Option>
          </Select>
        </Col>
      </Row>


      {/* CONTENT CARDS */}
      <Row gutter={[24, 24]}>
        {filteredData.map((item) => (
          <Col xs={24} sm={12} md={8} key={item.id}>
            <Card hoverable style={{ borderRadius: 14 }}>
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
                  src={item.image}
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

                {/* ACCESS TAG */}
                <Tag
                  color={
                    item.accessType === "Free"
                      ? "green"
                      : item.accessType === "Basic"
                        ? "blue"
                        : "gold"
                  }
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    fontWeight: 600,
                  }}
                >
                  {item.accessType.toUpperCase()}
                </Tag>

                {/* LOCK OVERLAY */}
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
                    <LockOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                    Premium Content
                  </div>
                )}
              </div>

              {/* CONTENT */}
              <div style={{ marginTop: 16 }}>
                <Title level={5}>{item.title}</Title>
                <Text type="colorTextSecondary">{item.description}</Text>

                <div style={{ marginTop: 12, gap: 8, display: "flex", flexWrap: "wrap" }}>
                  <Tag color={programColors[item.program]}>
                    {item.program}
                  </Tag>
                  <Tag color="blue">{item.type}</Tag>
                  <Tag color="purple">Class {item.classLevel}</Tag>
                </div>

                <Button
                  type="link"
                  disabled={item.accessType === "Premium"}
                  style={{ padding: 0, marginTop: 8, fontWeight: 600 }}
                >
                  {item.accessType === "Premium"
                    ? "Upgrade to Access →"
                    : "View Content →"}
                </Button>
              </div>
            </Card>
          </Col>
        ))}

        {filteredData.length === 0 && (
          <Col span={24} style={{ textAlign: "center", marginTop: 40 }}>
            <InboxOutlined style={{ fontSize: 48, color: "#9CA3AF" }} />
            <Title level={4} style={{ marginTop: 12 }}>
              No content found
            </Title>
            <Text type="colorTextSecondary">
              Try adjusting filters to explore content
            </Text>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default ContentLibrary;
