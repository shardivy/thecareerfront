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


const handleStatusToggle = (checked, item) => {
  dispatch(
 updateCounsellorStatus({
  counsellor_id: item.counsellor_id,
  date: dayjs(item.date).format("YYYY-MM-DD"),
  is_active: checked, // ✅ correct key
})

  )
    .unwrap()
    .then(() => {
      dispatch(fetchSlotsCounsellorWise());
    });
};


  /* ---------- DATE CHANGE ---------- */
  const handleDateChange = (date) => {
    if (!date) return;
    const formatted = dayjs(date).format("YYYY-MM-DD");
    setSelectedDate(formatted);

    dispatch(
      fetchSlotsByDate({
        date: formatted,
      })
    );
  };

  /* ---------- DATA SOURCE SWITCH ---------- */
  const dataSource = selectedDate ? list : counsellorWiseList;

  return (
    <div style={{ padding: 16 }}>
      {/* HEADER */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Title level={4}>Manage Counselling Slots</Title>

        <Space>
          <DatePicker onChange={handleDateChange} />
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
      {!loading && dataSource.length === 0 && <Empty />}

      {/* COUNSELLOR CARDS */}
      <Row gutter={[16, 16]}>
        {!loading &&
          dataSource.map((item, index) => (
            <Col xs={24} key={index}>
              <Card bordered>
                {/* HEADER */}
                <Row align="middle" gutter={16}>
                  <Col>
                    <Text strong>Counsellor:</Text>{" "}
                    <Text>{item.counsellor_name}</Text>
                  </Col>

                  <Col>
                    <Text strong>Date:</Text>{" "}
                    <Text>
                      {dayjs(item.date).format("DD MMM YYYY")}
                    </Text>
                  </Col>

                  <Col>
                    <Text strong>Status:</Text>{" "}
                   <Switch
  checked={item.counsellor_is_active}
  onChange={(checked) => handleStatusToggle(checked, item)}
/>

                  </Col>
                </Row>

                <Divider />

                {/* SLOTS */}
                <Space wrap>
                  {item.slots && item.slots.length > 0 ? (
                    item.slots.map((slot) => (
                      <Button key={slot.id}>
                        {slot.start_time} - {slot.end_time}
                      </Button>
                    ))
                  ) : (
                    <Text type="colorTextSecondary">No slots available</Text>
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
      />
    </div>
  );
};

export default CreateSlot;
