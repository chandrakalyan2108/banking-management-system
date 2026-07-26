import React, { useEffect, useState } from "react";
import { getAllCustomers, updateKycStatus, getAllAccounts, getAllTransactions } from "../services/api";
import Card from "../components/Card";

export default function AdminDashboard() {
  const [tab, setTab] = useState("customers");
  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [custRes, accRes, txnRes] = await Promise.all([
        getAllCustomers(),
        getAllAccounts(),
        getAllTransactions(),
      ]);
      setCustomers(custRes.data);
      setAccounts(accRes.data);
      setTransactions(txnRes.data);
    } catch (err) {
      setError("Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleKycUpdate = async (customerId, status) => {
    try {
      await updateKycStatus(customerId, status);
      await loadAll();
    } catch (err) {
      setError("Failed to update KYC status.");
    }
  };

  const totalDeposits = accounts.reduce((sum, a) => sum + parseFloat(a.balance || 0), 0);

  return (
    <div style={{ padding: "32px" }}>
      <h1>Admin Dashboard</h1>
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", margin: "24px 0" }}>
        <Card>
          <p style={{ color: "#64748b" }}>Total Customers</p>
          <h2 style={{ marginTop: "8px" }}>{customers.length}</h2>
        </Card>
        <Card>
          <p style={{ color: "#64748b" }}>Total Accounts</p>
          <h2 style={{ marginTop: "8px" }}>{accounts.length}</h2>
        </Card>
        <Card>
          <p style={{ color: "#64748b" }}>Total Deposits (all accounts)</p>
          <h2 style={{ marginTop: "8px" }}>${totalDeposits.toFixed(2)}</h2>
        </Card>
        <Card>
          <p style={{ color: "#64748b" }}>Total Transactions</p>
          <h2 style={{ marginTop: "8px" }}>{transactions.length}</h2>
        </Card>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {["customers", "accounts", "transactions"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "10px 20px", borderRadius: "8px", border: "none", fontWeight: 600,
              cursor: "pointer",
              background: tab === t ? "#2563eb" : "#e2e8f0",
              color: tab === t ? "#fff" : "#334155",
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <Card>
          {tab === "customers" && (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>KYC Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td style={styles.td}>{c.id}</td>
                    <td style={styles.td}>{c.fullName}</td>
                    <td style={styles.td}>{c.email}</td>
                    <td style={styles.td}>{c.phone || "—"}</td>
                    <td style={styles.td}>
                      <span style={{
                        padding: "3px 10px", borderRadius: "10px", fontSize: "0.8rem",
                        background: c.kycStatus === "APPROVED" ? "#dcfce7" : c.kycStatus === "REJECTED" ? "#fee2e2" : "#fef9c3",
                        color: c.kycStatus === "APPROVED" ? "#16a34a" : c.kycStatus === "REJECTED" ? "#dc2626" : "#a16207",
                      }}>{c.kycStatus}</span>
                    </td>
                    <td style={styles.td}>
                      {c.kycStatus !== "APPROVED" && (
                        <button style={styles.smallBtnGreen} onClick={() => handleKycUpdate(c.id, "APPROVED")}>Approve</button>
                      )}
                      {c.kycStatus !== "REJECTED" && (
                        <button style={styles.smallBtnRed} onClick={() => handleKycUpdate(c.id, "REJECTED")}>Reject</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === "accounts" && (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Account Number</th>
                  <th style={styles.th}>Customer ID</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Balance</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id}>
                    <td style={styles.td}>{a.accountNumber}</td>
                    <td style={styles.td}>{a.customerId}</td>
                    <td style={styles.td}>{a.accountType}</td>
                    <td style={styles.td}>${parseFloat(a.balance).toFixed(2)}</td>
                    <td style={styles.td}>
                      <span style={{
                        padding: "3px 10px", borderRadius: "10px", fontSize: "0.8rem",
                        background: a.status === "ACTIVE" ? "#dcfce7" : "#fee2e2",
                        color: a.status === "ACTIVE" ? "#16a34a" : "#dc2626",
                      }}>{a.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === "transactions" && (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Reference</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>From</th>
                  <th style={styles.th}>To</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td style={styles.td}>{t.referenceId}</td>
                    <td style={styles.td}>{t.type}</td>
                    <td style={styles.td}>{t.fromAccountId || "—"}</td>
                    <td style={styles.td}>{t.toAccountId || "—"}</td>
                    <td style={styles.td}>${parseFloat(t.amount).toFixed(2)}</td>
                    <td style={styles.td}>
                      <span style={{
                        padding: "3px 10px", borderRadius: "10px", fontSize: "0.8rem",
                        background: t.status === "SUCCESS" ? "#dcfce7" : t.status === "FAILED" ? "#fee2e2" : "#fef9c3",
                        color: t.status === "SUCCESS" ? "#16a34a" : t.status === "FAILED" ? "#dc2626" : "#a16207",
                      }}>{t.status}</span>
                    </td>
                    <td style={styles.td}>{new Date(t.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  );
}

const styles = {
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "10px", borderBottom: "2px solid #e2e8f0", color: "#64748b", fontSize: "0.85rem" },
  td: { padding: "10px", borderBottom: "1px solid #f1f5f9", fontSize: "0.9rem" },
  smallBtnGreen: {
    padding: "6px 12px", background: "#16a34a", color: "#fff", border: "none",
    borderRadius: "6px", fontWeight: 600, fontSize: "0.8rem", marginRight: "6px", cursor: "pointer",
  },
  smallBtnRed: {
    padding: "6px 12px", background: "#dc2626", color: "#fff", border: "none",
    borderRadius: "6px", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer",
  },
};
