import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getCustomerByUserId, getAccountsByCustomer, transferFunds } from "../services/api";
import Card from "../components/Card";

export default function Transfer() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ fromAccountId: "", toAccountNumber: "", amount: "", remarks: "" });
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      const custRes = await getCustomerByUserId(user.userId);
      const accRes = await getAccountsByCustomer(custRes.data.id);
      setAccounts(accRes.data);
    };
    if (user) init();
  }, [user]);

  const activeAccounts = accounts.filter((a) => a.status === "ACTIVE");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setSubmitting(true);
    try {
      const res = await transferFunds({
        fromAccountId: parseInt(form.fromAccountId),
        toAccountNumber: form.toAccountNumber.trim(),
        amount: parseFloat(form.amount),
        remarks: form.remarks,
      });
      setSuccess(true);
      setMessage(`Transfer successful. Ref: ${res.data.referenceId}`);
      setForm({ fromAccountId: "", toAccountNumber: "", amount: "", remarks: "" });
    } catch (err) {
      setSuccess(false);
      setMessage(err.response?.data?.error || "Transfer failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "32px", maxWidth: "1000px", margin: "0 auto" }}>
      <h1>Transfer Funds</h1>
      <Card style={{ maxWidth: "460px", marginTop: "20px" }}>
        {message && (
          <p style={{ color: success ? "var(--success-text)" : "var(--danger-text)", marginBottom: "12px" }}>{message}</p>
        )}

        {activeAccounts.length === 0 ? (
          <p style={{ color: "var(--warning-text)" }}>
            You don't have any approved accounts yet. Apply for one on the Accounts page and wait for admin approval before you can transfer funds.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={styles.label}>From Account</label>
            <select style={styles.input} value={form.fromAccountId}
              onChange={(e) => setForm({ ...form, fromAccountId: e.target.value })} required>
              <option value="">Select account</option>
              {activeAccounts.map((a) => (
                <option key={a.id} value={a.id}>{a.accountNumber} — ₹{parseFloat(a.balance).toLocaleString("en-IN")}</option>
              ))}
            </select>

            <label style={styles.label}>To Account Number</label>
            <input style={styles.input} placeholder="e.g. AC7518998885" value={form.toAccountNumber}
              onChange={(e) => setForm({ ...form, toAccountNumber: e.target.value })} required />

            <label style={styles.label}>Amount (₹)</label>
            <input style={styles.input} type="number" step="0.01" placeholder="0.00" value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })} required />

            <label style={styles.label}>Remarks (optional)</label>
            <input style={styles.input} placeholder="e.g. Rent payment" value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })} />

            <button style={styles.btn} disabled={submitting}>{submitting ? "Processing…" : "Send Transfer"}</button>
          </form>
        )}
      </Card>
    </div>
  );
}

const styles = {
  label: { fontSize: "0.85rem", color: "var(--text-secondary)", display: "block", marginBottom: "4px" },
  input: {
    width: "100%", padding: "10px", marginBottom: "14px", border: "1px solid var(--border)",
    borderRadius: "8px", fontSize: "0.95rem",
  },
  btn: {
    width: "100%", padding: "12px", background: "#0d9488", color: "#fff", border: "none",
    borderRadius: "8px", fontWeight: 600, fontSize: "1rem",
  },
};
