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
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  const { list, counsellorWiseList, loading } = useSelector(
    (state) => state.counsellingSlots
  );

  // ✅ Default to today
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );

  const [modalOpen, setModalOpen] = useState(false);

  /* ---------- INITIAL LOAD ---------- */
  useEffect(() => {
    // 🔥 Always load today's data first
    dispatch(fetchSlotsForSelectedDate(selectedDate));
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

    const today = dayjs();

    // ❌ Only disable past dates
    return current.isBefore(today.startOf("day"));
  };

  const isSlotTimePassed = (slotStartTime, slotDate) => {
    if (!slotStartTime || !slotDate) return false;

    const today = dayjs().format("YYYY-MM-DD");

    // Only check for today's date
    if (slotDate !== today) return false;

    const now = dayjs();

    // Combine slot date + start time
    const slotDateTime = dayjs(
      `${slotDate} ${slotStartTime}`,
      "YYYY-MM-DD hh:mm A"
    );

    return now.isAfter(slotDateTime);
  };


  /* ---------- STATUS TOGGLE ---------- */
  const handleStatusToggle = (checked, item) => {
    const bookedSlotsCount =
      item.slots?.filter((slot) => slot.status === "booked" || slot.status === "rescheduled").length || 0;

    if (!checked && bookedSlotsCount > 0) {
      Modal.warning({
        title: "Cannot Deactivate Counsellor",
        centered: true,
        content: `There ${bookedSlotsCount === 1 ? "is" : "are"
          } ${bookedSlotsCount} booked slot${bookedSlotsCount > 1 ? "s" : ""
          } on ${dayjs(item.date).format(
            "DD MMM YYYY"
          )}. Please go to Slot Booking and delete the booked slot(s) before making this counsellor inactive.`,
      });
      return;
    }

    Modal.confirm({
      title: "Confirm Status Change",
      centered: true,
      content: `Are you sure you want to ${checked ? "activate" : "deactivate"
        } this counsellor on ${dayjs(item.date).format("DD MMM YYYY")}?`,
      onOk: async () => {
        await dispatch(
          updateCounsellorStatus({
            counsellor_id: item.counsellor_id,
            date: item.date,
            is_active: checked,
          })
        );

        // 🔥 Refresh selected date data
        dispatch(fetchSlotsForSelectedDate(selectedDate));
      },
    });
  };

  /* ---------- SLOT AVAILABILITY ---------- */
  const handleAvailabilityToggle = (slot, item) => {
    if (!item.is_active || slot.status === "booked" || slot.status === "rescheduled") return;

    const newAvailability = !slot.is_available;

    Modal.confirm({
      title: "Change Slot Availability",
      centered: true,
      content: `Are you sure you want to mark this slot as ${newAvailability ? "available" : "unavailable"
        }?`,
      onOk: async () => {
        await dispatch(
          updateSlotAvailability({
            slotId: slot.slot_id,
            is_available: newAvailability,
          })
        );

        // 🔥 Refresh selected date data
        dispatch(fetchSlotsForSelectedDate(selectedDate));
      },
    });
  };

  /* ---------- DATE CHANGE ---------- */
  const handleDateChange = async (date) => {
    const formatted = date
      ? dayjs(date).format("YYYY-MM-DD")
      : dayjs().format("YYYY-MM-DD"); // fallback to today

    setSelectedDate(formatted);

    try {
      await dispatch(fetchSlotsForSelectedDate(formatted)).unwrap();
    } catch (error) {
      // console.error("Error fetching slots:", error);
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

          // 🔥 Refresh selected date data
          dispatch(fetchSlotsForSelectedDate(selectedDate));
        } catch (error) {
          // console.error("Delete failed:", error);
        }
      },
    });
  };

  // ✅ If selectedDate exists → use list
  // otherwise fallback to counsellorWiseList (kept your logic)
  const normalizedList = selectedDate ? list : counsellorWiseList;




  return (
    <div style={{ padding: 16 }}>
      {/* HEADER */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Title level={4}>Manage Counselling Slots</Title>

        <Space>

          <Button
            icon={<CalendarOutlined />}
            onClick={() => navigate("/s-admin/scheduler")}
          >
            {/* View Scheduler */}
          </Button>

          <DatePicker
            allowClear
            value={selectedDate ? dayjs(selectedDate) : null}
            onChange={handleDateChange}
            disabledDate={disableCreatedDates}
            style={{ width: 150, padding: 9 }}
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
                      const isBooked = slot.status === "booked" || slot.status === "rescheduled";
                      const isTimePassed = isSlotTimePassed(
                        slot.start_time,
                        item.date
                      );

                      const isButtonDisabled =
                        !item.is_active ||
                        !slot.is_available ||
                        isBooked ||
                        isTimePassed;   // ✅ NEW CONDITION


                      const isEyeDisabled =
                        !item.is_active || isBooked || isTimePassed;



                      return (
                        <Space key={slot.slot_id} size="small">
                          <Button
                            disabled={isButtonDisabled}
                            type={isBooked ? "primary" : "default"}
                            danger={isBooked}
                            style={{
                              opacity: isButtonDisabled ? 0.6 : 1,
                            }}
                          >
                            {slot.start_time}
                          </Button>

                          {/* Only show eye icon if counsellor is active */}
                          {item.is_active && !isBooked && !isTimePassed && (
                            slot.is_available ? (
                              <EyeOutlined
                                style={{
                                  fontSize: 18,
                                  cursor: isEyeDisabled
                                    ? "not-allowed"
                                    : "pointer",
                                  color: "green",
                                  opacity: isEyeDisabled ? 0.5 : 1,
                                }}
                                onClick={() => {
                                  if (!isEyeDisabled) {
                                    handleAvailabilityToggle(
                                      slot,
                                      item
                                    );
                                  }
                                }}
                              />
                            ) : (
                              <EyeInvisibleOutlined
                                style={{
                                  fontSize: 18,
                                  cursor: isEyeDisabled
                                    ? "not-allowed"
                                    : "pointer",
                                  color: "gray",
                                  opacity: isEyeDisabled ? 0.5 : 1,
                                }}
                                onClick={() => {
                                  if (!isEyeDisabled) {
                                    handleAvailabilityToggle(
                                      slot,
                                      item
                                    );
                                  }
                                }}
                              />
                            )
                          )}

                          {/* Only show delete icon if counsellor is active and slot is available and not booked */}
                          {item.is_active && slot.is_available && !isBooked && !isTimePassed && (

                            <CloseOutlined
                              style={{
                                fontSize: 16,
                                color: "#ff4d4f",
                                cursor: "pointer",
                              }}
                              onClick={() => handleDeleteSlot(slot)}
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

      <CreateSlotModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onSuccess={(createdDate) => {
          setModalOpen(false);

          // 🔥 update selected date
          setSelectedDate(createdDate);

          // 🔥 fetch newly created date data
          dispatch(fetchSlotsForSelectedDate(createdDate));
        }}
      />

    </div>
  );
};

export default CreateSlot;
