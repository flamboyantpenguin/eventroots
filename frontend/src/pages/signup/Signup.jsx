import { useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";

import "./Signup.css";

import Logo from "/src/assets/react.svg";
import Banner from "/src/assets/images/banner.png";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <div className="login-main">
        <div className="login-left">
          <img src={Banner} alt="" />
        </div>
        <div className="login-right">
          <div className="login-right-container">
            <div className="login-logo">
              <img src={Logo} alt="" />
            </div>
            <div className="login-center">
              <h2>Hello!</h2>
              <p>Please enter your details</p>
              <form>
                <input type="text" placeholder="Username" />
                <input type="email" placeholder="Email" />
                <div className="pass-input-div">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                  />
                  {showPassword ? (
                    <VisibilityOff
                      onClick={() => {
                        setShowPassword(!showPassword);
                      }}
                    />
                  ) : (
                    <Visibility
                      onClick={() => {
                        setShowPassword(!showPassword);
                      }}
                    />
                  )}
                </div>

                <div className="login-center-options"></div>
                <div className="login-center-buttons">
                  <button type="button">Sign Up</button>
                </div>
              </form>
            </div>
            <p className="login-bottom-p">
              Have an account? <a href="/signup">Log in instead</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
