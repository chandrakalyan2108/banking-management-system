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

// ---- Accounts ----
export const openAccount = (data) => api.post("/accounts", data);
export const getAccountsByCustomer = (customerId) => api.get(`/accounts/customer/${customerId}`);
export const getAccountById = (id) => api.get(`/accounts/${id}`);
export const depositToAccount = (id, amount) => api.post(`/accounts/${id}/deposit`, { amount });
export const withdrawFromAccount = (id, amount) => api.post(`/accounts/${id}/withdraw`, { amount });

// ---- Transactions ----
export const transferFunds = (data) => api.post("/transactions/transfer", data);
export const getTransactionHistory = (accountId) => api.get(`/transactions/account/${accountId}`);

export default api;
