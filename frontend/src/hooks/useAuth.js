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

  // 💡 The Synchronization Hook
  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem("auth_token");

    if (!token) {
      // No token? No state updates needed. Everything stays false/null natively.
      return;
    }

    async function verifyAndSync() {
      const profileData = await fetchUserProfile();

      if (isMounted) {
        if (profileData) {
          setUser(profileData);
          setIsAuthenticated(true);
        } else {
          // Token was bad, wipe it
          localStorage.removeItem("auth_token");
          setUser(null);
          setIsAuthenticated(false);
        }
        setLoading(false);
      }
    }

    verifyAndSync();

    return () => {
      isMounted = false; // Cleanup tracker
    };
  }, [fetchUserProfile]);

  /**
   * Imperative Actions (Login, Signup, Logout)
   */
  const login = async (email, password, is_admin = false) => {
    setLoading(true);
    try {
      const userData = await authAPI.login(email, password, is_admin);
      setUser(userData.user);
      if (userData.is_admin) setIsAdmin(true);
      setIsAuthenticated(true);
      return userData.user;
    } catch (error) {
      setUser(null);
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
