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
      <Link to="/" style={styles.brand}>
        <span style={styles.brandIcon}>🏦</span> MIM Bank
      </Link>
      <div style={styles.links}>
        {user ? (
          <>
            <Link to="/dashboard" style={styles.link}>Dashboard</Link>
            <Link to="/accounts" style={styles.link}>Accounts</Link>
            <Link to="/transfer" style={styles.link}>Transfer</Link>
            <Link to="/transactions" style={styles.link}>History</Link>
            {user.role === "ADMIN" && (
              <Link to="/admin" style={styles.adminLink}>Admin</Link>
            )}
            <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.link}>Login</Link>
            <Link to="/register" style={styles.registerBtn}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "16px 32px", background: "linear-gradient(135deg, #0b1120 0%, #151f38 100%)",
    color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  brand: { fontSize: "1.15rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "8px" },
  brandIcon: { fontSize: "1.3rem" },
  links: { display: "flex", gap: "22px", alignItems: "center" },
  link: { color: "#cbd5e1", fontWeight: 500, fontSize: "0.92rem" },
  adminLink: { color: "#2dd4bf", fontWeight: 700, fontSize: "0.92rem" },
  registerBtn: {
    background: "#0d9488", color: "#fff", padding: "8px 18px", borderRadius: "8px", fontWeight: 600, fontSize: "0.9rem",
  },
  logoutBtn: {
    background: "rgba(220,38,38,0.15)", color: "#fca5a5", border: "1px solid rgba(220,38,38,0.3)",
    padding: "8px 16px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem",
  },
};
