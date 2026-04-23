import React, { useState, useEffect } from "react";
import {
  Modal,
  Card,
  Row,
  Col,
  Button,
  Tag,
  Select,
  Typography,
  message,
  Spin,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  getCertificateTemplates,
  getPendingCertificates,
  generateCertificates,
} from "../../../hhSlices/certificateSlice";

const { Title } = Typography;

const GenerateCertificateModal = ({ open, onClose }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);

  const dispatch = useDispatch();

  const {
    templates,
    loading,
    pendingStudents,
    pendingLoading,
    generateLoading,
  } = useSelector((state) => state.certificate);

  // ================= FETCH DATA =================
  useEffect(() => {
    if (!open) return;

    dispatch(getCertificateTemplates());
    dispatch(getPendingCertificates());
  }, [open, dispatch]);

  // ================= RESET STATE =================
  useEffect(() => {
    if (!open) {
      setSelectedTemplate(null);
      setSelectedStudents([]);
    }
  }, [open]);

  // ================= SUBMIT =================
  const handleSubmit = async () => {
    if (!selectedTemplate || selectedStudents.length === 0) {
      message.warning("Please select a template and at least one user");
      return;
    }

    try {
      const payload = {
        template_id: selectedTemplate.id,
        participant_ids: selectedStudents,
      };

      await dispatch(generateCertificates(payload)).unwrap();

      message.success("Certificates generated successfully");

      onClose();
      setSelectedTemplate(null);
      setSelectedStudents([]);
    } catch (err) {
      message.error(err?.message || "Failed to generate certificates");
    }
  };

  return (
    <Modal
      title={
        <div style={{ fontSize: 20, fontWeight: 700 }}>
          Generate Certificates
        </div>
      }
      open={open}
      centered
      onCancel={onClose}
      width={850}
        bodyStyle={{
    maxHeight: "70vh",   // 🔥 control height
    overflowY: "auto",   // 🔥 enable scroll
    paddingRight: 12,    // optional (avoid scrollbar overlap)
  }}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={generateLoading}
          onClick={handleSubmit}
        >
          Generate
        </Button>,
      ]}
    >
      {/* ================= TEMPLATE SECTION ================= */}
      <Title level={5}>Select Certificate Template</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {loading ? (
          <Col span={24} style={{ textAlign: "center", padding: 20 }}>
            <Spin />
          </Col>
        ) : (
          templates?.map((tpl) => (
            <Col xs={24} sm={12} md={8} key={tpl.id}>
              <Card
                hoverable
                onClick={() => setSelectedTemplate(tpl)}
                style={{
                  borderRadius: 12,
                  border:
                    selectedTemplate?.id === tpl.id
                      ? "2px solid #1677ff"
                      : "1px solid #eee",
                  cursor: "pointer",
                }}
                cover={
                  <img
                    alt={tpl.name}
                    src={tpl.template_file || "/cert-placeholder.png"}
                    style={{
                      height: 180,
                      width: "100%",
                      objectFit: "cover",
                    }}
                  />
                }
              >
                <Title level={5}>{tpl.name}</Title>
                <Tag color="green">Active</Tag>

                <Button
                  block
                  style={{ marginTop: 10 }}
                  type={
                    selectedTemplate?.id === tpl.id ? "primary" : "default"
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTemplate(tpl);
                  }}
                >
                  {selectedTemplate?.id === tpl.id ? "Selected" : "Select"}
                </Button>
              </Card>
            </Col>
          ))
        )}
      </Row>

      {/* ================= STUDENT SECTION ================= */}
      <Title level={5}>Select Users</Title>

      <Select
        mode="multiple"
        allowClear
        placeholder="Select users"
        style={{ width: "100%", marginBottom: 20 }}
        value={selectedStudents}
        onChange={setSelectedStudents}
        loading={pendingLoading}
        optionLabelProp="label"
      >
        {pendingStudents?.map((s) => (
          <Select.Option
            key={s.participant_id}
            value={s.participant_id}
            label={s.name}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: 500 }}>{s.name}</span>
              <span style={{ fontSize: 12, color: "#888" }}>
                {s.email}
              </span>
            </div>
          </Select.Option>
        ))}
      </Select>
    </Modal>
  );
};

export default GenerateCertificateModal;