import { VpnKeyOutlined } from "@mui/icons-material";

export function AdminLogin({
  email,
  setEmail,
  password,
  setPassword,
  error,
  onSubmit,
  styles,
}) {
  return (
    <div className={styles.adminLoginScreen}>
      <div className={styles.adminLoginCard}>
        <div className={styles.adminLockIcon}>
          <VpnKeyOutlined sx={{ fontSize: 32 }} />
        </div>
        <h2>Secure Admin Portal</h2>
        <p>EventRoots System Management Console</p>

        <form onSubmit={onSubmit}>
          <div className={styles.field}>
            <label>Master Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@eventroots.com"
              required
            />
          </div>

          <div className={styles.field}>
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
              className={styles.err}
              style={{ display: "block", marginTop: "0.5rem" }}
            >
              {error}
            </span>
          )}

          <button
            type="submit"
            className={styles.btnSave}
            style={{ width: "100%", marginTop: "1.5rem", padding: "0.75rem" }}
          >
            Authorize System Access
          </button>
        </form>
      </div>
    </div>
  );
}
