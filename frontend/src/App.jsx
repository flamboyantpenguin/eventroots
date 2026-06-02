import Hello from "./pages/hello/Hello";
import Login from "./pages/login/Login";
import Signup from "./pages/signup/Signup";
import Dash from "./pages/dash/Dash";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Hello />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "/dash",
    element: <Dash />,
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
