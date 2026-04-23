import React, { useState, useEffect } from "react";
import { Modal, Card, Row, Col, Button, Typography, Spin, Tag, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  getCertificateTemplates,
  generateCertificates, 
  getIssuedCertificates,
} from "../../../hhSlices/certificateSlice";
import { getHandholdingParticipants } from "../../../hhSlices/handholdingUsersSlice";

const { Title } = Typography;

const CertificateTemplateModal = ({
  open,
  onClose,
  selectedUser, // ✅ PASS USER FROM PARENT
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const dispatch = useDispatch();
  const { templates, loading, generateLoading } = useSelector(
    (state) => state.certificate
  );

  // ✅ Fetch templates when modal opens
  useEffect(() => {
    if (open) {
      dispatch(getCertificateTemplates());
    }
  }, [open, dispatch]);

  // ✅ ISSUE CERTIFICATE API CALL
  const handleIssue = async () => {
    if (!selectedTemplate || !selectedUser) return;

    try {
      await dispatch(
        generateCertificates({
          template_id: selectedTemplate.id,
           participant_ids: [selectedUser.id]
        })
      ).unwrap();

      message.success("Certificate issued successfully");
         dispatch(getHandholdingParticipants());

      // reset + close
      setSelectedTemplate(null);
      onClose();

    } catch (err) {
      message.error(err?.message || "Failed to issue certificate");
    }
  };

  return (
   <Modal
  title="Select Certificate Template"
  open={open}
  onCancel={() => {
    setSelectedTemplate(null);
    onClose();
  }}
  width={800}
  centered
  bodyStyle={{
    maxHeight: "60vh",   // ✅ limit height
    overflowY: "auto",   // ✅ enable vertical scroll
    paddingRight: 8,     // optional (avoid scrollbar overlap)
  }}
  footer={
    <Button
      type="primary"
      loading={generateLoading}
      disabled={!selectedTemplate}
      onClick={handleIssue}
    >
      Issue Certificate
    </Button>
  }
>
      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {templates?.length > 0 ? (
            templates.map((tpl) => (
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
      src={tpl.template_file}
      style={{
        height: 150,
        objectFit: "cover",
      }}
    />
  }
>
  <Title level={5}>{tpl.name}</Title>
  <Tag color="green">Active</Tag>

  {/* ✅ SELECT BUTTON (same as Generate modal) */}
  <Button
    block
    style={{ marginTop: 10 }}
    type={selectedTemplate?.id === tpl.id ? "primary" : "default"}
    onClick={(e) => {
      e.stopPropagation(); // ✅ prevent double trigger
      setSelectedTemplate(tpl);
    }}
  >
    {selectedTemplate?.id === tpl.id ? "Selected" : "Select"}
  </Button>
</Card>
              </Col>
            ))
          ) : (
            <Col span={24} style={{ textAlign: "center", padding: 40 }}>
              No Templates Found
            </Col>
          )}
        </Row>
      )}
    </Modal>
  );
};

export default CertificateTemplateModal;