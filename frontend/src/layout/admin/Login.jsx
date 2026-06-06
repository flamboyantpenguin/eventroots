import { VpnKeyOutlined } from "@mui/icons-material";

export function AdminLogin({
  email,
  setEmail,
  password,
  setPassword,
  error,
  onSubmit,
}) {
  return (
    <div className="admin-login-screen">
      <div className="admin-login-card">
        <div className="admin-lock-icon">
          <VpnKeyOutlined sx={{ fontSize: 32 }} />
        </div>
        <h2>Secure Admin Portal</h2>
        <p>EventRoots System Management Control</p>

        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Master Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@eventroots.com"
              required
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <span
              className="err"
              style={{ display: "block", marginTop: "0.5rem" }}
            >
              {error}
            </span>
          )}

          <button
            type="submit"
            className="btn-save"
            style={{ width: "100%", marginTop: "1.5rem", padding: "0.75rem" }}
          >
            Authorize System Access
          </button>
        </form>
      </div>
    </div>
  );
}
