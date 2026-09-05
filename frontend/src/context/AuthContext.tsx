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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Sync from localStorage after client hydration
    const saved = localStorage.getItem("ticketwar_user");
    if (saved) {
      try {
        const parsed: AuthUser = JSON.parse(saved);
        // Scheduling microtask avoids synchronous cascading render warning
        queueMicrotask(() => {
          setUser(parsed);
          setLoading(false);
        });

        // Background sync latest user data from DB (e.g. avatarUrl, name)
        if (parsed.id) {
          fetch(`/api/auth/profile?userId=${encodeURIComponent(parsed.id)}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (data?.user) {
                const freshUser: AuthUser = {
                  id: data.user.id,
                  name: data.user.name,
                  email: data.user.email,
                  avatarUrl: data.user.avatarUrl,
                };
                setUser(freshUser);
                localStorage.setItem(
                  "ticketwar_user",
                  JSON.stringify(freshUser)
                );
              }
            })
            .catch(() => {
              // Silently ignore background sync failures
            });
        }
        return;
      } catch {
        localStorage.removeItem("ticketwar_user");
      }
    }
    queueMicrotask(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "ticketwar_user") {
        if (e.newValue) {
          try {
            setUser(JSON.parse(e.newValue));
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
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
