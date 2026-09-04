"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  updateUser: (updatedUser: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // ponytail: Lazy initial state resolves user instantly from localStorage without useEffect cascading renders.
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Sync from localStorage after client hydration
    const saved = localStorage.getItem("ticketwar_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Scheduling microtask avoids synchronous cascading render warning
        queueMicrotask(() => {
          setUser(parsed);
          setLoading(false);
        });
        return;
      } catch {
        localStorage.removeItem("ticketwar_user");
      }
    }
    queueMicrotask(() => setLoading(false));
  }, []);

  const login = (newUser: AuthUser) => {
    setUser(newUser);
    localStorage.setItem("ticketwar_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("ticketwar_user");
    toast.success("ออกจากระบบแล้ว");
    router.push("/login");
  };

  const updateUser = (updated: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const nextUser = { ...prev, ...updated };
      localStorage.setItem("ticketwar_user", JSON.stringify(nextUser));
      return nextUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
