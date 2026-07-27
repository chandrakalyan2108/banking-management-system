import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getCustomerByUserId, getAccountsByCustomer, getTransactionHistory } from "../services/api";
import Card from "../components/Card";

export default function Transactions() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const init = async () => {
      const custRes = await getCustomerByUserId(user.userId);
      const accRes = await getAccountsByCustomer(custRes.data.id);
      setAccounts(accRes.data);
      if (accRes.data.length > 0) setSelectedAccount(accRes.data[0].id);
    };
    if (user) init();
  }, [user]);

  useEffect(() => {
    const load = async () => {
      if (!selectedAccount) return;
      const res = await getTransactionHistory(selectedAccount);
      setHistory(res.data);
    };
    load();
  }, [selectedAccount]);

  const typeStyle = (type) => {
    if (type === "DEPOSIT") return { color: "var(--success-text)", prefix: "+" };
    if (type === "WITHDRAWAL") return { color: "var(--danger-text)", prefix: "-" };
    return { color: "var(--text-primary)", prefix: "" };
  };

  return (
    <div style={{ padding: "32px", maxWidth: "1000px", margin: "0 auto" }}>
      <h1>Transaction History</h1>

      <select style={styles.select} value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)}>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>{a.accountNumber}</option>
        ))}
      </select>

      <Card style={{ marginTop: "20px" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Reference</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Amount</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Date</th>
            </tr>
          </thead>
          <tbody>
            {history.map((t) => {
              const ts = typeStyle(t.type);
              return (
                <tr key={t.id}>
                  <td style={styles.td}>{t.referenceId}</td>
                  <td style={styles.td}>{t.type}</td>
                  <td style={{ ...styles.td, color: ts.color, fontWeight: 600 }}>
                    {ts.prefix}₹{parseFloat(t.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      padding: "3px 10px", borderRadius: "10px", fontSize: "0.8rem",
                      background: t.status === "SUCCESS" ? "var(--success-bg)" : t.status === "FAILED" ? "var(--danger-bg)" : "var(--warning-bg)",
                      color: t.status === "SUCCESS" ? "var(--success-text)" : t.status === "FAILED" ? "var(--danger-text)" : "var(--warning-text)",
                    }}>{t.status}</span>
                  </td>
                  <td style={styles.td}>{new Date(t.createdAt).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {history.length === 0 && <p style={{ color: "var(--text-secondary)", padding: "16px 0" }}>No transactions found.</p>}
      </Card>
    </div>
  );
}

const styles = {
  select: {
    padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "0.95rem",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "10px", borderBottom: "2px solid var(--border)", color: "var(--text-secondary)", fontSize: "0.85rem" },
  td: { padding: "10px", borderBottom: "1px solid #f1f5f9", fontSize: "0.9rem" },
};
