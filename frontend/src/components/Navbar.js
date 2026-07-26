import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>🏦 Banking Management System</Link>
      <div style={styles.links}>
        {user ? (
          <>
            <Link to="/dashboard" style={styles.link}>Dashboard</Link>
            <Link to="/accounts" style={styles.link}>Accounts</Link>
            <Link to="/transfer" style={styles.link}>Transfer</Link>
            <Link to="/transactions" style={styles.link}>History</Link>
            {user.role === "ADMIN" && (
              <Link to="/admin" style={{ ...styles.link, color: "#fbbf24", fontWeight: 700 }}>Admin</Link>
            )}
            <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.link}>Login</Link>
            <Link to="/register" style={styles.link}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "16px 32px", background: "#0f172a", color: "#fff",
  },
  brand: { fontSize: "1.2rem", fontWeight: 700, color: "#fff" },
  links: { display: "flex", gap: "20px", alignItems: "center" },
  link: { color: "#cbd5e1", fontWeight: 500 },
  logoutBtn: {
    background: "#dc2626", color: "#fff", border: "none",
    padding: "8px 16px", borderRadius: "6px", fontWeight: 600,
  },
};
