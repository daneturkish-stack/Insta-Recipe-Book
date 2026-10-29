import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getApiUrl } from "@/lib/query-client";
import { setAuthToken, getAuthToken, removeAuthToken } from "@/lib/auth-token";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";

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

interface SocialLoginParams {
  provider: string;
  token?: string;
  providerId?: string;
  email?: string;
  displayName?: string;
  profileImage?: string;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  socialLogin: (params: SocialLoginParams) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccess: () => Promise<void>;
  updateProfileImage: (imageUri: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trial, setTrial] = useState<TrialStatus | null>(null);
  const [hasAccess, setHasAccess] = useState(false);

  const baseUrl = getApiUrl();

  const syncBackend = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      const idToken = await firebaseUser.getIdToken();
      await setAuthToken(idToken);
      setTokenState(idToken);

      const url = new URL("/api/auth/me", baseUrl);
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!res.ok) {
        throw new Error("Backend sync failed");
      }

      const data = await res.json();
      setUser(data.user);
      setTrial(data.trial);
      setHasAccess(data.hasAccess);
    } catch (err) {
      console.error("Failed to sync auth state with backend:", err);
      setUser(null);
      setTokenState(null);
      setTrial(null);
      setHasAccess(false);
      await removeAuthToken();
    }
  }, [baseUrl]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await syncBackend(firebaseUser);
      } else {
        setUser(null);
        setTokenState(null);
        setTrial(null);
        setHasAccess(false);
        await removeAuthToken();
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, [syncBackend]);

  const login = useCallback(
    async (email: string, password: string) => {
      await signInWithEmailAndPassword(auth, email, password);
    },
    [],
  );

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      await cred.user.getIdToken(true); // Force token refresh
    },
    [],
  );

  const socialLogin = useCallback(
    async (params: SocialLoginParams) => {
      console.warn("Firebase Social Login requires provider credentials integration. Not fully implemented.");
      throw new Error("Social login not yet migrated to Firebase Auth on the client.");
    },
    [],
  );

  const refreshAccess = useCallback(async () => {
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true);
      await syncBackend(auth.currentUser);
    }
  }, [syncBackend]);

  const updateProfileImage = useCallback(
    async (imageUri: string) => {
      if (!auth.currentUser) throw new Error("Not authenticated");
      const idToken = await auth.currentUser.getIdToken();

      const url = new URL("/api/auth/profile-image", baseUrl);
      const res = await fetch(url.toString(), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ profileImage: imageUri }),
      });

      if (!res.ok) throw new Error("Failed to update profile image");

      const data = await res.json();
      setUser(data.user);
    },
    [baseUrl],
  );

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

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
    updateProfileImage,
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
