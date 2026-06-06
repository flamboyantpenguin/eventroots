import { useState } from "react";

import { PanelContext } from "./PanelContext";

export function PanelProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loadingStates, setLoadingStates] = useState({
    users: false,
    vendors: false,
  });
  const [errors, setErrors] = useState({ users: null, vendors: null });

  return (
    <PanelContext.Provider
      value={{
        users,
        setUsers,
        vendors,
        setVendors,
        loadingStates,
        setLoadingStates,
        errors,
        setErrors,
      }}
    >
      {children}
    </PanelContext.Provider>
  );
}
