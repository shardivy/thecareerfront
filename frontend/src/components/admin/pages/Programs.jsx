import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Row,
  Col,
  Card,
  Typography,
  Button,
  Table,
  Input,
  Tabs,
  Switch,
  Modal,
  Space,
  Grid,
  message,
} from "antd";
import {
  BookOutlined,
  TeamOutlined,
  DollarOutlined,
  PlusOutlined,
  EditOutlined,
  ReadOutlined,
  SearchOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

import AddProgramModal from "../modals/AddProgramModal";
import AddPackageModal from "../modals/AddPackageModal";
import adminTheme from "../../../theme/adminTheme";

import {
  fetchPrograms,
  fetchProgramStats,
  updateProgram,
} from "../../../adminSlices/programSlice";

import {
  fetchPackages,
  createPackage,
  updatePackage,
} from "../../../adminSlices/packageSlice";
import AddLandingPageModal from "../modals/AddLandingPageModal";
import { fetchLandingPages, deleteLandingPage } from "../../../adminSlices/landingPageSlice";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const Programs = () => {
  const dispatch = useDispatch();
  const tableRef = useRef(null);
  const screens = useBreakpoint();

  const { list: programData, stats } = useSelector(
    (state) => state.programs
  );
  const { list: packageData } = useSelector(
    (state) => state.packages
  );
  const { list: landingData } = useSelector(
  (state) => state.landingPage
);

  const [activeTab, setActiveTab] = useState("programs");
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);
  const [editingLanding, setEditingLanding] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);


  /* ---------- CONFIRM MODAL STATE ---------- */
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  useEffect(() => {
    dispatch(fetchPrograms());
    dispatch(fetchPackages());
    dispatch(fetchProgramStats());
      dispatch(fetchLandingPages());
  }, [dispatch]);

  /* ---------- CONFIRM HANDLERS ---------- */

  const openStatusConfirm = (record, entity) => {
    setConfirmData({ record, entity });
    setConfirmOpen(true);
  };

const handleDeleteLanding = async (record) => {
  try {
    await dispatch(deleteLandingPage(record.id)).unwrap();

    message.success("Landing page deleted successfully");

    // ❌ Not needed (already handled in slice)
    // dispatch(fetchLandingPages());

  } catch (err) {
    message.error(err?.message || "Delete failed");
    throw err; // 👈 IMPORTANT (for Modal)
  }
};

  const handleConfirmOk = async () => {
    if (!confirmData) return;

    const { record, entity } = confirmData;

    if (entity === "program") {
      await dispatch(
        updateProgram({
          id: record.id,
          payload: {
            name: record.name,
            is_active: !record.is_active,
          },
        })
      );
      dispatch(fetchPrograms());
    }

    if (entity === "package") {
      await dispatch(
        updatePackage({
          id: record.id,
          payload: {
            name: record.name,
            is_active: !record.is_active,
          },
        })
      );
      dispatch(fetchPackages());
    }

    setConfirmOpen(false);
    setConfirmData(null);
  };

  /* ---------- STATS ---------- */

  const statsCards = [
    {
      title: "Total Programs",
      value: stats?.total_programs || 0,
      icon: <ReadOutlined />,
      tabKey: "programs",
    },
    {
      title: "Total Counselling Services",
      value: stats?.total_packages || 0,
      icon: <BookOutlined />,
      tabKey: "packages",
    },
    {
      title: "Total Enrolled",
      value: stats?.total_enrolled_students || 0,
      icon: <TeamOutlined />,
    },
    {
      title: "Revenue",
      value: `₹${stats?.total_revenue || 0}`,
      icon: <DollarOutlined />,
    },
  ];

  /* ---------- PROGRAM COLUMNS ---------- */

  const programColumns = [
    {
      title: "Sr. No", render: (_, __, index) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Program Name",
      dataIndex: "name",
      render: (t) => <Text strong>{t}</Text>,
    },
    {
      title: "Description",
      dataIndex: "description",
      render: (text) => {
        if (!text) return "-";

        const words = text.split(" ");
        const shortText =
          words.length > 5
            ? words.slice(0, 5).join(" ") + "..."
            : text;

        return (
          <Text title={text}>
            {shortText}
          </Text>
        );
      },
    },


    { title: "Enrolled Users", dataIndex: "enrolled_users" },
    {
      title: "Status",
      render: (_, record) => (
        <Switch
          checked={record.is_active}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
          onClick={() => openStatusConfirm(record, "program")}
        />
      ),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space wrap>
          <Button
            icon={<EyeOutlined />}
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
            onClick={() => {
              setEditingProgram(record);
              setViewMode(false);
              setModalVisible(true);
            }}
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  /* ---------- PACKAGE COLUMNS ---------- */

  const packageColumns = [
    {
      title: "Sr. No", render: (_, __, index) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Counselling Service Name",
      dataIndex: "name",
      render: (text) => {
        if (!text) return "-";

        const words = text.split(/\s+/);
        const firstLine = words.slice(0, 3).join(" ");
        const remaining = words.slice(3).join(" ");

        return (
          <Text strong>
            {firstLine}
            {remaining && (
              <>
                <br />
                <span style={{ fontWeight: 400 }}>{remaining}</span>
              </>
            )}
          </Text>
        );
      },
    },

    {
      title: "Program",
      render: (_, r) => r.program?.name || "-",
    },
    {
      title: "Description",
      dataIndex: "description",
      render: (text) => {
        if (!text || text.trim() === "") return "-";

        const words = text.trim().split(/\s+/);
        const shortText =
          words.length > 2
            ? words.slice(0, 6).join(" ") + "..."
            : text;

        return (
          <Text title={text}>
            {shortText}
          </Text>
        );
      },
    },

    { title: "Price", dataIndex: "price" },
    {
      title: "Features",
      render: (_, r) => {
        if (!r.features?.length) return "-";

        const words = r.features
          .map((f) => f.description)
          .join(" ")
          .trim()
          .split(/\s+/);

        const lines = [];
        for (let i = 0; i < words.length; i += 3) {
          lines.push(words.slice(i, i + 3).join(" "));
        }

        const displayLines = lines.slice(0, 2);
        const hasMore = lines.length > 2;

        return (
          <Text>
            {displayLines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
            {hasMore && <span>...</span>}
          </Text>
        );
      },
    },

    {
      title: "Status",
      render: (_, record) => (
        <Switch
          checked={record.is_active}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
          onClick={() => openStatusConfirm(record, "package")}
        />
      ),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space wrap>
          <Button
            icon={<EyeOutlined />}
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
            onClick={() => {
              setEditingPackage(record);
              setViewMode(false);
              setModalVisible(true);
            }}
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ];

const landingColumns = [
  {
    title: "Sr. No",
    render: (_, __, index) =>
      (currentPage - 1) * pageSize + index + 1,
  },

 {
  title: "Program / Counselling Service",
  width: 220,
  key: "program",
  render: (_, record) => (
    <div>
      <Text strong>
        {record.program_details?.name || "-"}
      </Text>
      <br />
      <Text type="colorTextSecondary">
        {record.package_details?.name || "-"}
      </Text>
    </div>
  ),
},

 {
  title: "Price",
  render: (_, record) =>
    record.package_details?.price
      ? `₹${record.package_details.price}`
      : "-",
},

  {
    title: "Description",
    dataIndex: "description",
    ellipsis: true,
  },

{
  title: "Features",
  render: (_, record) => {
    const features = record.package_details?.features;

    if (!features || features.length === 0) return "-";

    return (
      <div>
        {features.map((f, index) => (
          <div key={index}>
            {f.description}
          </div>
        ))}
      </div>
    );
  },
},
  // {
  //   title: "Process",
  //   dataIndex: "process",
  //   ellipsis: true,
  // },

  // {
  //   title: "Contact",
  //   dataIndex: "contact_numbers",
  //   render: (nums) => nums?.join(", ") || "-",
  // },

  {
    title: "Enterprise",
    dataIndex: "enterprise_name",
    render: (t) => t || "-",
  },

  // {
  //   title: "Registration",
  //   dataIndex: "registration_details",
  //   ellipsis: true,
  // },

  // {
  //   title: "Instructions",
  //   dataIndex: "instructions",
  //   ellipsis: true,
  // },

  // {
  //   title: "URL",
  //   dataIndex: "url",
  //   render: (url) =>
  //     url ? (
  //       <a href={url} target="_blank" rel="noreferrer">
  //         {url}
  //       </a>
  //     ) : "-",
  // },

  // {
  //   title: "Image",
  //   dataIndex: "thumbnail_url",
  //   render: (img) =>
  //     img ? (
  //       <img
  //         src={img}
  //         alt="thumb"
  //         style={{ width: 50, height: 40, objectFit: "cover" }}
  //       />
  //     ) : "-",
  // },

  // {
  //   title: "Status",
  //   render: (_, record) => (
  //     <Switch
  //       checked={record.is_active}
  //       checkedChildren="Active"
  //       unCheckedChildren="Inactive"
  //     />
  //   ),
  // },

  {
    title: "Actions",
    render: (_, record) => (
      <Space>
        <Button
  icon={<EyeOutlined />}
  onClick={() => {
    setEditingLanding(record);
    setModalVisible(true);
    setViewMode(true); // ✅ important
  }}
>
  View
</Button>

       <Button
  icon={<EditOutlined />}
  type="primary"
  onClick={() => {
    setEditingLanding(record);
    setModalVisible(true);
    setViewMode(false);
  }}
>
  Edit
</Button>
<Button
  danger
  icon={<DeleteOutlined />}
 onClick={() => {
  Modal.confirm({
    title: "Delete Landing Page",
    content: "Are you sure you want to delete this record?",
    okText: "Yes, Delete",
    okType: "danger",
    cancelText: "Cancel",
  centered: true, 
    maskClosable: true, // ✅ THIS ENABLES OUTSIDE CLICK CLOSE

    onOk: () => {
      return handleDeleteLanding(record);
    },
  });
  }}
>
  Delete
</Button>
      </Space>
    ),
  },
];

  /* ---------- FILTER ---------- */

const filteredData =
  activeTab === "packages"
    ? packageData
    : activeTab === "programs"
    ? programData
    : landingData;

const finalFilteredData = filteredData.filter((i) =>
  JSON.stringify(i).toLowerCase().includes(searchText.toLowerCase())
);
  /* ---------- RENDER ---------- */
  

  return (
    <div style={{ padding: screens.md ? 24 : 12 }}>
      <Title level={3}>Programs & Counselling Services</Title>

      {/* STATS */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {statsCards.map((item, i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <Card
              hoverable
              onClick={() => item.tabKey && setActiveTab(item.tabKey)}
              style={{ borderRadius: 16, textAlign: "center" , fontSize: 16}}
            >
              <Text>{item.title}</Text>
              <div style={{ marginTop: 8 }}>
                {React.cloneElement(item.icon, {
                  style: {
                    fontSize: 28,
                    color: adminTheme.token.colorPrimary,
                  },
                })}
              </div>
              <Title level={2} style={{ fontSize: 22 }}>
                {item.value}
              </Title>
            </Card>
          </Col>
        ))}
      </Row>

      {/* TABS + CREATE */}
      <Row
        align="middle"
        justify="space-between"
        style={{ marginTop: 24, marginBottom: 16 }}
        gutter={[8, 8]}
      >
        <Col xs={24} md="auto">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: "programs", label: "Programs" },
              { key: "packages", label: "Counselling Services" },
              { key: "landing", label: "Landing Pages" },
            ]}
          />
        </Col>

        <Col xs={24} md="auto" style={{ textAlign: "right" }}>
          <Button
            block={!screens.md}
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingProgram(null);
              setEditingPackage(null);
                setEditingLanding(null);
              setModalVisible(true);
               setViewMode(false); 
            }}
          >
            Create  {activeTab === "packages"
    ? "Counselling Service"
    : activeTab === "programs"
    ? "Program"
    : "Landing Page"} 
          </Button>
        </Col>
      </Row>


      {/* TABLE */}
      <Card ref={tableRef}>

        <Col>
          <Title level={5} style={{ margin: 10 }}>
  {activeTab === "packages"
    ? `Counselling Service Records (${filteredData.length})`
    : activeTab === "programs"
    ? `Program Records (${filteredData.length})`
    : `Landing Page Records (${filteredData.length})`} {/* ✅ */}
</Title>
        </Col>


        <Input
          prefix={<SearchOutlined />}
          placeholder="Search..."
          allowClear
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            marginBottom: 16,
            width: screens.md ? 400 : "100%",
          }}
        />
        <Table
          rowKey="id"
          scroll={{ x: "max-content" }}
         columns={
    activeTab === "packages"
      ? packageColumns
      : activeTab === "programs"
      ? programColumns
      : landingColumns // ✅ NEW
  }

         dataSource={finalFilteredData}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            showSizeChanger: true,
            pageSizeOptions: [5, 10, 20, 50],
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
          }}
        />

      </Card>

      {/* CONFIRM MODAL */}
      <Modal
        open={confirmOpen}
        centered
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: "#faad14" }} />
            Confirmation
          </Space>
        }
        okText="Yes, Confirm"
        cancelText="Cancel"
        onOk={handleConfirmOk}
        onCancel={() => setConfirmOpen(false)}
      >
        <Text>
          Are you sure you want to{" "}
          {confirmData?.record?.is_active
            ? "deactivate"
            : "activate"}{" "}
          this {confirmData?.entity}?
        </Text>
        <div style={{ marginTop: 8 }}>
          <Text strong>{confirmData?.record?.name}</Text>
        </div>
      </Modal>

      {/* MODALS */}
      {activeTab === "programs" && (
        <AddProgramModal
          visible={modalVisible}
          viewMode={viewMode}
          onClose={() => setModalVisible(false)}
          initialValues={editingProgram}
        />
      )}

      {activeTab === "packages" && (
        <AddPackageModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          initialValues={editingPackage}
          viewMode={viewMode}
          programs={programData}
          onSubmit={async (values) => {
            const payload = {
              ...values,
              name: values.name,
              price: Number(values.price),
              is_active: true,
               engineering_test_analysis: values.engineering_test_analysis,
            };

            if (editingPackage) {
              await dispatch(
                updatePackage({
                  id: editingPackage.id,
                  payload,
                })
              );
            } else {
              await dispatch(createPackage(payload));
            }

            dispatch(fetchPackages());
            setModalVisible(false);
          }}
        />
      )}


      {activeTab === "landing" && (
  <AddLandingPageModal
    visible={modalVisible}
    onClose={() => setModalVisible(false)}
    initialValues={editingLanding}
       viewMode={viewMode} 
    programs={programData}
    packages={packageData}
    onSubmit={(values) => {
      // console.log("Landing Page Payload:", values);
      setModalVisible(false);
    }}
  />
)}
    </div>
  );
};

export default Programs;
