import Admin from "./pages/admin/Admin";
import Hello from "./pages/hello/Hello";
import Login from "./pages/login/Login";
import Editor from "./pages/event/Editor";
import Signup from "./pages/signup/Signup";
import Dash from "./pages/dash/Dash";
import { ProtectedRoute } from "./components/route/ProtectedRoute";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import { LoadingProvider } from "./context/LoadingProvider";
import { PanelProvider } from "./context/admin/PanelProvider";
import { ErrorProvider } from "./context/misc/ErrorProvider";
import { AuthProvider } from "./context/auth/AuthProvider";
import { EventProvider } from "./context/event/EventProvider";

import NotFound from "./pages/misc/Error";
import SystemError from "./pages/misc/Error";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    ),
    errorElement: <SystemError />,
    children: [
      {
        path: "",
        element: <Hello />,
      },
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
      {
        path: "*",
        element: <NotFound />,
      },
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
