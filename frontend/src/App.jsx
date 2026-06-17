import { lazy, Suspense } from "react";
import { ProtectedRoute } from "./components/route/ProtectedRoute";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import { LoadingProvider } from "./context/LoadingProvider";
import { PanelProvider } from "./context/admin/PanelProvider";
import { ErrorProvider } from "./context/misc/ErrorProvider";
import { AuthProvider } from "./context/auth/AuthProvider";
import { EventProvider } from "./context/event/EventProvider";

import NotFound from "./pages/misc/Error";
import SystemError from "./pages/misc/Error";

const Hello = lazy(() => import("./pages/hello/Hello"));
const Login = lazy(() => import("./pages/login/Login"));
const Signup = lazy(() => import("./pages/signup/Signup"));
const Dash = lazy(() => import("./pages/dash/Dash"));
const Editor = lazy(() => import("./pages/event/Editor"));
const Admin = lazy(() => import("./pages/admin/Admin"));

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthProvider>
        <Suspense>
          <Outlet />
        </Suspense>
      </AuthProvider>
    ),
    errorElement: <SystemError />,
    children: [
      { path: "", element: <Hello /> },
      {
        path: "login",
        element: (
          <ProtectedRoute guestOnly>
            <Login />
          </ProtectedRoute>
        ),
      },
      {
        path: "signup",
        element: (
          <ProtectedRoute guestOnly>
            <Signup />
          </ProtectedRoute>
        ),
      },
      {
        path: "editor",
        element: (
          <ProtectedRoute>
            <EventProvider>
              <Editor />
            </EventProvider>
          </ProtectedRoute>
        ),
      },
      {
        path: "dash",
        element: (
          <ProtectedRoute>
            <EventProvider>
              <Dash />
            </EventProvider>
          </ProtectedRoute>
        ),
      },
      {
        path: "admin",
        element: (
          <ProtectedRoute requireAdmin>
            <PanelProvider>
              <Admin />
            </PanelProvider>
          </ProtectedRoute>
        ),
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

function App() {
  return (
    <>
      <ErrorProvider>
        <LoadingProvider>
          <RouterProvider router={router} />
        </LoadingProvider>
      </ErrorProvider>
    </>
  );
}

export default App;
