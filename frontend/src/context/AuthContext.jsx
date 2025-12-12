import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";
import { useDisconnectWallet } from "@iota/dapp-kit";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { disconnect } = useDisconnectWallet();

  useEffect(() => {
    // Check for saved token/user on startup
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      // Ensure wallet is disconnected before new login
      try {
        disconnect();
      } catch (e) {
        // Ignore if already disconnected
      }

      const data = await authService.login(username, password);
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signup = async (userData) => {
    try {
      disconnect(); // Clear any existing wallet state
      const data = await authService.signup(userData);
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      console.log("Attempting to disconnect wallet...");
      disconnect();
      console.log("Wallet disconnected.");
    } catch (e) {
      console.error("Failed to disconnect wallet:", e);
    }
    await authService.logout();
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    signup,
    logout,
    updateUser: (userData) => {
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
