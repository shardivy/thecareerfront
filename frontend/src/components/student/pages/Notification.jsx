import React from "react";
import { Avatar, Tag } from "antd";
import { CalendarFilled, BookFilled } from "@ant-design/icons";

const Notification = ({ notifications = [], onRead }) => {
  /* ================= TIME FORMAT ================= */
  const timeAgo = (dateString) => {
    if (!dateString) return "";

    const now = new Date();
    const past = new Date(dateString);
    const diff = Math.floor((now - past) / 1000);

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;

    return `${Math.floor(diff / 86400)} day ago`;
  };

  /* ================= TYPE DETECTION ================= */
  const getType = (item) => {
    if (item?.title?.toLowerCase().includes("booking")) return "booking";
    if (item?.title?.toLowerCase().includes("payment")) return "payment";
    return "general";
  };

  const getColor = (type) => {
    switch (type) {
      case "booking":
        return "blue";
      case "payment":
        return "green";
      default:
        return "default";
    }
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 460,
        maxHeight: "70vh",
        overflowY: "auto",
        padding: 8,
      }}
    >
      {notifications.length === 0 ? (
        <div style={{ textAlign: "center", padding: 20, color: "#999" }}>
          No new notifications
        </div>
      ) : (
        notifications
          .filter((item) => !item.is_read)   // 👈 hide read notifications
          .map((item) => {
            const type = getType(item);

            return (
              <div
                key={item.id}
                onClick={() => onRead(item.id)}
                style={{
                  padding: 12,
                  marginBottom: 10,
                  borderRadius: 12,
                  background: "#ffffff",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  cursor: "pointer",
                  borderLeft: "4px solid #1677ff",
                  transition: "0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f5f7fa")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#ffffff")
                }
              >
                <div style={{ display: "flex", gap: 12 }}>
                  {/* ICON */}
                  <Avatar
                    size={40}
                    style={{ backgroundColor: "#9b9ea4" }}
                    icon={
                      type === "booking" ? (
                        <CalendarFilled />
                      ) : (
                        <BookFilled />
                      )
                    }
                  />

                  {/* CONTENT */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{item.title}</div>

                    <div style={{ fontSize: 13, color: "#555" }}>
                      {item.message}
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color: "#999",
                        marginTop: 4,
                      }}
                    >
                      {timeAgo(item.created_at)}
                    </div>
                  </div>

                  {/* TAG */}
                  <Tag color={getColor(type)}>
                    {type.toUpperCase()}
                  </Tag>
                </div>
              </div>
            );
          })
      )}
    </div>
  );
};

export default Notification;