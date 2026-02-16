import React, { useEffect, useState, useMemo } from "react";
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
import {
  CloseOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchSlotsCounsellorWise,
  updateCounsellorStatus,
  fetchSlotsForSelectedDate,
  updateSlotAvailability,
  deleteSlot,
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

  /* ---------- GET ALL CREATED DATES ---------- */
  const createdDates = useMemo(() => {
    return [
      ...new Set(
        counsellorWiseList.map((item) =>
          dayjs(item.date).format("YYYY-MM-DD")
        )
      ),
    ];
  }, [counsellorWiseList]);

  /* ---------- DISABLE DATE LOGIC ---------- */
  const disableCreatedDates = (current) => {
    if (!current) return false;

    const formatted = current.format("YYYY-MM-DD");

    return (
      current.isBefore(dayjs().startOf("day")) ||
      createdDates.includes(formatted)
    );
  };

  /* ---------- STATUS TOGGLE ---------- */
const handleStatusToggle = (checked, item) => {
  const bookedSlotsCount =
    item.slots?.filter((slot) => slot.status === "booked").length || 0;

  if (!checked && bookedSlotsCount > 0) {
    Modal.warning({
      title: "Cannot Deactivate Counsellor",
      centered: true,
      content: `There ${
        bookedSlotsCount === 1 ? "is" : "are"
      } ${bookedSlotsCount} booked slot${
        bookedSlotsCount > 1 ? "s" : ""
      } on ${dayjs(item.date).format("DD MMM YYYY")}. 
Please go to Slot Booking and delete the booked slot(s) before making this counsellor inactive.`,
    });

    return;
  }

  Modal.confirm({
    title: "Confirm Status Change",
    centered: true,
    content: `Are you sure you want to ${
      checked ? "activate" : "deactivate"
    } this counsellor on ${dayjs(item.date).format("DD MMM YYYY")}?`,
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
  const handleDateChange = async (date) => {
    if (!date) {
      setSelectedDate(null);
      dispatch(fetchSlotsCounsellorWise());
      return;
    }

    const formatted = dayjs(date).format("YYYY-MM-DD");
    setSelectedDate(formatted);

    try {
      await dispatch(fetchSlotsForSelectedDate(formatted)).unwrap();
    } catch (error) {
      console.error("Error fetching slots:", error);
    }
  };

  /* ---------- DELETE SLOT ---------- */
  const handleDeleteSlot = (slot) => {
    Modal.confirm({
      title: "Delete Slot",
      centered: true,
      content: "Are you sure you want to delete this slot?",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await dispatch(deleteSlot(slot.slot_id)).unwrap();
          dispatch(fetchSlotsCounsellorWise());
        } catch (error) {
          console.error("Delete failed:", error);
        }
      },
    });
  };

  const normalizedList = selectedDate ? list : counsellorWiseList;

  return (
    <div style={{ padding: 16 }}>
      {/* HEADER */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Title level={4}>Manage Counselling Slots</Title>

        <Space>
          <DatePicker
            allowClear
            onChange={handleDateChange}
            disabledDate={disableCreatedDates}
          />

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
          >
            Create Slot
          </Button>
        </Space>
      </Row>

      {loading && (
        <Row justify="center">
          <Spin />
        </Row>
      )}

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
                    <Text>
                      {dayjs(item.date).format("DD MMM YYYY")}
                    </Text>
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
                    item.slots.map((slot) => {
                      const isBooked = slot.status === "booked";
                      const isDisabled =
                        !item.is_active ||
                        !slot.is_available ||
                        isBooked;

                      return (
                        <Space key={slot.slot_id} size="small">
                          {/* SLOT BUTTON */}
                          <Button
                            disabled={isDisabled}
                            type={isBooked ? "primary" : "default"}
                            danger={isBooked}
                            style={{
                              opacity: isDisabled ? 0.6 : 1,
                            }}
                          >
                            {slot.start_time} - {slot.end_time}
                          </Button>

                          {/* EYE ICON (NOT FOR BOOKED) */}
                          {!isBooked &&
                            (slot.is_available ? (
                              <EyeOutlined
                                style={{
                                  fontSize: 18,
                                  cursor: isDisabled
                                    ? "not-allowed"
                                    : "pointer",
                                  color: "green",
                                }}
                                onClick={() => {
                                  if (isDisabled) return;

                                  const newAvailability =
                                    !slot.is_available;

                                  Modal.confirm({
                                    title:
                                      "Change Slot Availability",
                                    centered: true,
                                    content: `Are you sure you want to mark this slot as ${
                                      newAvailability
                                        ? "available"
                                        : "unavailable"
                                    }?`,
                                    onOk: () => {
                                      dispatch(
                                        updateSlotAvailability({
                                          slotId: slot.slot_id,
                                          is_available:
                                            newAvailability,
                                        })
                                      );
                                    },
                                  });
                                }}
                              />
                            ) : (
                              <EyeInvisibleOutlined
                                style={{
                                  fontSize: 18,
                                  cursor: isDisabled
                                    ? "not-allowed"
                                    : "pointer",
                                  color: "gray",
                                }}
                                onClick={() => {
                                  if (isDisabled) return;

                                  const newAvailability =
                                    !slot.is_available;

                                  dispatch(
                                    updateSlotAvailability({
                                      slotId: slot.slot_id,
                                      is_available:
                                        newAvailability,
                                    })
                                  );
                                }}
                              />
                            ))}

                          {/* DELETE ICON (ONLY WHEN ACTIVE + NOT BOOKED) */}
                          {slot.is_available &&
                            !isBooked &&
                            item.is_active && (
                              <CloseOutlined
                                style={{
                                  fontSize: 16,
                                  color: "#ff4d4f",
                                  cursor: "pointer",
                                }}
                                onClick={() =>
                                  handleDeleteSlot(slot)
                                }
                              />
                            )}
                        </Space>
                      );
                    })
                  ) : (
                    <Text type="secondary">
                      No slots available
                    </Text>
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
