import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@shared/schema";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/use-language";
import { useLocation } from "wouter";

type AccountType = "patient" | "doctor" | "coach";
type UserRole = "admin" | "doctor" | "coach" | "patient";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  role: UserRole | null;
  clientId: string | null;
  error: string | null;
  login: (username: string, password: string, accountType?: AccountType) => Promise<void>;
  logout: () => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    confirmPassword: string,
    firstName?: string,
    lastName?: string,
    age?: number,
    height?: number,
    weight?: number,
    bloodType?: string,
    accountType?: AccountType,
    clientId?: string
  ) => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setError(null);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string, accountType: AccountType = "patient") => {
    try {
      setError(null);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password, accountType }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Login failed");
      }

      const userData = await response.json();
      setUser(userData);
      toast.success(t("loginSuccess"));
      if (userData.isAdmin || userData.role === "admin") {
        setLocation("/admin");
      } else if (userData.role === "doctor" || userData.role === "coach") {
        setLocation("/doctor");
      } else if (!userData.onboardingCompleted) {
        setLocation("/onboarding");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      setError(null);
      toast.success(t("logoutSuccess"));
    } catch (err) {
      console.error("Logout failed:", err);
      toast.error(t("logoutFailed"));
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    confirmPassword: string,
    firstName?: string,
    lastName?: string,
    age?: number,
    height?: number,
    weight?: number,
    bloodType?: string,
    accountType: AccountType = "patient",
    clientId?: string
  ) => {
    try {
      setError(null);
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username,
          email,
          password,
          confirmPassword,
          firstName,
          lastName,
          age,
          height,
          weight,
          bloodType,
          accountType,
          role: accountType,
          clientId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Registration failed");
      }

      const userData = await response.json();
      setUser(userData);
      toast.success(t("registerSuccess"));
      if (userData.role === "doctor" || userData.role === "coach") {
        setLocation("/doctor");
      } else {
        setLocation("/onboarding");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setError(message);
      toast.error(message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: !!(user as any)?.isAdmin || (user as any)?.role === "admin",
        role: ((user as any)?.role || null) as UserRole | null,
        clientId: ((user as any)?.clientId || null) as string | null,
        error,
        login,
        logout,
        register,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
