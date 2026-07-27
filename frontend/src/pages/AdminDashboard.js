import React, { useEffect, useState } from "react";
import { getAllCustomers, updateKycStatus, getAllAccounts, getAllTransactions, approveAccount, depositToAccount } from "../services/api";
import Card from "../components/Card";

export default function AdminDashboard() {
  const [tab, setTab] = useState("accounts");
  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [depositAmounts, setDepositAmounts] = useState({});

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

  const handleApproveAccount = async (accountId) => {
    try {
      await approveAccount(accountId);
      await loadAll();
    } catch (err) {
      setError("Failed to approve account.");
    }
  };

  const handleDeposit = async (accountId) => {
    const amount = parseFloat(depositAmounts[accountId]);
    if (!amount || amount <= 0) return;
    try {
      await depositToAccount(accountId, amount);
      setDepositAmounts({ ...depositAmounts, [accountId]: "" });
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error || "Deposit failed.");
    }
  };

  const pendingCount = accounts.filter((a) => a.status === "PENDING").length;
  const totalDeposits = accounts.reduce((sum, a) => sum + parseFloat(a.balance || 0), 0);

  return (
    <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>Admin Dashboard</h1>
      {error && <p style={{ color: "var(--danger-text)" }}>{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", margin: "24px 0" }}>
        <Card>
          <p style={{ color: "var(--text-secondary)" }}>Total Customers</p>
          <h2 style={{ marginTop: "8px" }}>{customers.length}</h2>
        </Card>
        <Card>
          <p style={{ color: "var(--text-secondary)" }}>Total Accounts</p>
          <h2 style={{ marginTop: "8px" }}>{accounts.length}</h2>
        </Card>
        <Card style={pendingCount > 0 ? { border: "2px solid #f59e0b" } : {}}>
          <p style={{ color: "var(--text-secondary)" }}>Pending Approvals</p>
          <h2 style={{ marginTop: "8px", color: pendingCount > 0 ? "var(--warning-text)" : undefined }}>{pendingCount}</h2>
        </Card>
        <Card>
          <p style={{ color: "var(--text-secondary)" }}>Total Deposits (all accounts)</p>
          <h2 style={{ marginTop: "8px" }}>₹{totalDeposits.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
        </Card>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {["accounts", "customers", "transactions"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "10px 20px", borderRadius: "8px", border: "none", fontWeight: 600,
              cursor: "pointer",
              background: tab === t ? "#0f172a" : "#e2e8f0",
              color: tab === t ? "#fff" : "#334155",
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === "accounts" && pendingCount > 0 ? ` (${pendingCount} pending)` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <Card>
          {tab === "accounts" && (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Account Number</th>
                  <th style={styles.th}>Customer ID</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Balance</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id}>
                    <td style={styles.td}>{a.accountNumber}</td>
                    <td style={styles.td}>{a.customerId}</td>
                    <td style={styles.td}>{a.accountType}</td>
                    <td style={styles.td}>₹{parseFloat(a.balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td style={styles.td}>
                      <span style={{
                        padding: "3px 10px", borderRadius: "10px", fontSize: "0.8rem",
                        background: a.status === "ACTIVE" ? "var(--success-bg)" : a.status === "PENDING" ? "var(--warning-bg)" : "var(--danger-bg)",
                        color: a.status === "ACTIVE" ? "var(--success-text)" : a.status === "PENDING" ? "var(--warning-text)" : "var(--danger-text)",
                      }}>{a.status}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                        {a.status === "PENDING" && (
                          <button style={styles.smallBtnGreen} onClick={() => handleApproveAccount(a.id)}>Approve</button>
                        )}
                        {a.status === "ACTIVE" && (
                          <>
                            <input
                              type="number"
                              placeholder="₹ Amount"
                              value={depositAmounts[a.id] || ""}
                              onChange={(e) => setDepositAmounts({ ...depositAmounts, [a.id]: e.target.value })}
                              style={styles.depositInput}
                            />
                            <button style={styles.smallBtnBlue} onClick={() => handleDeposit(a.id)}>Deposit</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

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
                        background: c.kycStatus === "APPROVED" ? "var(--success-bg)" : c.kycStatus === "REJECTED" ? "var(--danger-bg)" : "var(--warning-bg)",
                        color: c.kycStatus === "APPROVED" ? "var(--success-text)" : c.kycStatus === "REJECTED" ? "var(--danger-text)" : "var(--warning-text)",
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
                    <td style={styles.td}>₹{parseFloat(t.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td style={styles.td}>
                      <span style={{
                        padding: "3px 10px", borderRadius: "10px", fontSize: "0.8rem",
                        background: t.status === "SUCCESS" ? "var(--success-bg)" : t.status === "FAILED" ? "var(--danger-bg)" : "var(--warning-bg)",
                        color: t.status === "SUCCESS" ? "var(--success-text)" : t.status === "FAILED" ? "var(--danger-text)" : "var(--warning-text)",
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
  th: { textAlign: "left", padding: "10px", borderBottom: "2px solid var(--border)", color: "var(--text-secondary)", fontSize: "0.85rem" },
  td: { padding: "10px", borderBottom: "1px solid #f1f5f9", fontSize: "0.9rem" },
  depositInput: {
    width: "100px", padding: "6px 8px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "0.8rem",
  },
  smallBtnGreen: {
    padding: "6px 12px", background: "#16a34a", color: "#fff", border: "none",
    borderRadius: "6px", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer",
  },
  smallBtnRed: {
    padding: "6px 12px", background: "#dc2626", color: "#fff", border: "none",
    borderRadius: "6px", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer",
  },
  smallBtnBlue: {
    padding: "6px 12px", background: "#0d9488", color: "#fff", border: "none",
    borderRadius: "6px", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer",
  },
};
