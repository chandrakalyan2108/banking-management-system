import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await loginUser(form);
      login(res.data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <Card style={{ width: "380px" }}>
        <h2 style={{ marginBottom: "20px" }}>Welcome Back</h2>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input style={styles.input} placeholder="Username" value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          <input style={styles.input} type="password" placeholder="Password" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <button style={styles.btn} disabled={loading}>{loading ? "Signing in..." : "Sign In"}</button>
        </form>
        <p style={{ marginTop: "16px", fontSize: "0.9rem" }}>
          Don't have an account? <Link to="/register" style={{ color: "#2563eb" }}>Register</Link>
        </p>
      </Card>
    </div>
  );
}

const styles = {
  wrapper: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" },
  input: {
    width: "100%", padding: "12px", marginBottom: "12px", border: "1px solid #cbd5e1",
    borderRadius: "8px", fontSize: "1rem",
  },
  btn: {
    width: "100%", padding: "12px", background: "#2563eb", color: "#fff", border: "none",
    borderRadius: "8px", fontWeight: 600, fontSize: "1rem", marginTop: "8px",
  },
  error: { color: "#dc2626", marginBottom: "12px", fontSize: "0.9rem" },
};
