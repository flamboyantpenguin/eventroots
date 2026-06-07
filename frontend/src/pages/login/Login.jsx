import { useState } from "react";
import { Face2Rounded, Visibility, VisibilityOff } from "@mui/icons-material";

import "./Login.css";

import Logo from "/src/assets/favicon.svg";
import { useAuth } from "../../hooks/useAuth";
import { useLoading } from "../../hooks/useLoadingContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const { login, isAuthenticated, failed } = useAuth();
  const { startLoading, stopLoading } = useLoading();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    isAuthenticated;
    startLoading(
      "Authorizing Gateway",
      "Verifying administrative permissions...",
    );

    try {
      await login(loginEmail, loginPassword);
      navigate("/dash", { replace: true });
    } finally {
      stopLoading();
    }
  };

  return (
    <div className="login-main m3-theme">
      <div className="login-left">
        {/* <img src={Banner} alt="Banner Graphic" /> */}
        <Face2Rounded
          style={{
            fontSize: "20rem",
            color: "var(--md-sys-color-on-tertiary)",
          }}
        ></Face2Rounded>
      </div>

      <div className="login-right">
        <div className="login-right-container">
          <div className="login-logo">
            <img src={Logo} alt="Logo" />
          </div>

          <div className="login-center">
            <h2>Welcome back!</h2>
            {!failed && <p>Login to continue</p>}
            {failed && <p className="error">{failed}</p>}

            <form onSubmit={(e) => e.preventDefault()}>
              <div className="m3-input-group">
                <input
                  type="email"
                  placeholder=" "
                  id="email"
                  value={loginEmail}
                  required
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
                <label htmlFor="email">Email</label>
              </div>

              <div className="m3-input-group pass-input-div">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder=" "
                  id="password"
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
                <label htmlFor="password">Password</label>

                <div
                  className="m3-icon-button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </div>
              </div>

              <div className="login-center-options">
                <div className="remember-div">
                  <label className="m3-checkbox-container">
                    <input type="checkbox" id="remember-checkbox" />
                    <span className="m3-checkbox-mark"></span>
                    Remember for 30 days
                  </label>
                </div>
                <a href="#" className="forgot-pass-link">
                  Forgot password?
                </a>
              </div>

              <div className="login-center-buttons">
                <button
                  type="submit"
                  className="m3-btn m3-btn-filled"
                  onClick={handleLoginSubmit}
                >
                  Log In
                </button>
              </div>
            </form>
          </div>

          <p className="login-bottom-p">
            Don't have an account? <a href="/signup">Sign Up</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
