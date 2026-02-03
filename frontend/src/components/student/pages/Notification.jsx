import React from "react";
import { Avatar, Button, Tag } from "antd";
import {
  CalendarFilled,
  BookFilled,
} from "@ant-design/icons";

const Notification = ({ notifications, setNotifications }) => {
  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
  };

  return (
    <div
      style={{
        width: 360,
        maxHeight: 420,
        overflowY: "auto",
        padding: 8,
      }}
    >
      {notifications.length === 0 ? (
        <div style={{ textAlign: "center", padding: 20, color: "#999" }}>
          No new notifications 🎉
        </div>
      ) : (
        notifications.map((item) => (
          <div
            key={item.id}
            onClick={() => markAsRead(item.id)}
            style={{
              padding: 12,
              marginBottom: 10,
              borderRadius: 12,
              background: item.read ? "#f9fafb" : "#ffffff",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              cursor: "pointer",
              borderLeft: item.read ? "none" : "4px solid #d7d9dc",
            }}
          >
            <div style={{ display: "flex", gap: 12 }}>
              <Avatar
                size={40}
                style={{
                  backgroundColor: item.read ? "#ffffff" : "#f5f7fa",
                }}
                icon={
                  item.type === "exam" ? (
                    <CalendarFilled />
                  ) : (
                    <BookFilled />
                  )
                }
              />

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: "#555" }}>
                  {item.description}
                </div>
                <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
                  Just now
                </div>
              </div>

              <Tag color="default">{item.type.toUpperCase()}</Tag>
            </div>
          </div>
        ))
      )}

      {/* {notifications.length > 0 && (
        <div style={{ textAlign: "center" }}>
          <Button type="link" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        </div>
      )} */}
    </div>
  );
};

export default Notification;
