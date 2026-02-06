import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getApiUrl } from "@/lib/query-client";
import { setAuthToken, getAuthToken, removeAuthToken } from "@/lib/auth-token";
import { identifyRevenueCatUser } from "@/hooks/useRevenueCat";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  profileImage: string | null;
  authProvider: string;
  providerId: string | null;
  trialStartDate: string;
  subscriptionStatus: string;
  createdAt: string;
}

export interface TrialStatus {
  daysLeft: number;
  expired: boolean;
  startDate: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  trial: TrialStatus | null;
  hasAccess: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  socialLogin: (params: {
    provider: string;
    providerId: string;
    email: string;
    displayName: string;
    profileImage?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccess: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trial, setTrial] = useState<TrialStatus | null>(null);
  const [hasAccess, setHasAccess] = useState(false);

  const baseUrl = getApiUrl();

  const restoreSession = useCallback(async () => {
    try {
      const storedToken = await getAuthToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      const url = new URL("/api/auth/me", baseUrl);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      if (!res.ok) {
        await removeAuthToken();
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      setUser(data.user);
      setTokenState(storedToken);
      setTrial(data.trial);
      setHasAccess(data.hasAccess);
      identifyRevenueCatUser(data.user.id);
    } catch {
      await removeAuthToken();
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const handleAuthResponse = useCallback(
    async (data: { user: AuthUser; token: string }) => {
      await setAuthToken(data.token);
      setTokenState(data.token);
      setUser(data.user);
      identifyRevenueCatUser(data.user.id);

      const url = new URL("/api/auth/me", baseUrl);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${data.token}` },
      });

      if (res.ok) {
        const meData = await res.json();
        setTrial(meData.trial);
        setHasAccess(meData.hasAccess);
      }
    },
    [baseUrl],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const url = new URL("/api/auth/login", baseUrl);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Login failed");
      }

      const data = await res.json();
      await handleAuthResponse(data);
    },
    [baseUrl, handleAuthResponse],
  );

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const url = new URL("/api/auth/register", baseUrl);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Registration failed");
      }

      const data = await res.json();
      await handleAuthResponse(data);
    },
    [baseUrl, handleAuthResponse],
  );

  const socialLogin = useCallback(
    async (params: {
      provider: string;
      providerId: string;
      email: string;
      displayName: string;
      profileImage?: string;
    }) => {
      const url = new URL("/api/auth/social", baseUrl);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Social login failed");
      }

      const data = await res.json();
      await handleAuthResponse(data);
    },
    [baseUrl, handleAuthResponse],
  );

  const refreshAccess = useCallback(async () => {
    try {
      const storedToken = await getAuthToken();
      if (!storedToken) return;

      const url = new URL("/api/auth/me", baseUrl);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setTrial(data.trial);
        setHasAccess(data.hasAccess);
      }
    } catch (err) {
      console.error("Failed to refresh access:", err);
    }
  }, [baseUrl]);

  const logout = useCallback(async () => {
    try {
      if (token) {
        const url = new URL("/api/auth/logout", baseUrl);
        await fetch(url, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
    } finally {
      await removeAuthToken();
      setTokenState(null);
      setUser(null);
      setTrial(null);
      setHasAccess(false);
    }
  }, [token, baseUrl]);

  const value: AuthContextValue = {
    user,
    token,
    isLoading,
    trial,
    hasAccess,
    login,
    register,
    socialLogin,
    logout,
    refreshAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
