"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useNotifications } from "../context/NotificationsContext";

const NotificationsDropdown: React.FC = () => {
  const pathname = usePathname();

  // Pages where notification icon and dropdown should be hidden:
  const noNotificationPages = [
    "/login",
    "/signup",
    "/forgot-password",
    "/",
    "/settings",
    "/admin", // optional admin config pages
  ];

  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead } = useNotifications();

  // Instead of returning null early which skips hooks,
  // always render component but conditionally hide via style
  const shouldHideNotifications = noNotificationPages.includes(pathname);

  useEffect(() => {
    if (open && shouldHideNotifications) {
      setOpen(false);
    }
  }, [pathname, open, shouldHideNotifications]);

  const toggleDropdown = () => setOpen((prev) => !prev);

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  if (shouldHideNotifications) {
    return <></>;
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={toggleDropdown}
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24"
          width="24"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 22c1.1 0 1.99-.9 1.99-2H10c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5S10.5 3.17 10.5 4v.68C7.63 5.36 6 7.92 6 11v5l-1.7 1.7c-.14.14-.3.25-.47.33H20c-.17-.08-.33-.19-.47-.33L18 16z" />
        </svg>
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -5,
              right: -5,
              backgroundColor: "red",
              color: "white",
              borderRadius: "50%",
              padding: "2px 6px",
              fontSize: "12px",
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            marginTop: 5,
            width: 300,
            maxHeight: 400,
            overflowY: "auto",
            backgroundColor: "white",
            border: "1px solid #ccc",
            borderRadius: 4,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            zIndex: 1000,
          }}
        >
          {notifications.length === 0 ? (
            <div style={{ padding: 10 }}>No notifications</div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif._id}
                style={{
                  padding: "10px",
                  cursor: "pointer",
                  backgroundColor: notif.read ? "white" : "#e6f7ff",
                  borderBottom: "1px solid #f0f0f0",
                }}
                onClick={() => handleMarkAsRead(notif._id)}
                title={new Date(notif.createdAt).toLocaleString()}
              >
                <div>{notif.message}</div>
                <small style={{ color: "#888" }}>
                  {new Date(notif.createdAt).toLocaleString()}
                </small>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;
