import { useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";

import "./Signup.css";

import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, signup, failed } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    await signup(name, email, password);
    await login(email, password);
    navigate("/dash");
  };

  return (
    <div className="login-main m3-theme">
      {/* ... Left Banner remains identical ... */}

      <div className="login-right">
        <div className="login-right-container">
          <div className="login-center">
            <h2>Greetings</h2>
            {!failed && <p>Create an Account to continue</p>}
            {failed && <p className="error-text">{failed}</p>}

            {/* 🟢 Step 1: Bind the real submit handler directly onto the form element */}
            <form onSubmit={handleSubmit}>
              <div className="m3-input-group">
                <input
                  type="text"
                  placeholder=" "
                  id="name"
                  value={name} // 🟢 Step 2: Bind value to lock input state in memory
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <label htmlFor="name">Name</label>
              </div>

              <div className="m3-input-group">
                <input
                  type="email"
                  placeholder=" "
                  id="email"
                  value={email} // 🟢 Step 2: Bind value to lock input state in memory
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <label htmlFor="email">Email</label>
              </div>

              <div className="m3-input-group pass-input-div">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder=" "
                  id="password"
                  value={password} // 🟢 Step 2: Bind value to lock input state in memory
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <label htmlFor="password">Password</label>

                <div
                  className="m3-icon-button"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </div>
              </div>

              <div className="login-center-buttons">
                {/* 🟢 Step 3: Switch to type="submit" so it utilizes native validation chains cleanly */}
                <button type="submit" className="m3-btn m3-btn-filled">
                  Sign Up
                </button>
              </div>
            </form>
          </div>

          <p className="login-bottom-p">
            Have an account? <a href="/login">Log in instead</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
