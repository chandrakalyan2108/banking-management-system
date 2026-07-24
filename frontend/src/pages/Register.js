import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser, createCustomerProfile } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "", fullName: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const authRes = await registerUser(form);
      login(authRes.data);
      await createCustomerProfile({
        userId: authRes.data.userId,
        fullName: form.fullName || form.username,
        email: form.email,
        phone: form.phone,
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <Card style={{ width: "400px" }}>
        <h2 style={{ marginBottom: "20px" }}>Create Account</h2>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input style={styles.input} placeholder="Full Name" value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          <input style={styles.input} placeholder="Username" value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          <input style={styles.input} type="email" placeholder="Email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input style={styles.input} placeholder="Phone" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input style={styles.input} type="password" placeholder="Password (min 6 chars)" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
          <button style={styles.btn} disabled={loading}>{loading ? "Creating..." : "Create Account"}</button>
        </form>
        <p style={{ marginTop: "16px", fontSize: "0.9rem" }}>
          Already have an account? <Link to="/login" style={{ color: "#2563eb" }}>Sign in</Link>
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
