import React, { useState } from "react";
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
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";

import { fetchSlotsByDate } from "../../../adminSlices/counsellingSlotSlice";
import CreateSlotModal from "../modals/CreateSlotModal";

const { Title, Text } = Typography;

const counsellors = [
  { id: 1, name: "John Doe" },
  { id: 2, name: "Alice Brown" },
  { id: 3, name: "Jane Smith" },
];

const CreateSlot = () => {
  const dispatch = useDispatch();
  const { list, loading } = useSelector(
    (state) => state.counsellingSlots
  );

  const [selectedDates, setSelectedDates] = useState({});
  const [modalOpen, setModalOpen] = useState(false);

  // Date change → API call
  const handleDateChange = (date, counsellorId) => {
    const formattedDate = dayjs(date).format("YYYY-MM-DD");

    setSelectedDates((prev) => ({
      ...prev,
      [counsellorId]: formattedDate,
    }));

    dispatch(
      fetchSlotsByDate({
        date: formattedDate,
        counsellorId,
      })
    );
  };

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Title level={4}>Manage Counselling Slots</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
        >
          Create Slot
        </Button>
      </Row>

      {/* Cards */}
      <Row gutter={[16, 16]}>
        {counsellors.map((counsellor) => {
          const slotsForCounsellor = list.filter(
            (s) => s.counsellor_id === counsellor.id
          );

          return (
            <Col xs={24} key={counsellor.id}>
              <Card bordered>
                <Row align="middle" gutter={16}>
                  <Col>
                    <Text strong>Counsellor:</Text>{" "}
                    <Text>{counsellor.name}</Text>
                  </Col>

                  <Col>
                    <Text strong>Date:</Text>{" "}
                    <DatePicker
                      value={
                        selectedDates[counsellor.id]
                          ? dayjs(selectedDates[counsellor.id])
                          : null
                      }
                      onChange={(date) =>
                        handleDateChange(date, counsellor.id)
                      }
                    />
                  </Col>

                  <Col>
                    <Text strong>Status:</Text>{" "}
                    <Switch defaultChecked />
                  </Col>
                </Row>

                <Divider />

                {loading ? (
                  <Spin />
                ) : (
                  <Space wrap>
                    {slotsForCounsellor.length > 0 ? (
                      slotsForCounsellor.map((slot) =>
                        slot.time_slots.map((time, i) => (
                          <Button key={i}>{time}</Button>
                        ))
                      )
                    ) : (
                      <Text type="secondary">No slots available</Text>
                    )}
                  </Space>
                )}
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Modal */}
      <CreateSlotModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
};

export default CreateSlot;
