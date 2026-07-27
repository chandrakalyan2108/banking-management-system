import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getCustomerByUserId, getAccountsByCustomer } from "../services/api";
import Card from "../components/Card";
import { Link } from "react-router-dom";

const mask = (num) => (num ? "•••• " + num.slice(-4) : "");

export default function Dashboard() {
  const { user } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState("");
  const [revealed, setRevealed] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const custRes = await getCustomerByUserId(user.userId);
        setCustomer(custRes.data);
        const accRes = await getAccountsByCustomer(custRes.data.id);
        setAccounts(accRes.data);
      } catch (err) {
        setError("Unable to load account data.");
      }
    };
    if (user) load();
  }, [user]);

  const activeAccounts = accounts.filter((a) => a.status === "ACTIVE");
  const totalBalance = activeAccounts.reduce((sum, a) => sum + parseFloat(a.balance || 0), 0);

  const statusStyle = (status) => {
    if (status === "ACTIVE") return { background: "var(--success-bg)", color: "var(--success-text)" };
    if (status === "PENDING") return { background: "var(--warning-bg)", color: "var(--warning-text)" };
    return { background: "var(--danger-bg)", color: "var(--danger-text)" };
  };

  return (
    <div style={{ padding: "32px", maxWidth: "1100px", margin: "0 auto" }}>
      <h1>Welcome, {customer?.fullName || user?.username} 👋</h1>
      {error && <p style={{ color: "var(--danger-text)" }}>{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "18px", marginTop: "24px" }}>
        <Card style={{ background: "linear-gradient(135deg, #0b1120 0%, #134e4a 100%)", color: "#fff" }}>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Total Balance</p>
          <h2 style={{ marginTop: "8px", fontSize: "2rem", color: "#fff" }}>₹{totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
        </Card>
        <Card>
          <p style={{ color: "var(--text-secondary)" }}>Active Accounts</p>
          <h2 style={{ marginTop: "8px" }}>{activeAccounts.length}</h2>
        </Card>
        <Card>
          <p style={{ color: "var(--text-secondary)" }}>KYC Status</p>
          <h2 style={{ marginTop: "8px", fontSize: "1.1rem" }}>{customer?.kycStatus || "PENDING"}</h2>
        </Card>
      </div>

      <div style={{ marginTop: "32px" }}>
        <h3 style={{ marginBottom: "16px" }}>My Accounts</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          {accounts.map((acc) => (
            <Card key={acc.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{acc.accountType}</p>
                <span style={{ padding: "3px 10px", borderRadius: "10px", fontSize: "0.72rem", fontWeight: 600, ...statusStyle(acc.status) }}>
                  {acc.status}
                </span>
              </div>
              <p
                onClick={() => setRevealed({ ...revealed, [acc.id]: !revealed[acc.id] })}
                style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "4px 0 6px", cursor: "pointer", userSelect: "none" }}
                title="Click to show/hide full account number"
              >
                {revealed[acc.id] ? acc.accountNumber : mask(acc.accountNumber)} 👁
              </p>
              <h2 style={{ margin: "4px 0" }}>₹{parseFloat(acc.balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
            </Card>
          ))}
        </div>
        {accounts.length === 0 && <p style={{ color: "var(--text-secondary)" }}>No accounts yet — apply for one below.</p>}
      </div>

      <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
        <Link to="/accounts" style={btnStyle}>Manage Accounts</Link>
        <Link to="/transfer" style={{ ...btnStyle, background: "#0d9488" }}>Transfer Funds</Link>
      </div>
    </div>
  );
}

const btnStyle = {
  padding: "11px 22px", background: "#0f172a", color: "#fff", borderRadius: "10px", fontWeight: 600, fontSize: "0.9rem",
};
