import { useState } from "react";
import {
  Face2Rounded,
  Visibility,
  VisibilityOff,
  CloudUploadRounded,
  CheckCircleRounded,
} from "@mui/icons-material";

import { Link } from "react-router-dom";
import styles from "./Signup.module.css";
import Logo from "/src/assets/favicon.svg";
import { useAuth } from "../../hooks/useAuth";
import { useLoading } from "../../hooks/useLoadingContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { signup, failed, login } = useAuth();
  const { startLoading, stopLoading } = useLoading();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");

  const [pfpFile, setPfpFile] = useState(null);
  const [pfpPreview, setPfpPreview] = useState(null);

  useEffect(() => {
    return () => {
      if (pfpPreview) {
        URL.revokeObjectURL(pfpPreview);
      }
    };
  }, [pfpPreview]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const safeSecureTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
    ];

    if (!safeSecureTypes.includes(file.type)) {
      setError("Please upload a valid image file (PNG, JPEG, or WebP).");
      return;
    }
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
    <div className={`${styles.loginMain} m3-theme`}>
      <div className={styles.loginLeft}>
        {pfpPreview ? (
          <div className={styles.signupPreviewFrame}>
            <img
              src={pfpPreview}
              alt="Profile Preview"
              crossOrigin="anonymous"
              className={styles.signupAvatarCircle}
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

      <div className={styles.loginRight}>
        <div className={styles.loginRightContainer}>
          <div className={styles.loginLogo}>
            <img src={Logo} alt="Logo" />
          </div>

          <div className={styles.loginCenter}>
            <h2>Create your account</h2>
            {!failed && <p>Power up your Schedule with EventRoots</p>}
            {failed && <p className={styles.error}>{failed}</p>}
            {error && <p className={styles.error}>{error}</p>}

            <form onSubmit={handleSignupSubmit}>
              <div className={styles.m3InputGroup}>
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

              <div className={styles.m3InputGroup}>
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

              <div
                className={`${styles.m3InputGroup} ${styles.passInputContainer}`}
              >
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
                  className={styles.m3IconButton}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </div>
              </div>

              <div className={styles.signupFileWrapper}>
                <label
                  htmlFor="pfp-upload"
                  className={`${styles.m3FileLabel} ${pfpFile ? styles.uploaded : ""}`}
                >
                  {pfpFile ? (
                    <CheckCircleRounded
                      className={`${styles.m3FileIcon} ${styles.success}`}
                    />
                  ) : (
                    <CloudUploadRounded className={styles.m3FileIcon} />
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
                  style={{ display: "none" }}
                />
              </div>

              <div className={styles.loginCenterButtons}>
                <button
                  type="submit"
                  className={`${styles.m3Btn} ${styles.m3BtnFilled}`}
                >
                  Sign Up
                </button>
              </div>
            </form>
          </div>

          <p className={styles.loginBottomP}>
            Already have an account? <Link to="/login">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
