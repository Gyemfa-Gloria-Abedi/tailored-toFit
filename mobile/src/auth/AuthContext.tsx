import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { apiRequest } from "../api/client";

import {
  getToken,
  removeToken,
  saveToken,
} from "../storage/token";

type User = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  businessName?: string | null;
  avatarUrl?: string | null;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<void>;

  register: (
    name: string,
    email: string,
    password: string,
    businessName?: string
  ) => Promise<void>;

  logout: () => Promise<void>;
};

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(
    null
  );

  const [token, setToken] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const storedToken = await getToken();

      if (!storedToken) {
        return;
      }

      const response = await apiRequest<{
        user: User;
      }>("/api/auth/me", {
        token: storedToken,
      });

      setToken(storedToken);
      setUser(response.user);
    } catch {
      await removeToken();
    } finally {
      setLoading(false);
    }
  }

  async function login(
    email: string,
    password: string
  ) {
    const response = await apiRequest<{
      token: string;
      user: User;
    }>("/api/auth/login", {
      method: "POST",

      body: {
        email,
        password,
      },
    });

    await saveToken(response.token);

    setToken(response.token);
    setUser(response.user);
  }

  async function register(
    name: string,
    email: string,
    password: string,
    businessName?: string
  ) {
    const response = await apiRequest<{
      token: string;
      user: User;
    }>("/api/auth/register", {
      method: "POST",

      body: {
        name,
        email,
        password,
        ...(businessName?.trim()
    ? {
        businessName:
          businessName.trim(),
      }
    : {}),
      },
    });

    await saveToken(response.token);

    setToken(response.token);
    setUser(response.user);
  }

  async function logout() {
    await removeToken();

    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}