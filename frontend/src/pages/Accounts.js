import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getCustomerByUserId, getAccountsByCustomer, openAccount, withdrawFromAccount } from "../services/api";
import Card from "../components/Card";

const mask = (num) => (num ? "•••• " + num.slice(-4) : "");

export default function Accounts() {
  const { user } = useAuth();
  const [customerId, setCustomerId] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [accountType, setAccountType] = useState("SAVINGS");
  const [initialDeposit, setInitialDeposit] = useState("");
  const [amounts, setAmounts] = useState({});
  const [confirming, setConfirming] = useState(null);
  const [processing, setProcessing] = useState(null);
  const [message, setMessage] = useState("");

  const loadAccounts = async (custId) => {
    const res = await getAccountsByCustomer(custId);
    setAccounts(res.data);
  };

  useEffect(() => {
    const init = async () => {
      const custRes = await getCustomerByUserId(user.userId);
      setCustomerId(custRes.data.id);
      await loadAccounts(custRes.data.id);
    };
    if (user) init();
  }, [user]);

  const handleOpenAccount = async (e) => {
    e.preventDefault();
    try {
      await openAccount({ customerId, accountType, initialDeposit: parseFloat(initialDeposit) || 0 });
      setInitialDeposit("");
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
    // Simulated processing delay -- real banks rarely settle a withdrawal
    // instantly; this brief pause plus a receipt-style confirmation makes
    // the flow feel like an actual transaction rather than a toggle switch.
    await new Promise((resolve) => setTimeout(resolve, 1200));
    try {
      const res = await withdrawFromAccount(id, amount);
      setAmounts({ ...amounts, [id]: "" });
      setMessage(`Withdrawal successful. Ref: ${res.data.referenceId}. New balance updated below.`);
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

  return (
    <div style={{ padding: "32px", maxWidth: "1100px", margin: "0 auto" }}>
      <h1>My Accounts</h1>

      <Card style={{ maxWidth: "480px", marginTop: "20px" }}>
        <h3>Apply for a Bank Account</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "6px" }}>
          Your application will be reviewed by an admin. You won't be able to withdraw
          or transfer until it's approved. Deposits are handled by the bank directly.
        </p>
        {message && <p style={{ color: "#0d9488", marginTop: "8px", fontWeight: 500 }}>{message}</p>}
        <form onSubmit={handleOpenAccount} style={{ marginTop: "12px" }}>
          <select style={styles.input} value={accountType} onChange={(e) => setAccountType(e.target.value)}>
            <option value="SAVINGS">Savings</option>
            <option value="CURRENT">Current</option>
          </select>
          <input style={styles.input} type="number" step="0.01" placeholder="Initial Deposit (optional, ₹)"
            value={initialDeposit} onChange={(e) => setInitialDeposit(e.target.value)} />
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
  input: {
    width: "100%", padding: "10px", marginBottom: "10px", border: "1px solid var(--border)",
    borderRadius: "8px", fontSize: "0.95rem",
  },
  btn: {
    width: "100%", padding: "10px", background: "#0f172a", color: "#fff", border: "none",
    borderRadius: "8px", fontWeight: 600,
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
