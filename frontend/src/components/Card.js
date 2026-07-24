import React from "react";

export default function Card({ children, style }) {
  return (
    <div style={{
      background: "#fff", borderRadius: "12px", padding: "24px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)", ...style,
    }}>
      {children}
    </div>
  );
}
