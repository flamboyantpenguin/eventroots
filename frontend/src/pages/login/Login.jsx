import { useState } from "react";
import { Link } from "react-router-dom";

import { Face2Rounded, Visibility, VisibilityOff } from "@mui/icons-material";

import styles from "./Login.module.css";

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
    <div className={`${styles.loginMain} m3-theme`}>
      <div className={styles.loginLeft}>
        <Face2Rounded
          style={{
            fontSize: "20rem",
            color: "var(--md-sys-color-on-tertiary)",
          }}
        />
      </div>

      <div className={styles.loginRight}>
        <div className={styles.loginRightContainer}>
          <div className={styles.loginLogo}>
            <img src={Logo} alt="Logo" />
          </div>

          <div className={styles.loginCenter}>
            <h2>Welcome back!</h2>
            {!failed && <p>Login to continue</p>}
            {failed && <p className={styles.error}>{failed}</p>}

            <form onSubmit={(e) => e.preventDefault()}>
              <div className={styles.m3InputGroup}>
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

              <div
                className={`${styles.m3InputGroup} ${styles.passInputContainer}`}
              >
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder=" "
                  id="password"
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
                <label htmlFor="password">Password</label>

                <div
                  className={styles.m3IconButton}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </div>
              </div>

              <div className={styles.loginCenterOptions}>
                <div className={styles.rememberDiv}>
                  <label className={styles.m3CheckboxContainer}>
                    <input type="checkbox" id="remember-checkbox" />
                    <span className={styles.m3CheckboxMark}></span>
                    Remember for 30 days
                  </label>
                </div>
                <Link to="/forgot-password" id={styles.forgotPassLink}>
                  Forgot password?
                </Link>
              </div>

              <div className={styles.loginCenterButtons}>
                <button
                  type="submit"
                  className={`${styles.m3Btn} ${styles.m3BtnFilled}`}
                  onClick={handleLoginSubmit}
                >
                  Log In
                </button>
              </div>
            </form>
          </div>

          <p className={styles.loginBottomP}>
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
