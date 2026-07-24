import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getCustomerByUserId, getAccountsByCustomer, openAccount, depositToAccount, withdrawFromAccount } from "../services/api";
import Card from "../components/Card";

export default function Accounts() {
  const { user } = useAuth();
  const [customerId, setCustomerId] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [accountType, setAccountType] = useState("SAVINGS");
  const [initialDeposit, setInitialDeposit] = useState("");
  const [amounts, setAmounts] = useState({});
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
      setMessage("Account opened successfully.");
      await loadAccounts(customerId);
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to open account.");
    }
  };

  const handleDeposit = async (id) => {
    const amount = parseFloat(amounts[id]);
    if (!amount || amount <= 0) return;
    await depositToAccount(id, amount);
    setAmounts({ ...amounts, [id]: "" });
    await loadAccounts(customerId);
  };

  const handleWithdraw = async (id) => {
    const amount = parseFloat(amounts[id]);
    if (!amount || amount <= 0) return;
    try {
      await withdrawFromAccount(id, amount);
      setAmounts({ ...amounts, [id]: "" });
      await loadAccounts(customerId);
    } catch (err) {
      setMessage(err.response?.data?.error || "Withdrawal failed.");
    }
  };

  return (
    <div style={{ padding: "32px" }}>
      <h1>My Accounts</h1>

      <Card style={{ maxWidth: "480px", marginTop: "20px" }}>
        <h3>Open New Account</h3>
        {message && <p style={{ color: "#2563eb", marginTop: "8px" }}>{message}</p>}
        <form onSubmit={handleOpenAccount} style={{ marginTop: "12px" }}>
          <select style={styles.input} value={accountType} onChange={(e) => setAccountType(e.target.value)}>
            <option value="SAVINGS">Savings</option>
            <option value="CURRENT">Current</option>
          </select>
          <input style={styles.input} type="number" step="0.01" placeholder="Initial Deposit"
            value={initialDeposit} onChange={(e) => setInitialDeposit(e.target.value)} />
          <button style={styles.btn}>Open Account</button>
        </form>
      </Card>

      <div style={{ marginTop: "28px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
        {accounts.map((acc) => (
          <Card key={acc.id}>
            <p style={{ color: "#64748b", fontSize: "0.85rem" }}>{acc.accountType} • {acc.accountNumber}</p>
            <h2 style={{ margin: "8px 0" }}>${parseFloat(acc.balance).toFixed(2)}</h2>
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <input style={{ ...styles.input, width: "120px", marginBottom: 0 }} type="number" placeholder="Amount"
                value={amounts[acc.id] || ""} onChange={(e) => setAmounts({ ...amounts, [acc.id]: e.target.value })} />
              <button style={styles.smallBtn} onClick={() => handleDeposit(acc.id)}>Deposit</button>
              <button style={{ ...styles.smallBtn, background: "#dc2626" }} onClick={() => handleWithdraw(acc.id)}>Withdraw</button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

const styles = {
  input: {
    width: "100%", padding: "10px", marginBottom: "10px", border: "1px solid #cbd5e1",
    borderRadius: "8px", fontSize: "0.95rem",
  },
  btn: {
    width: "100%", padding: "10px", background: "#2563eb", color: "#fff", border: "none",
    borderRadius: "8px", fontWeight: 600,
  },
  smallBtn: {
    padding: "8px 14px", background: "#16a34a", color: "#fff", border: "none",
    borderRadius: "6px", fontWeight: 600, fontSize: "0.85rem",
  },
};
