import { useState } from "react";
import {
  Face2Rounded,
  Visibility,
  VisibilityOff,
  CloudUploadRounded,
  CheckCircleRounded,
} from "@mui/icons-material";

import "./Signup.css"; // Appending to your existing styles cleanly
import Logo from "/src/assets/favicon.svg";
import { useAuth } from "../../hooks/useAuth";
import { useLoading } from "../../hooks/useLoadingContext";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // 🟢 Destructure your signup methods from your Auth module
  const { signup, failed, login } = useAuth();
  const { startLoading, stopLoading } = useLoading();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [pfpFile, setPfpFile] = useState(null);
  const [pfpPreview, setPfpPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPfpFile(file);
      setPfpPreview(URL.createObjectURL(file));
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    startLoading(
      "Provisioning Account",
      "Securing administrative database nodes...",
    );

    const payload = new FormData();
    payload.append("username", username);
    payload.append("email", email);
    payload.append("password", password);
    if (pfpFile) {
      payload.append("pfp", pfpFile);
    }

    try {
      await signup(payload);
      await login(email, password);
      navigate("/dash", { replace: true });
    } catch (err) {
      console.error("Signup validation failure:", err);
    } finally {
      stopLoading();
    }
  };

  return (
    <div className="login-main m3-theme">
      {/* 🔮 Left Column Panel: Shows structural graphics or avatar preview */}
      <div className="login-left">
        {pfpPreview ? (
          <div className="signup-preview-frame">
            <img
              src={pfpPreview}
              alt="Profile Preview"
              className="signup-avatar-circle"
            />
          </div>
        ) : (
          <Face2Rounded
            style={{
              fontSize: "20rem",
              color: "var(--md-sys-color-on-tertiary)",
            }}
          />
        )}
      </div>

      {/* 📋 Right Column Panel: Registration Input fields */}
      <div className="login-right">
        <div className="login-right-container">
          <div className="login-logo">
            <img src={Logo} alt="Logo" />
          </div>

          <div className="login-center">
            <h2>Create your account</h2>
            {!failed && <p>Get started with EventRoots platform</p>}
            {failed && <p className="error">{failed}</p>}

            <form onSubmit={handleSignupSubmit}>
              {/* 🟢 Username Field Input Group */}
              <div className="m3-input-group">
                <input
                  type="text"
                  placeholder=" "
                  id="username"
                  value={username}
                  required
                  onChange={(e) => setUsername(e.target.value)}
                />
                <label htmlFor="username">Username</label>
              </div>

              {/* Email Field Input Group */}
              <div className="m3-input-group">
                <input
                  type="email"
                  placeholder=" "
                  id="email"
                  value={email}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                />
                <label htmlFor="email">Email</label>
              </div>

              {/* Password Field Input Group */}
              <div className="m3-input-group pass-input-div">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder=" "
                  id="password"
                  value={password}
                  required
                  onChange={(e) => setPassword(e.target.value)}
                />
                <label htmlFor="password">Password</label>

                <div
                  className="m3-icon-button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </div>
              </div>

              {/* 🟢 Clean Custom M3 Multipart File Picker Dropzone */}
              <div className="signup-file-wrapper">
                <label
                  htmlFor="pfp-upload"
                  className={`m3-file-label ${pfpFile ? "uploaded" : ""}`}
                >
                  {pfpFile ? (
                    <CheckCircleRounded className="m3-file-icon success" />
                  ) : (
                    <CloudUploadRounded className="m3-file-icon" />
                  )}
                  <span>
                    {pfpFile
                      ? `Selected: ${pfpFile.name.substring(0, 20)}...`
                      : "Upload Profile Photo (Optional)"}
                  </span>
                </label>
                <input
                  id="pfp-upload"
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleFileChange}
                  style={{ display: "none" }} // Hide the native ugly browser button!
                />
              </div>

              <div className="login-center-buttons">
                <button type="submit" className="m3-btn m3-btn-filled">
                  Sign Up
                </button>
              </div>
            </form>
          </div>

          <p className="login-bottom-p">
            Already have an account? <a href="/login">Log In</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
