import React, { useEffect, useState } from "react";
import {
  Calendar,
  Card,
  Typography,
  Row,
  Col,
  Tag,
  Spin,
  Tooltip,
} from "antd";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { fetchSlotsCounsellorWiseScheduler } from "../../../adminSlices/counsellingSlotSlice";

const { Title, Text } = Typography;

const SchedulerPage = () => {
  const dispatch = useDispatch();

  const { counsellorWiseList, loading } = useSelector(
    (state) => state.counsellingSlots
  );

  const [selectedDate, setSelectedDate] = useState(dayjs());
  const isMobile = window.innerWidth < 768;
  

  /* ---------- COLOR LOGIC ---------- */
  const getBookingColor = (count) => {
    if (count === 0) return "default"; // no bookings
    if (count <= 5) return "green";    // low bookings
    return "red";                      // high bookings
  };

  /* ---------- LOAD DATA ---------- */
  useEffect(() => {
    dispatch(
      fetchSlotsCounsellorWiseScheduler({
        year: selectedDate.year(),
        month: selectedDate.month() + 1,
      })
    );
  }, [dispatch, selectedDate]);

  /* ---------- HANDLE DATE CLICK ---------- */
  const onSelect = (date) => {
    setSelectedDate(date);
  };

  /* ---------- FILTER SELECTED DATE ---------- */
  const selectedSlots = counsellorWiseList.filter(
    (item) =>
      dayjs(item.date).format("YYYY-MM-DD") ===
      selectedDate.format("YYYY-MM-DD")
  );

  /* ---------- CALENDAR CELL RENDER ---------- */
  const dateCellRender = (date) => {
    const formatted = date.format("YYYY-MM-DD");

    const slotsForDate = counsellorWiseList.filter(
      (item) => dayjs(item.date).format("YYYY-MM-DD") === formatted
    );

    if (slotsForDate.length === 0) return null;

    const counsellorCount = new Set(
      slotsForDate.map((item) => item.counsellor_id)
    ).size;

    const totalBookings = slotsForDate.reduce(
      (acc, item) =>
        acc +
        (item.slots?.filter(
          (slot) =>
            slot.status === "booked" ||
            slot.status === "rescheduled"
        ).length || 0),
      0
    );

    const bookingColor = getBookingColor(totalBookings);

    return (
      <div>
        <Tag color="blue" style={{ fontSize: 10, marginBottom: 2 }}>
          {counsellorCount} Counsellors
        </Tag>
        <br />
        <Tag color={bookingColor} style={{ fontSize: 10 }}>
          {totalBookings} Bookings
        </Tag>
      </div>
    );
  };

  return (
    <div style={{ padding: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 16,
          gap: 12,
        }}
      >
        {/* LEFT: TITLE */}
        <Title level={3} style={{ margin: 0 }}>
          📅 Scheduler
        </Title>

        {/* RIGHT: BOOKING STATUS */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#fafafa",
            padding: "6px 12px",
            borderRadius: 20,
            border: "1px solid #eee",
          }}
        >
          <Text strong style={{ fontSize: 13 }}>
            Booking Status:
          </Text>

          <Tooltip title="No bookings for this day">
            <Tag
              color="default"
              style={{ borderRadius: 20, padding: "2px 10px" }}
            >
              0
            </Tag>
          </Tooltip>

          <Tooltip title="Low bookings (1 to 5)">
            <Tag
              color="green"
              style={{ borderRadius: 20, padding: "2px 10px" }}
            >
              1–5
            </Tag>
          </Tooltip>

          <Tooltip title="High booking load">
            <Tag
              color="red"
              style={{ borderRadius: 20, padding: "2px 10px" }}
            >
              5+
            </Tag>
          </Tooltip>
        </div>
      </div>

    <Row gutter={16} align="stretch">
        {/* LEFT: CALENDAR */}
        <Col xs={24} md={14}>
          <Card style={{ borderRadius: 16 }}>
            {loading ? (
              <Spin />
            ) : (
              <Calendar
                value={selectedDate}
                onSelect={onSelect}
                dateCellRender={dateCellRender}
              />
            )}
          </Card>
        </Col>

        {/* RIGHT: SLOT DETAILS */}
        <Col xs={24} md={10}>
          <Card
            style={{
              borderRadius: 16,
              padding: 12,
            }}
          >
            {/* HEADER */}
            <div
              style={{
                position: "sticky",
                top: 0,
                background: "#fff",
                zIndex: 1,
                paddingBottom: 10,
              }}
            >
              <Title
                level={5}
                style={{
                  margin: 0,
                  fontSize: isMobile ? 14 : 18,
                }}
              >
                Slots on {selectedDate.format("DD MMM YYYY")}
              </Title>
            </div>

            {/* SCROLL AREA */}
            <div
              style={{
                maxHeight: window.innerWidth < 576 ? "60vh" : "70vh",
                overflowY: "auto",
                paddingRight: 4,
                marginTop: 8,
              }}
            >
              {selectedSlots.length === 0 ? (
                <Text type="secondary">No slots available</Text>
              ) : (
                selectedSlots.map((item, index) => {
                  const bookedCount =
                    item.slots?.filter(
                      (slot) =>
                        slot.status === "booked" ||
                        slot.status === "rescheduled"
                    ).length || 0;

                  const bookingColor = getBookingColor(bookedCount);

                  return (
                    <div
                      key={index}
                      style={{
                        marginBottom: 16,
                        padding: 10,
                        borderRadius: 10,
                        border: "1px solid #f0f0f0",
                        background: "#fff",
                      }}
                    >
                      {/* COUNSELLOR NAME */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 6,
                        }}
                      >
                        <Text strong style={{ fontSize: isMobile ? 13 : 16 }}>
                          {item.counsellor_name}
                        </Text>

                        <Tag
                          color={bookingColor}
                          style={{
                            borderRadius: 12,
                            fontSize: isMobile ? 11 : 13,
                            padding: isMobile ? "0 8px" : "2px 12px",
                          }}
                        >
                          {bookedCount} Bookings
                        </Tag>
                      </div>

                      {/* SLOTS */}
                      <div style={{ marginTop: 8 }}>
                        {item.slots?.map((slot) => {
                          const isBooked =
                            slot.status === "booked" ||
                            slot.status === "rescheduled";

                          return (
                            <div
                              key={slot.slot_id}
                              style={{
                                marginBottom: 8,
                                padding: 8,
                                borderRadius: 8,
                                background: "#fafafa",
                              }}
                            >
                              {/* SLOT TIME */}
                              <Tag
                                color={isBooked ? bookingColor : "green"}
                                style={{
                                  marginBottom: 5,
                                  fontSize: isMobile ? 11 : 13,
                                  padding: isMobile ? "0 6px" : "2px 10px",

                                }}
                              >
                                {slot.start_time} - {slot.end_time}
                              </Tag>

                              {/* STUDENT DETAILS */}
                              {isBooked && (
                                <div
                                  style={{
                                    marginTop: 4,
                                    fontSize: isMobile ? 11 : 14,   // 🔥 bigger text
                                    lineHeight: isMobile ? "16px" : "20px",
                                  }}
                                >
                                  <div>
                                    <strong>Name:</strong>{" "}
                                    {slot.student_name || "N/A"}
                                  </div>

                                  <div>
                                    <strong>Email:</strong>{" "}
                                    <span
                                      style={{
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      {slot.student_email || "N/A"}
                                    </span>
                                  </div>

                                  <div>
                                    <strong>Mode:</strong>{" "}
                                    {slot.preferred_mode || "N/A"}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SchedulerPage;