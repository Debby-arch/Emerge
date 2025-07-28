"use client";

import type React from "react";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { api } from "../services/api";

interface AuthUser {
  id: string;
  role: "patient" | "doctor" | "admin"; // Keep your existing role field
  user_type: "patient" | "doctor"; // Add user_type for API compatibility
  name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (
    email: string,
    password: string,
    userType: "patient" | "doctor",
  ) => Promise<boolean>;
  logout: () => void;
  register: (userData: any) => Promise<boolean>;
  isLoading: boolean;
  isInitializing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const userId = localStorage.getItem("user_id");
    const userType = localStorage.getItem("user_type");
    const accessToken = localStorage.getItem("access_token");

    console.log("Checking stored auth:", {
      userId,
      userType,
      accessToken: !!accessToken,
    });

    if (userId && userType && accessToken) {
      setUser({
        id: userId,
        role: userType as "patient" | "doctor", // Map user_type to role
        user_type: userType as "patient" | "doctor",
      });
    }
    setIsInitializing(false);
  }, []);

  const login = async (
    email: string,
    password: string,
    userType: "patient" | "doctor",
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log("Attempting login with:", { email, userType });
      const response = await api.login(email, password, userType);
      console.log("Login response:", response);

      const userData = {
        id: response.user_id,
        role: response.user_type as "patient" | "doctor", // Map user_type to role
        user_type: response.user_type as "patient" | "doctor",
      };

      console.log("Setting user data:", userData);
      setUser(userData);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log("Attempting registration with:", userData);
      const response = await api.register(userData);
      console.log("Registration response:", response);

      const userDataForState = {
        id: response.user_id,
        role: response.user_type as "patient" | "doctor", // Map user_type to role
        user_type: response.user_type as "patient" | "doctor",
      };

      console.log("Setting user data after registration:", userDataForState);
      setUser(userDataForState);
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log("Logging out user");
    api.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    register,
    isLoading,
    isInitializing,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

