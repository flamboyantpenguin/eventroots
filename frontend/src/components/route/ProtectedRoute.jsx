import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "/src/hooks/useAuth";
import { useLoading } from "/src/hooks/useLoadingContext";

export function ProtectedRoute({
  children,
  requireAdmin = false,
  guestOnly = false,
}) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const { startLoading, stopLoading } = useLoading();

  useEffect(() => {
    if (loading) {
      startLoading(
        "Verifying Permissions",
        "Securing your active workspace canvas...",
      );
    } else {
      stopLoading();
    }
  }, [loading, startLoading, stopLoading]);

  // ⏳ 1. Safety Gate: Hold layout rendering while system checks credentials
  if (loading) {
    return null;
  }

  if (requireAdmin && isAuthenticated && !isAdmin) {
    return <Navigate to="/dash" replace />;
  }

  if (guestOnly && isAuthenticated) {
    return <Navigate to="/dash" replace />;
  }

  if (!guestOnly && !requireAdmin && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 🟢 5. Cleared: Pass through to either the /admin panel layout wrapper (which renders its own login form)
  // or standard user page views.
  return children;
}
