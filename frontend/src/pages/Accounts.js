import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getCustomerByUserId, getAccountsByCustomer, openAccount, withdrawFromAccount } from "../services/api";
import Card from "../components/Card";

const mask = (num) => (num ? "•••• " + num.slice(-4) : "");

const emptyForm = {
  accountType: "SAVINGS",
  initialDeposit: "",
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  aadharNumber: "",
  panNumber: "",
  place: "",
};

export default function Accounts() {
  const { user } = useAuth();
  const [customerId, setCustomerId] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [amounts, setAmounts] = useState({});
  const [confirming, setConfirming] = useState(null);
  const [processing, setProcessing] = useState(null);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  const isAdmin = user?.role === "ADMIN";

  const loadAccounts = async (custId) => {
    const res = await getAccountsByCustomer(custId);
    setAccounts(res.data);
  };

  useEffect(() => {
    const init = async () => {
      if (isAdmin) return; // Admins don't apply for or hold a personal account here
      const custRes = await getCustomerByUserId(user.userId);
      setCustomerId(custRes.data.id);
      await loadAccounts(custRes.data.id);
    };
    if (user) init();
  }, [user, isAdmin]);

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = "Required";
    if (!form.lastName.trim()) errs.lastName = "Required";
    if (!form.dateOfBirth) errs.dateOfBirth = "Required";
    if (!/^\d{12}$/.test(form.aadharNumber)) errs.aadharNumber = "Must be exactly 12 digits";
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.panNumber.toUpperCase())) errs.panNumber = "Format: ABCDE1234F";
    if (!form.place.trim()) errs.place = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleOpenAccount = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!validate()) return;
    try {
      await openAccount({
        customerId,
        accountType: form.accountType,
        initialDeposit: parseFloat(form.initialDeposit) || 0,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        dateOfBirth: form.dateOfBirth,
        aadharNumber: form.aadharNumber,
        panNumber: form.panNumber.toUpperCase(),
        place: form.place.trim(),
      });
      setForm(emptyForm);
      setMessage("Application submitted. Your account will be usable once an admin approves it.");
      await loadAccounts(customerId);
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to submit application.");
    }
  };

  const requestWithdraw = (id) => {
    const amount = parseFloat(amounts[id]);
    if (!amount || amount <= 0) return;
    setConfirming(id);
  };

  const confirmWithdraw = async (id) => {
    const amount = parseFloat(amounts[id]);
    setConfirming(null);
    setProcessing(id);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    try {
      const res = await withdrawFromAccount(id, amount);
      setAmounts({ ...amounts, [id]: "" });
      setMessage(`Withdrawal successful. Ref: ${res.data.referenceId}.`);
      await loadAccounts(customerId);
    } catch (err) {
      setMessage(err.response?.data?.error || "Withdrawal failed.");
    } finally {
      setProcessing(null);
    }
  };

  const statusStyle = (status) => {
    if (status === "ACTIVE") return { background: "var(--success-bg)", color: "var(--success-text)" };
    if (status === "PENDING") return { background: "var(--warning-bg)", color: "var(--warning-text)" };
    return { background: "var(--danger-bg)", color: "var(--danger-text)" };
  };

  if (isAdmin) {
    return (
      <div style={{ padding: "32px", maxWidth: "700px", margin: "0 auto" }}>
        <h1>Accounts</h1>
        <Card style={{ marginTop: "20px" }}>
          <p style={{ color: "var(--text-secondary)" }}>
            Admins don't apply for or hold a personal account through this page — every
            account operation (approving applications, deposits, KYC review) is handled
            directly from the <strong>Admin Dashboard</strong>.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px", maxWidth: "1100px", margin: "0 auto" }}>
      <h1>My Accounts</h1>

      <Card style={{ maxWidth: "560px", marginTop: "20px" }}>
        <h3>Apply for a Bank Account</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "6px" }}>
          Your application will be reviewed by an admin. Deposits are handled by the bank directly.
        </p>
        {message && <p style={{ color: "#0d9488", marginTop: "8px", fontWeight: 500 }}>{message}</p>}

        <form onSubmit={handleOpenAccount} style={{ marginTop: "12px" }}>
          <div style={styles.row}>
            <div style={{ flex: 1 }}>
              <input style={styles.input} placeholder="First Name" value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              {errors.firstName && <p style={styles.err}>{errors.firstName}</p>}
            </div>
            <div style={{ flex: 1 }}>
              <input style={styles.input} placeholder="Last Name" value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              {errors.lastName && <p style={styles.err}>{errors.lastName}</p>}
            </div>
          </div>

          <label style={styles.label}>Date of Birth</label>
          <input style={styles.input} type="date" value={form.dateOfBirth}
            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
          {errors.dateOfBirth && <p style={styles.err}>{errors.dateOfBirth}</p>}

          <label style={styles.label}>Aadhaar Number</label>
          <input style={styles.input} placeholder="12-digit Aadhaar number" maxLength={12} value={form.aadharNumber}
            onChange={(e) => setForm({ ...form, aadharNumber: e.target.value.replace(/\D/g, "") })} />
          {errors.aadharNumber && <p style={styles.err}>{errors.aadharNumber}</p>}

          <label style={styles.label}>PAN Number</label>
          <input style={styles.input} placeholder="ABCDE1234F" maxLength={10}
            value={form.panNumber}
            onChange={(e) => setForm({ ...form, panNumber: e.target.value.toUpperCase() })} />
          {errors.panNumber && <p style={styles.err}>{errors.panNumber}</p>}

          <label style={styles.label}>Place</label>
          <input style={styles.input} placeholder="City / Town" value={form.place}
            onChange={(e) => setForm({ ...form, place: e.target.value })} />
          {errors.place && <p style={styles.err}>{errors.place}</p>}

          <label style={styles.label}>Account Type</label>
          <select style={styles.input} value={form.accountType}
            onChange={(e) => setForm({ ...form, accountType: e.target.value })}>
            <option value="SAVINGS">Savings</option>
            <option value="CURRENT">Current</option>
          </select>

          <input style={styles.input} type="number" step="0.01" placeholder="Initial Deposit (optional, ₹)"
            value={form.initialDeposit} onChange={(e) => setForm({ ...form, initialDeposit: e.target.value })} />

          <button style={styles.btn}>Submit Application</button>
        </form>
      </Card>

      <div style={{ marginTop: "28px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
        {accounts.map((acc) => {
          const isActive = acc.status === "ACTIVE";
          return (
            <Card key={acc.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{acc.accountType} • {mask(acc.accountNumber)}</p>
                <span style={{ padding: "3px 10px", borderRadius: "10px", fontSize: "0.72rem", fontWeight: 600, ...statusStyle(acc.status) }}>
                  {acc.status}
                </span>
              </div>
              <h2 style={{ margin: "8px 0" }}>₹{parseFloat(acc.balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>

              {isActive ? (
                confirming === acc.id ? (
                  <div style={{ marginTop: "12px", padding: "12px", background: "#fff7ed", borderRadius: "10px", border: "1px solid #fed7aa" }}>
                    <p style={{ fontSize: "0.85rem", color: "#9a3412", marginBottom: "8px" }}>
                      Confirm withdrawal of ₹{parseFloat(amounts[acc.id]).toLocaleString("en-IN")} from {mask(acc.accountNumber)}?
                    </p>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button style={styles.confirmBtn} onClick={() => confirmWithdraw(acc.id)}>Confirm</button>
                      <button style={styles.cancelBtn} onClick={() => setConfirming(null)}>Cancel</button>
                    </div>
                  </div>
                ) : processing === acc.id ? (
                  <p style={{ marginTop: "12px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>Processing withdrawal…</p>
                ) : (
                  <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                    <input style={{ ...styles.input, width: "130px", marginBottom: 0 }} type="number" placeholder="Amount (₹)"
                      value={amounts[acc.id] || ""} onChange={(e) => setAmounts({ ...amounts, [acc.id]: e.target.value })} />
                    <button style={{ ...styles.smallBtn, background: "#dc2626" }} onClick={() => requestWithdraw(acc.id)}>Withdraw</button>
                  </div>
                )
              ) : (
                <p style={{ color: "var(--warning-text)", fontSize: "0.85rem", marginTop: "12px" }}>
                  {acc.status === "PENDING"
                    ? "Waiting for admin approval before this account can be used."
                    : "This account is closed and can no longer be used."}
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  row: { display: "flex", gap: "10px" },
  label: { fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", margin: "4px 0" },
  input: {
    width: "100%", padding: "10px", marginBottom: "6px", border: "1px solid var(--border)",
    borderRadius: "8px", fontSize: "0.95rem",
  },
  err: { color: "var(--danger-text)", fontSize: "0.75rem", marginBottom: "8px" },
  btn: {
    width: "100%", padding: "10px", background: "#0f172a", color: "#fff", border: "none",
    borderRadius: "8px", fontWeight: 600, marginTop: "8px",
  },
  smallBtn: {
    padding: "8px 14px", background: "#16a34a", color: "#fff", border: "none",
    borderRadius: "6px", fontWeight: 600, fontSize: "0.85rem",
  },
  confirmBtn: {
    padding: "8px 16px", background: "#dc2626", color: "#fff", border: "none",
    borderRadius: "6px", fontWeight: 600, fontSize: "0.85rem", flex: 1,
  },
  cancelBtn: {
    padding: "8px 16px", background: "#e2e8f0", color: "#334155", border: "none",
    borderRadius: "6px", fontWeight: 600, fontSize: "0.85rem", flex: 1,
  },
};
