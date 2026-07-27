import React from "react";

export default function Card({ children, style }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: "16px",
      padding: "24px",
      border: "1px solid #eef1f6",
      boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.06)",
      ...style,
    }}>
      {children}
    </div>
  );
}
