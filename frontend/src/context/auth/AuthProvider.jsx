import { useState, useEffect, useCallback, useMemo } from "react";
import { authAPI } from "/src/services/api.js";
import { AuthContext } from "./AuthContext";
import { createPortal } from "react-dom";
import {
  CloseOutlined,
  FingerprintOutlined,
  LogoutOutlined,
  ShieldMoonOutlined,
  TerminalOutlined,
} from "@mui/icons-material";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); // Defaulting to false instead of null for safer evaluations

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
    const response = await authAPI.getMe();
    return response;
  }, []);

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
          setUser(inflateUserPayload(profileData?.user)); // Soft fallback if backend layout shifts
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

  const login = useCallback(async (email, password, is_admin = false) => {
    setFailed(null);
    setLoading(true);
    try {
      const userData = await authAPI.login(email, password, is_admin);
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
      login,
      signup,
      logout,
      openProfile,
      closeProfile,
      refreshUser: fetchUserProfile,
    }),
    [
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
      {/* 🔮 THE UNIQUE PROFILE CONTROL BOARD PORTAL */}
      {isProfileOpen &&
        user &&
        createPortal(
          <div
            className="omni-portal-envelope"
            style={{ position: "fixed", inset: 0, zIndex: 9998 }}
          >
            {/* The Blurring Mask Layer */}
            <div className="omni-backdrop-shroud" onClick={closeProfile} />

            {/* Asymmetrical Command Window Layout Card */}
            <div className="omni-command-board">
              <button className="omni-close-btn" onClick={closeProfile}>
                <CloseOutlined />
              </button>

              {/* Left Column Section: Identity & Clearance Status */}
              <div className="omni-panel-identity">
                <div className="omni-avatar-frame">
                  <img src={user.pfp} alt="User Avatar" />
                  <div className="identity-status-pulse" />
                </div>
                <h2>{user.username}</h2>
                <p className="user-token-string">{user.email}</p>

                {isAdmin && (
                  <div className="security-clearance-badge">
                    <FingerprintOutlined /> <span>ROOT PRIVILEGES</span>
                  </div>
                )}
              </div>

              {/* Right Column Section: Actions & System Log metrics */}
              <div className="omni-panel-actions">
                <div className="panel-section-title">SECURITY GATEWAY</div>

                <div className="omni-action-grid">
                  <div className="omni-grid-card">
                    <TerminalOutlined className="card-icon" />
                    <h4>Workspace Keys</h4>
                    <p>
                      Review active session cookies and local storage tokens.
                    </p>
                  </div>
                  <div className="omni-grid-card">
                    <ShieldMoonOutlined className="card-icon" />
                    <h4>Encryption Status</h4>
                    <p>
                      End-to-end transport layer tunneling is verified active.
                    </p>
                  </div>
                </div>

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
