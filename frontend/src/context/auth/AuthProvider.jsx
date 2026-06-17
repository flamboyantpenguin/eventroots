import { useState, useEffect, useCallback, useMemo } from "react";
import { authAPI, adminAPI } from "/src/services/api.js";
import { AuthContext } from "./AuthContext";
import { createPortal } from "react-dom";
import {
  AdminPanelSettingsOutlined,
  CloseOutlined,
  LogoutOutlined,
  Person2Outlined,
} from "@mui/icons-material";
import { useLocation } from "react-router-dom";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  const isAdminPage = useMemo(() => {
    return location.pathname.startsWith("/admin");
  }, [location.pathname]);

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem("auth_token");
    return !!token;
  });

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const openProfile = useCallback(() => setIsProfileOpen(true), []);
  const closeProfile = useCallback(() => setIsProfileOpen(false), []);

  const [failed, setFailed] = useState(null);

  const [loading, setLoading] = useState(() => {
    return (
      typeof window !== "undefined" && !!localStorage.getItem("auth_token")
    );
  });

  const inflateUserPayload = (userData) => {
    if (!userData) return null;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

    return {
      ...userData,
      pfp:
        userData.pfp && userData.pfp.startsWith("/")
          ? `${baseUrl}${userData.pfp}`
          : userData.pfp,
    };
  };

  const fetchUserProfile = useCallback(async () => {
    const response = isAdminPage ? adminAPI.getMe() : authAPI.getMe();
    return response;
  }, [isAdminPage]);

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
          setUser(inflateUserPayload(profileData?.user));
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

  const login = useCallback(async (email, password) => {
    setFailed(null);
    setLoading(true);
    try {
      const userData = await authAPI.login(email, password);
      if (userData?.access_token && userData?.user?.id) {
        const compositeToken = `${userData.user?.id}:${userData.access_token}`;
        localStorage.setItem("auth_token", compositeToken);
      }
      setUser(inflateUserPayload(userData.user));
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      setFailed(error.message);
      localStorage.removeItem("auth_token");
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const adminLogin = useCallback(async (email, password) => {
    setFailed(null);
    setLoading(true);
    try {
      const userData = await adminAPI.login(email, password);
      if (userData?.access_token) {
        localStorage.setItem("auth_token", userData.access_token);
      }
      setUser(inflateUserPayload(userData.user));
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
  }, []);

  const signup = useCallback(async (formData) => {
    setFailed(null);
    setLoading(true);
    try {
      const response = await authAPI.signup(formData);
      return response;
    } catch (error) {
      const errMsg =
        error.response?.data?.detail || error.message || "Registration failed";
      setFailed(errMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setFailed(null);
    setLoading(true);
    try {
      await authAPI.logout();
    } finally {
      localStorage.removeItem("auth_token");
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  }, []);

  const adminLogout = useCallback(async () => {
    setFailed(null);
    setLoading(true);
    try {
      await adminAPI.logout();
    } finally {
      localStorage.removeItem("auth_token");
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setLoading(false);
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      failed,
      loading,
      isAuthenticated,
      isAdmin,
      adminLogin,
      adminLogout,
      login,
      signup,
      logout,
      openProfile,
      closeProfile,
      refreshUser: fetchUserProfile,
    }),
    [
      adminLogin,
      adminLogout,
      login,
      logout,
      signup,
      user,
      failed,
      loading,
      isAuthenticated,
      isAdmin,
      fetchUserProfile,
      openProfile,
      closeProfile,
    ],
  );
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      {isProfileOpen &&
        user &&
        createPortal(
          <div
            className="omni-portal-envelope"
            style={{ position: "fixed", inset: 0, zIndex: 9998 }}
          >
            {/* The Blurring Mask Layer */}
            <div className="omni-backdrop-shroud" onClick={closeProfile} />

            <div className="omni-command-board">
              <button className="omni-close-btn" onClick={closeProfile}>
                <CloseOutlined />
              </button>

              <div className="omni-panel-identity">
                <div className="omni-avatar-frame">
                  {isAdmin ? (
                    <Person2Outlined
                      sx={{ fontSize: "6rem" }}
                    ></Person2Outlined>
                  ) : (
                    <img
                      src={user.pfp}
                      alt="User Avatar"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100%' height='100%' fill='%236750A4'/></svg>";
                      }}
                    />
                  )}
                </div>
                <h2>{user.username}</h2>
                <p className="user-token-string">{user.email}</p>

                {isAdmin && (
                  <div className="security-clearance-badge">
                    <AdminPanelSettingsOutlined /> <span>ADMIN</span>
                  </div>
                )}

                <div className="omni-footer-actions">
                  <button className="omni-logout-trigger-btn" onClick={logout}>
                    <LogoutOutlined />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </AuthContext.Provider>
  );
};
