"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Notification } from "./types";
import { api } from "./api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  notifications: Notification[];
  unreadCount: number;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  demoLogin: (role: "student" | "staff" | "admin") => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchProfileAndNotifications = async (currentToken: string) => {
    try {
      const u = await api.getMe();
      setUser(u);
      const notifs = await api.getNotifications().catch(() => []);
      setNotifications(notifs);
    } catch (e) {
      console.warn("Auth initialization note:", e);
      localStorage.removeItem("cf_token");
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("cf_token");
    if (savedToken) {
      setToken(savedToken);
      fetchProfileAndNotifications(savedToken);
    } else {
      api.demoLogin("student").then(({ access_token, user: demoUser }) => {
        localStorage.setItem("cf_token", access_token);
        setToken(access_token);
        setUser(demoUser);
        api.getNotifications().then(setNotifications).catch(() => {});
      }).catch(() => {
        setIsLoading(false);
      });
    }
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const { access_token, user: loggedUser } = await api.login(email, pass);
      localStorage.setItem("cf_token", access_token);
      setToken(access_token);
      setUser(loggedUser);
      const notifs = await api.getNotifications().catch(() => []);
      setNotifications(notifs);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const { access_token, user: newUser } = await api.register(data);
      localStorage.setItem("cf_token", access_token);
      setToken(access_token);
      setUser(newUser);
      const notifs = await api.getNotifications().catch(() => []);
      setNotifications(notifs);
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (role: "student" | "staff" | "admin") => {
    setIsLoading(true);
    try {
      const { access_token, user: demoUser } = await api.demoLogin(role);
      localStorage.setItem("cf_token", access_token);
      setToken(access_token);
      setUser(demoUser);
      const notifs = await api.getNotifications().catch(() => []);
      setNotifications(notifs);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("cf_token");
    setToken(null);
    setUser(null);
    setNotifications([]);
  };

  const refreshUser = async () => {
    try {
      const u = await api.getMe();
      setUser(u);
    } catch {}
  };

  const refreshNotifications = async () => {
    try {
      const notifs = await api.getNotifications();
      setNotifications(notifs);
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        notifications,
        unreadCount,
        login,
        register,
        demoLogin,
        logout,
        refreshUser,
        refreshNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
