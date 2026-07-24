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

  return (
    <div style={{ padding: "32px" }}>
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
            {history.map((t) => (
              <tr key={t.id}>
                <td style={styles.td}>{t.referenceId}</td>
                <td style={styles.td}>{t.type}</td>
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
        {history.length === 0 && <p style={{ color: "#64748b", padding: "16px 0" }}>No transactions found.</p>}
      </Card>
    </div>
  );
}

const styles = {
  select: {
    padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.95rem",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "10px", borderBottom: "2px solid #e2e8f0", color: "#64748b", fontSize: "0.85rem" },
  td: { padding: "10px", borderBottom: "1px solid #f1f5f9", fontSize: "0.9rem" },
};
