import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Row, Col, Card, Typography, Button, Table, Tag, Input, Tabs } from "antd";
import {
  BookOutlined,
  TeamOutlined,
  DollarOutlined,
  PlusOutlined,
  EditOutlined,
  ReadOutlined,
  SearchOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import AddProgramModal from "../modals/AddProgramModal";
import AddPackageModal from "../modals/AddPackageModal";
import adminTheme from "../../../theme/adminTheme";
import { fetchPrograms ,fetchProgramStats} from "../../../adminSlices/programSlice";
import { fetchPackages, createPackage, updatePackage } from "../../../adminSlices/packageSlice";


const { Title, Text } = Typography;


const Programs = () => {
  const dispatch = useDispatch();
  const { list: programData, loading } = useSelector((state) => state.programs);
  const { stats } = useSelector((state) => state.programs);

React.useEffect(() => {
  dispatch(fetchPrograms());
  dispatch(fetchPackages());
  dispatch(fetchProgramStats()); // 🔥 fetch stats for dashboard cards
}, [dispatch]);


  const [activeTab, setActiveTab] = useState("programs");
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const { list: packageData } = useSelector((state) => state.packages);


const statsCards = [
  { title: "Total Programs", value: stats?.total_programs || 0, icon: <ReadOutlined /> },
  { title: "Total Packages", value: stats?.total_packages || 0, icon: <BookOutlined /> },
  { title: "Total Enrolled", value: stats?.total_enrolled_students || 0, icon: <TeamOutlined /> },
  { title: "Revenue (Monthly)", value: `₹${stats?.revenue || 0}`, icon: <DollarOutlined /> },
];



  const programColumns = [
    {
      title: "Sr. No",
      key: "srno",
      render: (_, __, index) => index + 1,
    },
    { title: "Program Name", dataIndex: "name", render: (text) => <Text strong>{text}</Text> },
    {
      title: "Description",
      dataIndex: "description", ellipsis: true, render: (text) => (<Text type="colorTextSecondary">{text || "-"}</Text>),
    },
    { title: "Duration", dataIndex: "duration" },
    { title: "Sessions", dataIndex: "session" },
    { title: "Enrolled Users", dataIndex: "enrolled_users" },
    { title: "Status", render: () => <Tag color="success">Active</Tag> },
    {
      title: "Actions",
      render: (_, record) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            icon={<EyeOutlined />}
            size="large"
            onClick={() => {
              setEditingProgram(record);
              setViewMode(true);
              setModalVisible(true);
            }}
          >
            View
          </Button>

          <Button
            icon={<EditOutlined />}
            type="primary"
            size="large"
            onClick={() => {
              setEditingProgram(record);
              setViewMode(false);
              setModalVisible(true);
            }}
          >
            Edit
          </Button>
        </div>
      ),
    }
  ];

  const packageColumns = [
    {
      title: "Sr. No",
      key: "srno",
      render: (_, __, index) => index + 1,
    },
    { title: "Package Name", dataIndex: "name", render: (text) => <Text strong>{text}</Text> },
    {
      title: "Program",
      render: (_, record) => (
        <Text>
          {record.program?.name || "-"}
        </Text>
      ),
    },
    { title: "Price", dataIndex: "price" },
{
  title: "Features",
  render: (_, record) => {
    const featuresArray = Array.isArray(record.features)
      ? record.features.map(f => f.description || "")
      : [];

    return featuresArray.length > 0 ? (
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {featuresArray.map((f, i) => (
          <span key={i}>{f}</span>
        ))}
      </div>
    ) : (
      <Text type="secondary">-</Text>
    );
  },
},


    // { title: "Active Users", dataIndex: "users" },
    { title: "Status", render: () => <Tag color="success">Active</Tag> },
    {
      title: "Actions",
      render: (_, record) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            icon={<EyeOutlined />}
            size="large"
            onClick={() => {
              setEditingPackage(record);
              setViewMode(true);
              setModalVisible(true);
            }}
          >
            View
          </Button>

          <Button
            icon={<EditOutlined />}
            type="primary"
            size="large"
            onClick={() => {
              setEditingPackage(record);
              setViewMode(false);
              setModalVisible(true);
            }}
          >
            Edit
          </Button>
        </div>
      ),
    }

  ];

  // Search filter on all fields
  const filteredData =
    activeTab === "packages"
      ? packageData.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchText.toLowerCase())
        )
      )
      : programData.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchText.toLowerCase())
        )
      );

  return (
    <div style={{ padding: "16px" }}>
      <Title level={3}>Programs & Packages</Title>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {statsCards.map((item, index) => (
          <Col xs={24} sm={12} md={12} lg={6} key={index}>
            <Card hoverable style={{ borderRadius: 16, textAlign: "center" }} bodyStyle={{ padding: 16 }}>
              <Text style={{ fontSize: 14, color: "#6B7280" }}>{item.title}</Text>
              <div style={{ marginTop: 8 }}>
                {React.cloneElement(item.icon, {
                  style: { fontSize: 28, color:adminTheme.token.colorPrimary },
                })}
              </div>
              <Title level={2} style={{ marginTop: 8, fontSize: 22 }}>{item.value}</Title>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Tabs & Create Button */}
      {/* Tabs & Create Button */}
      <Row
        justify="space-between"
        align="middle"
        style={{ marginTop: 24, marginBottom: 16, flexWrap: "wrap", gap: 16 }}
      >
        {/* TABS */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "programs",
              label: "Programs",
            },
            {
              key: "packages",
              label: "Packages",
            },
          ]}
        />

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            if (activeTab === "packages") setEditingPackage(null);
            else setEditingProgram(null);
            setModalVisible(true);
          }}
        >
          Create {activeTab === "packages" ? "Package" : "Program"}
        </Button>
      </Row>


      {/* Search + Table */}
      <Card style={{ marginTop: 16, borderRadius: 16, overflowX: "auto" }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16, flexWrap: "wrap", gap: 16 }}>
          <Title level={5} style={{ margin: 0, fontSize: 16 }}>
            {activeTab === "packages" ? `All Packages (${filteredData.length})` : `All Programs (${filteredData.length})`}
          </Title>

          <Input
            placeholder={activeTab === "packages" ? "Search package or program" : "Search program"}
            prefix={<SearchOutlined />}
            allowClear
            onChange={e => setSearchText(e.target.value)}
            style={{ width: "100%", maxWidth: 260, borderRadius: 8 }}
          />
        </Row>

        <Table
          columns={activeTab === "packages" ? packageColumns : programColumns}
          dataSource={filteredData}
          pagination={{ pageSize: 5, showSizeChanger: false }}
          scroll={{ x: "max-content" }}
        />
      </Card>

      {/* Program Modal */}
      {activeTab === "programs" && (
        <AddProgramModal
          visible={modalVisible}
          viewMode={viewMode}
          onClose={() => { setModalVisible(false); setEditingProgram(null); }}
          onSubmit={(values) => {
            if (editingProgram) {
              setProgramData(programData.map(p => p.key === editingProgram.key ? { ...p, ...values } : p));
            } else {
              setProgramData([...programData, { key: programData.length + 1, ...values }]);
            }
            setModalVisible(false);
            setEditingProgram(null);
            setViewMode(false);

          }}
          initialValues={editingProgram}
        />
      )}

      {/* Package Modal */}
      {activeTab === "packages" && (
        <AddPackageModal
  visible={modalVisible}
  onClose={() => {
    setModalVisible(false);
    setEditingPackage(null);
  }}
  onSubmit={async (values) => {
    const payload = {
      name: values.name,
      program_id: values.program_id,
      price: Number(values.price),
      description: "",
      is_active: true,
      features: values.features || [],
    };

    try {
      if (editingPackage) {
        // ✅ UPDATE PACKAGE
        await dispatch(updatePackage({ id: editingPackage.id, payload })).unwrap();
      } else {
        // ✅ CREATE PACKAGE
        await dispatch(createPackage(payload)).unwrap();
      }
      dispatch(fetchPackages());
      setModalVisible(false);
      setEditingPackage(null);
    } catch (err) {
      console.error("Package API error:", err);
    }
  }}
  initialValues={editingPackage}
  programs={programData}
/>


      )}
    </div>
  );
};

export default Programs;
