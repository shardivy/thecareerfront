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
} from "@ant-design/icons";

import engineeringImg from "../../../assets/freecontent1.jpg";

const { Title, Text } = Typography;
const { Option } = Select;

const contentData = [
  {
    id: 1,
    title: "Engineering Career Roadmap",
    program: "Engineering",
    type: "Article",
    classLevel: "12",
    icon: <ReadOutlined />,
    description:
      "Step-by-step roadmap to pursue engineering — exams, branches, and college options.",
    image: engineeringImg,
  },
  {
    id: 2,
    title: "JEE Preparation Strategy",
    program: "Engineering",
    type: "Video",
    classLevel: "11",
    icon: <VideoCameraOutlined />,
    description:
      "A practical strategy to prepare for JEE with study schedules and practice tips.",
    image: engineeringImg,
  },
  {
    id: 3,
    title: "NEET Sample Test",
    program: "Medical",
    type: "Test",
    classLevel: "12",
    icon: <FileTextOutlined />,
    description:
      "A short timed sample to evaluate readiness for medical entrance exams.",
    image: engineeringImg,
  },
  {
    id: 4,
    title: "Design Thinking Basics",
    program: "Design",
    type: "Article",
    classLevel: "10",
    icon: <ReadOutlined />,
    description:
      "Intro to design thinking with practical exercises and portfolio tips.",
    image: engineeringImg,
  },
  {
    id: 5,
    title: "Commerce Career Options",
    program: "Commerce",
    type: "Video",
    classLevel: "11",
    icon: <VideoCameraOutlined />,
    description:
      "Overview of careers in commerce — CA, CS, CFA and related paths.",
    image: engineeringImg,
  },
];

const programColors = {
  Engineering: "#4B7CF3",
  Medical: "#F44336",
  Design: "#9C27B0",
  Commerce: "#4CAF50",
};

const FreeContent = () => {
  const [search, setSearch] = useState("");
  const [program, setProgram] = useState("All");
  const [type, setType] = useState("All");
  const [classLevel, setClassLevel] = useState("All");

  const filteredData = contentData.filter((item) => {
    return (
      item.title.toLowerCase().includes(search.toLowerCase()) &&
      (program === "All" || item.program === program) &&
      (type === "All" || item.type === type) &&
      (classLevel === "All" || item.classLevel === classLevel)
    );
  });

  return (
    <div style={{ padding: "40px 20px" }}>
      {/* HEADER */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <Title level={2}>Free Learning Content</Title>
        <Text type="colorTextSecondary">
          Explore free resources for Engineering, Medical, Design, Commerce & more
        </Text>
      </div>

      {/* SEARCH & FILTERS */}
      <Row gutter={[16, 16]} justify="center" style={{ marginBottom: 32 }}>
        <Col xs={24} md={6}>
          <Input
            placeholder="Search free content..."
            prefix={<SearchOutlined />}
            size="large"
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>

        <Col xs={12} md={4}>
          <Select
            size="large"
            value={classLevel}
            onChange={setClassLevel}
            style={{ width: "100%" }}
          >
            <Option value="All">Select Class</Option>
            <Option value="8">Class 8</Option>
            <Option value="9">Class 9</Option>
            <Option value="10">Class 10</Option>
            <Option value="11">Class 11</Option>
            <Option value="12">Class 12</Option>
          </Select>
        </Col>

        <Col xs={12} md={4}>
          <Select
            size="large"
            value={program}
            onChange={setProgram}
            style={{ width: "100%" }}
          >
            <Option value="All">Select Programs</Option>
            <Option value="Engineering">Engineering</Option>
            <Option value="Medical">Medical</Option>
            <Option value="Design">Design</Option>
            <Option value="Commerce">Commerce</Option>
          </Select>
        </Col>

        <Col xs={12} md={4}>
          <Select
            size="large"
            value={type}
            onChange={setType}
            style={{ width: "100%" }}
          >
            <Option value="All">Select Types</Option>
            <Option value="Article">Articles</Option>
            <Option value="Video">Videos</Option>
            <Option value="Test">Tests</Option>
          </Select>
        </Col>
      </Row>

      {/* CONTENT CARDS */}
      <Row gutter={[24, 24]}>
        {filteredData.map((item) => (
          <Col xs={24} sm={12} md={8} key={item.id}>
            <Card hoverable style={{ borderRadius: 14, height: "100%" }}>
              {/* IMAGE WITH FREE TAG */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: 160,
                  borderRadius: 10,
                  overflow: "hidden",
                  background: "#f5f7fa",
                }}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />

                {/* FREE TAG */}
                <Tag
                  color="green"
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    fontWeight: 600,
                  }}
                >
                  FREE
                </Tag>
              </div>

              {/* CONTENT */}
              <div style={{ marginTop: 16 }}>
                <Title level={5}>{item.title}</Title>
                <Text type="colorTextSecondary">{item.description}</Text>

                <div style={{ marginTop: 12 }}>
                  <Tag color={programColors[item.program]}>
                    {item.program}
                  </Tag>
                  <Tag color="blue">{item.type}</Tag>
                  <Tag color="purple">Class {item.classLevel}</Tag>
                </div>

                <Button
                  type="link"
                  style={{ padding: 0, marginTop: 8, fontWeight: 600 }}
                >
                  View Content →
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

export default FreeContent;
