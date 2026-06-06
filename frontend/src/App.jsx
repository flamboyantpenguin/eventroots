import Admin from "./pages/admin/Admin";
import Hello from "./pages/hello/Hello";
import Login from "./pages/login/Login";
import Editor from "./pages/event/Editor";
import Signup from "./pages/signup/Signup";
import Dash from "./pages/dash/Dash";
import { ProtectedRoute } from "./components/route/ProtectedRoute";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { LoadingProvider } from "./context/LoadingProvider";
import { PanelProvider } from "./context/admin/PanelProvider";
import { AuthProvider } from "./context/auth/AuthProvider";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Hello />,
  },
  {
    path: "/login",
    element: (
      <>
        <AuthProvider>
          <ProtectedRoute guestOnly>
            <Login />
          </ProtectedRoute>
        </AuthProvider>
      </>
    ),
  },
  {
    path: "/signup",
    element: (
      <>
        <AuthProvider>
          <ProtectedRoute guestOnly>
            <Signup />
          </ProtectedRoute>
        </AuthProvider>
      </>
    ),
  },
  {
    path: "/editor",
    element: (
      <>
        <AuthProvider>
          <ProtectedRoute>
            <Editor />
          </ProtectedRoute>
        </AuthProvider>
      </>
    ),
  },
  {
    path: "/dash",
    element: (
      <>
        <AuthProvider>
          <ProtectedRoute>
            <Dash />
          </ProtectedRoute>
        </AuthProvider>
      </>
    ),
  },
  {
    path: "/admin",
    element: (
      <>
        <AuthProvider>
          <ProtectedRoute requireAdmin>
            <PanelProvider>
              <Admin />
            </PanelProvider>
          </ProtectedRoute>
        </AuthProvider>
      </>
    ),
  },
]);

function App() {
  return (
    <>
      <LoadingProvider>
        <RouterProvider router={router} />
      </LoadingProvider>
    </>
  );
}

export default App;
