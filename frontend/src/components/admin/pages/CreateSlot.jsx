import React, { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Row,
  Col,
  Switch,
  DatePicker,
  Button,
  Space,
  Divider,
  Spin,
  Empty,
  Modal,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchSlotsByDate,
  fetchSlotsCounsellorWise,
  updateCounsellorStatus,
} from "../../../adminSlices/counsellingSlotSlice";
import CreateSlotModal from "../modals/CreateSlotModal";

const { Title, Text } = Typography;

const CreateSlot = () => {
  const dispatch = useDispatch();

  const { list, counsellorWiseList, loading } = useSelector(
    (state) => state.counsellingSlots
  );

  const [selectedDate, setSelectedDate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  /* ---------- INITIAL LOAD ---------- */
  useEffect(() => {
    dispatch(fetchSlotsCounsellorWise());
  }, [dispatch]);

  /* ---------- STATUS TOGGLE WITH CONFIRM ---------- */
  const handleStatusToggle = (checked, item) => {
    Modal.confirm({
      title: "Confirm Status Change",
      centered: true,
      content: `Are you sure you want to ${
        checked ? "activate" : "deactivate"
      } this counsellor on ${dayjs(item.date).format("DD MMM YYYY")}?`,
      okText: "Yes",
      cancelText: "No",
      onOk: () => {
        dispatch(
          updateCounsellorStatus({
            counsellor_id: item.counsellor_id,
            date: item.date,
            is_active: checked,
          })
        );
      },
    });
  };

  /* ---------- DATE CHANGE ---------- */
  const handleDateChange = (date) => {
    if (!date) {
      setSelectedDate(null);
      return;
    }

    const formatted = dayjs(date).format("YYYY-MM-DD");
    setSelectedDate(formatted);
  };

  /* ---------- DATA SOURCE ---------- */
  const normalizedList = selectedDate
    ? counsellorWiseList.filter((item) => item.date === selectedDate)
    : counsellorWiseList;

  return (
    <div style={{ padding: 16 }}>
      {/* HEADER */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Title level={4}>Manage Counselling Slots</Title>

        <Space>
          <DatePicker allowClear onChange={handleDateChange}   style={{ padding: '9px 8px' }}/>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
          >
            Create Slot
          </Button>
        </Space>
      </Row>

      {/* LOADING */}
      {loading && (
        <Row justify="center">
          <Spin />
        </Row>
      )}

      {/* NO DATA */}
      {!loading && normalizedList.length === 0 && <Empty />}

      {/* COUNSELLOR CARDS */}
      <Row gutter={[16, 16]}>
        {!loading &&
          normalizedList.map((item, index) => (
            <Col xs={24} key={index}>
              <Card bordered>
                <Row align="middle" gutter={16}>
                  <Col>
                    <Text strong>Counsellor:</Text>{" "}
                    <Text>{item.counsellor_name}</Text>
                  </Col>

                  <Col>
                    <Text strong>Date:</Text>{" "}
                    <Text>{dayjs(item.date).format("DD MMM YYYY")}</Text>
                  </Col>

                  <Col>
                    <Text strong>Status:</Text>{" "}
                    <Switch
                      checked={item.is_active}
                      onChange={(checked) =>
                        handleStatusToggle(checked, item)
                      }
                    />
                  </Col>
                </Row>

                <Divider />

                <Space wrap>
                  {item.slots?.length ? (
                    item.slots.map((slot) => (
                      <Button key={slot.slot_id}>
                        {slot.start_time} - {slot.end_time}
                      </Button>
                    ))
                  ) : (
                    <Text type="secondary">No slots available</Text>
                  )}
                </Space>
              </Card>
            </Col>
          ))}
      </Row>

      {/* CREATE SLOT MODAL */}
      <CreateSlotModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          dispatch(fetchSlotsCounsellorWise());
        }}
      />
    </div>
  );
};

export default CreateSlot;
