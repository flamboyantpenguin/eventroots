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

const router = createBrowserRouter([
  {
    path: "/",
    element: <Hello />,
  },
  {
    path: "/login",
    element: (
      <>
        <ProtectedRoute guestOnly>
          <Login />
        </ProtectedRoute>
      </>
    ),
  },
  {
    path: "/signup",
    element: (
      <>
        <ProtectedRoute guestOnly>
          <Signup />
        </ProtectedRoute>
      </>
    ),
  },
  {
    path: "/editor",
    element: (
      <>
        <ProtectedRoute>
          <Editor />
        </ProtectedRoute>
      </>
    ),
  },
  {
    path: "/dash",
    element: (
      <>
        <ProtectedRoute>
          <Dash />
        </ProtectedRoute>
      </>
    ),
  },
  {
    path: "/admin",
    element: (
      <>
        <ProtectedRoute requireAdmin>
          <PanelProvider>
            <Admin />
          </PanelProvider>
        </ProtectedRoute>
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
