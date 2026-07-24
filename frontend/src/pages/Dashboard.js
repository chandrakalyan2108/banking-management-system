import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getCustomerByUserId, getAccountsByCustomer } from "../services/api";
import Card from "../components/Card";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState("");

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

  const totalBalance = accounts.reduce((sum, a) => sum + parseFloat(a.balance || 0), 0);

  return (
    <div style={{ padding: "32px" }}>
      <h1>Welcome, {customer?.fullName || user?.username}</h1>
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginTop: "24px" }}>
        <Card>
          <p style={{ color: "#64748b" }}>Total Balance</p>
          <h2 style={{ marginTop: "8px" }}>${totalBalance.toFixed(2)}</h2>
        </Card>
        <Card>
          <p style={{ color: "#64748b" }}>Active Accounts</p>
          <h2 style={{ marginTop: "8px" }}>{accounts.filter(a => a.status === "ACTIVE").length}</h2>
        </Card>
        <Card>
          <p style={{ color: "#64748b" }}>KYC Status</p>
          <h2 style={{ marginTop: "8px" }}>{customer?.kycStatus || "PENDING"}</h2>
        </Card>
      </div>

      <div style={{ marginTop: "32px" }}>
        <h3 style={{ marginBottom: "16px" }}>My Accounts</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          {accounts.map((acc) => (
            <Card key={acc.id}>
              <p style={{ color: "#64748b", fontSize: "0.85rem" }}>{acc.accountType} • {acc.accountNumber}</p>
              <h2 style={{ margin: "8px 0" }}>${parseFloat(acc.balance).toFixed(2)}</h2>
              <span style={{
                fontSize: "0.75rem", padding: "4px 10px", borderRadius: "12px",
                background: acc.status === "ACTIVE" ? "#dcfce7" : "#fee2e2",
                color: acc.status === "ACTIVE" ? "#16a34a" : "#dc2626",
              }}>{acc.status}</span>
            </Card>
          ))}
        </div>
        {accounts.length === 0 && <p style={{ color: "#64748b" }}>No accounts yet.</p>}
      </div>

      <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
        <Link to="/accounts" style={btnStyle}>Manage Accounts</Link>
        <Link to="/transfer" style={btnStyle}>Transfer Funds</Link>
      </div>
    </div>
  );
}

const btnStyle = {
  padding: "10px 20px", background: "#2563eb", color: "#fff", borderRadius: "8px", fontWeight: 600,
};
