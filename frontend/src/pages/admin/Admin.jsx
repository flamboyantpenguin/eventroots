import { useState } from "react";
import styles from "./Admin.module.css";
import { AdminLogin } from "../../layout/admin/Login";
import { useAuth } from "../../hooks/useAuth";
import { useLoading } from "../../hooks/useLoadingContext";
import Panel from "../../layout/admin/Panel";

export default function Admin() {
  const { adminLogin, adminLogout, isAuthenticated, user, isAdmin } = useAuth();
  const { startLoading, stopLoading } = useLoading();

  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    startLoading(
      "Authorizing Gateway",
      "Verifying administrative permissions...",
    );

    try {
      const data = await adminLogin(adminEmail, adminPassword, true);
      if (!data.is_admin) {
        setLoginError("Access Denied: Account lacks administrative clearance.");
        await adminLogout();
      }
    } catch (err) {
      setLoginError(err.message || "Invalid system administrator credentials.");
    } finally {
      stopLoading();
    }
  };

  if (!isAuthenticated || !user || !isAdmin) {
    return (
      <>
        <AdminLogin
          email={adminEmail}
          setEmail={setAdminEmail}
          password={adminPassword}
          setPassword={setAdminPassword}
          error={loginError}
          onSubmit={handleAdminLoginSubmit}
          styles={styles}
        />
      </>
    );
  }

  return (
    <>
      <Panel styles={styles}></Panel>
    </>
  );
}
