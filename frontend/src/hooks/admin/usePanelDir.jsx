import { useContext, useCallback } from "react";
import { PanelContext } from "/src/context/admin/PanelContext";
import { adminAPI } from "/src/services/api.js";

export function usePanelDir() {
  const context = useContext(PanelContext);
  if (!context) {
    throw new Error("usePanelDir must be used within an PanelProvder");
  }

  const {
    users,
    setUsers,
    vendors,
    setVendors,
    loadingStates,
    setLoadingStates,
    errors,
    setErrors,
  } = context;

  // Fetch users on demand
  const loadUsers = useCallback(async () => {
    setLoadingStates((prev) => ({ ...prev, users: true }));
    setErrors((prev) => ({ ...prev, users: null }));
    try {
      const data = await adminAPI.getUsers();
      setUsers(data.users || data);
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        users: err.message || "Failed to load users",
      }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, users: false }));
    }
  }, [setUsers, setLoadingStates, setErrors]);

  // Fetch vendors on demand
  const loadVendors = useCallback(async () => {
    setLoadingStates((prev) => ({ ...prev, vendors: true }));
    setErrors((prev) => ({ ...prev, vendors: null }));
    try {
      const data = await adminAPI.getVendors();
      setVendors(data.vendors || data);
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        vendors: err.message || "Failed to load vendors",
      }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, vendors: false }));
    }
  }, [setVendors, setLoadingStates, setErrors]);

  const saveItem = useCallback(
    async (type, data) => {
      setLoadingStates((prev) => ({
        ...prev,
        [type === "user" ? "users" : "vendors"]: true,
      }));
      setErrors((prev) => ({ ...prev, submit: null }));

      try {
        if (type === "user") {
          await adminAPI.addUser(data);
          await loadUsers(); // Refresh after success
        } else {
          await adminAPI.addVendor(data);
          await loadVendors(); // Refresh after success
        }
      } catch (err) {
        setErrors((prev) => ({
          ...prev,
          submit: err.message || `Failed to add ${type}`,
        }));
        throw err; // Re-throw so the component knows it failed
      } finally {
        setLoadingStates((prev) => ({
          ...prev,
          [type === "user" ? "users" : "vendors"]: false,
        }));
      }
    },
    [loadUsers, loadVendors, setErrors, setLoadingStates],
  );

  return {
    users,
    vendors,
    isUsersLoading: loadingStates.users,
    isVendorsLoading: loadingStates.vendors,
    usersError: errors.users,
    vendorsError: errors.vendors,
    loadUsers,
    loadVendors,
    saveItem,
  };
}
