import { useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";

import "./Signup.css";

import Logo from "/src/assets/react.svg";
import Banner from "/src/assets/images/banner.png";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="login-main m3-theme">
      <div className="login-left">
        <img src={Banner} alt="Banner Graphic" />
      </div>

      <div className="login-right">
        <div className="login-right-container">
          <div className="login-logo">
            <img src={Logo} alt="Logo" />
          </div>

          <div className="login-center">
            <h2>Greetings</h2>
            <p>Create an Account to continue</p>

            <form onSubmit={(e) => e.preventDefault()}>
              <div className="m3-input-group">
                <input type="email" placeholder=" " id="email" required />
                <label htmlFor="email">Email</label>
              </div>

              <div className="m3-input-group pass-input-div">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder=" "
                  id="password"
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
                <div className="remember-div"></div>
              </div>

              <div className="login-center-buttons">
                <button type="submit" className="m3-btn m3-btn-filled">
                  Sign Up
                </button>
              </div>
            </form>
          </div>

          <p className="login-bottom-p">
            Have an account? <a href="/signup">Sign up instead</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
