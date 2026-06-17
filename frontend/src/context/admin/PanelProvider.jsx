import { useState } from "react";

import { PanelContext } from "./PanelContext";
import { useMemo } from "react";
import { adminAPI } from "/src/services/api.js";
import { useCallback } from "react";

export function PanelProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loadingStates, setLoadingStates] = useState({
    users: false,
    vendors: false,
  });
  const [errors, setErrors] = useState({ users: null, vendors: null });

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

  const addItem = useCallback(
    async (type, data) => {
      setLoadingStates((prev) => ({
        ...prev,
        [type === "user" ? "users" : "vendors"]: true,
      }));
      setErrors((prev) => ({ ...prev, submit: null }));

      try {
        if (type === "user") {
          await adminAPI.editUser(data);
          await loadUsers();
        } else {
          await adminAPI.addVendor(data);
          await loadVendors();
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

  const saveItem = useCallback(
    async (id, type, data) => {
      setLoadingStates((prev) => ({
        ...prev,
        [type === "user" ? "users" : "vendors"]: true,
      }));
      setErrors((prev) => ({ ...prev, submit: null }));

      try {
        if (type === "user") {
          await adminAPI.updateUser(id, data);
          await loadUsers();
        } else {
          await adminAPI.addVendor(data);
          await loadVendors();
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

  const deleteItem = useCallback(
    async (type, id) => {
      setLoadingStates((prev) => ({
        ...prev,
        [type === "user" ? "users" : "vendors"]: true,
      }));
      setErrors((prev) => ({ ...prev, submit: null }));

      try {
        if (type === "user") {
          await adminAPI.deleteUser(id);
          await loadUsers();
        } else {
          await adminAPI.deleteVendor(id);
          await loadVendors();
        }
      } catch (err) {
        setErrors((prev) => ({
          ...prev,
          submit: err.message || `Failed to delete ${type}`,
        }));
        throw err;
      } finally {
        setLoadingStates((prev) => ({
          ...prev,
          [type === "user" ? "users" : "vendors"]: false,
        }));
      }
    },
    [loadUsers, loadVendors, setErrors, setLoadingStates],
  );

  const contextValue = useMemo(
    () => ({
      users,
      addItem,
      vendors,
      deleteItem,
      isUsersLoading: loadingStates.users,
      isVendorsLoading: loadingStates.vendors,
      usersError: errors.users,
      vendorsError: errors.vendors,
      loadUsers,
      loadVendors,
      saveItem,
    }),
    [
      addItem,
      deleteItem,
      loadUsers,
      loadVendors,
      saveItem,
      users,
      vendors,
      errors.users,
      errors.vendors,
      loadingStates.users,
      loadingStates.vendors,
    ],
  );

  return (
    <PanelContext.Provider value={contextValue}>
      {children}
    </PanelContext.Provider>
  );
}
