import { useState, useEffect, useCallback } from "react";
import { authAPI } from "/src/services/api.js";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [loading, setLoading] = useState(() => {
    return (
      typeof window !== "undefined" && !!localStorage.getItem("auth_token")
    );
  });

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await authAPI.getMe();
      if (response && response.data) {
        return response.data;
      }
    } catch (error) {
      console.error("Auth network verification failed:", error.message);
    }
    return null;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");

    if (!token) {
      return;
    }

    async function verifyAndSync() {
      try {
        const profileData = await fetchUserProfile();

        if (profileData) {
          setIsAdmin(true);
          setUser(profileData);
          setIsAuthenticated(true);
        } else {
          throw new Error("Invalid profile session");
        }
      } catch (err) {
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
      setUser(null);
      setIsAdmin(false);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (username, email, password) => {
    setLoading(true);
    try {
      return await authAPI.signup(username, email, password);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authAPI.logout();
    } finally {
      localStorage.removeItem("auth_token");
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      setIsAdmin(false);
    }
  };

  return {
    user,
    loading,
    isAuthenticated,
    login,
    signup,
    logout,
    isAdmin,
    refreshUser: fetchUserProfile,
  };
}
