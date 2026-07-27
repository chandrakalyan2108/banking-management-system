import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_BASE_URL || "/api";

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Auth ----
export const registerUser = (data) => api.post("/auth/register", data);
export const loginUser = (data) => api.post("/auth/login", data);

// ---- Customers ----
export const createCustomerProfile = (data) => api.post("/customers", data);
export const getCustomerByUserId = (userId) => api.get(`/customers/user/${userId}`);
export const getAllCustomers = () => api.get("/customers");
export const updateKycStatus = (customerId, status) => api.patch(`/customers/${customerId}/kyc`, { status });

// ---- Accounts ----
export const openAccount = (data) => api.post("/accounts", data);
export const getAccountsByCustomer = (customerId) => api.get(`/accounts/customer/${customerId}`);
export const getAccountById = (id) => api.get(`/accounts/${id}`);
export const getAllAccounts = () => api.get("/accounts");
export const closeAccount = (id) => api.patch(`/accounts/${id}/close`);
export const approveAccount = (id) => api.patch(`/accounts/${id}/approve`);

// ---- Deposits & Withdrawals ----
// Routed through transaction-service (not account-service directly) so that
// every deposit/withdrawal is recorded in Transaction History, the same way
// transfers already are.
export const depositToAccount = (id, amount, remarks = "") =>
  api.post(`/transactions/deposit/${id}`, { amount, remarks });
export const withdrawFromAccount = (id, amount, remarks = "") =>
  api.post(`/transactions/withdrawal/${id}`, { amount, remarks });

// ---- Transactions ----
export const transferFunds = (data) => api.post("/transactions/transfer", data);
export const getTransactionHistory = (accountId) => api.get(`/transactions/account/${accountId}`);
export const getAllTransactions = () => api.get("/transactions");

export default api;
