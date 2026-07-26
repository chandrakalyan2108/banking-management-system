import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  // Wait for the initial localStorage check to finish before deciding
  // whether to redirect. Without this, a page refresh briefly sees no user
  // (since reading localStorage happens in an effect, after the first
  // render) and immediately bounces to /login even when you're still
  // logged in.
  if (loading) {
    return null;
  }

  return user ? children : <Navigate to="/login" replace />;
}
