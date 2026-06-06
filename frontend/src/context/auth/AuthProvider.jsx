import { useState, useEffect, useCallback, useMemo } from "react";
import { authAPI } from "/src/services/api.js";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); // Defaulting to false instead of null for safer evaluations

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem("auth_token");
    return !!token;
  });

  const [failed, setFailed] = useState(null);

  const [loading, setLoading] = useState(() => {
    return (
      typeof window !== "undefined" && !!localStorage.getItem("auth_token")
    );
  });

  // Stable profile fetcher
  const fetchUserProfile = useCallback(async () => {
    const response = await authAPI.getMe();
    return response;
  }, []);

  // 2. Centralized Mounting Effect: Runs EXACTLY once when the provider boots up
  useEffect(() => {
    const token = localStorage.getItem("auth_token");

    if (!token) {
      return;
    }

    async function verifyAndSync() {
      setFailed(null);
      setLoading(true);
      try {
        const profileData = await fetchUserProfile();

        if (profileData) {
          setIsAdmin(!!profileData.is_admin);
          setUser(profileData?.user); // Soft fallback if backend layout shifts
          setIsAuthenticated(true);
        } else {
          setFailed("Invalid profile session");
          throw new Error("Invalid profile session");
        }
      } catch (err) {
        setFailed("Auth sync failed");
        console.warn("Auth sync failed, clearing session:", err.message);
        localStorage.removeItem("auth_token");
        setUser(null);
        setIsAdmin(false);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }

    verifyAndSync();
  }, [fetchUserProfile]);

  const login = async (email, password, is_admin = false) => {
    setFailed(null);
    setLoading(true);
    try {
      const userData = await authAPI.login(email, password, is_admin);
      if (userData?.access_token) {
        localStorage.setItem("auth_token", userData.access_token);
      }
      setUser(userData.user);
      setIsAdmin(!!userData.is_admin);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      setFailed(error.message);
      localStorage.removeItem("auth_token");
      setUser(null);
      setIsAdmin(false);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (username, email, password) => {
    setFailed(null);
    setLoading(true);
    try {
      return await authAPI.signup(username, email, password);
    } catch (error) {
      setFailed(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setFailed(null);
    setLoading(true);
    try {
      await authAPI.logout();
    } finally {
      localStorage.removeItem("auth_token");
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setLoading(false);
    }
  };

  // 3. Optimize values using useMemo to stop unnecessary cascading child tree re-renders
  const contextValue = useMemo(
    () => ({
      user,
      failed,
      loading,
      isAuthenticated,
      isAdmin,
      login,
      signup,
      logout,
      refreshUser: fetchUserProfile,
    }),
    [user, failed, loading, isAuthenticated, isAdmin, fetchUserProfile],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
