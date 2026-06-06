const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  options.headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const token = localStorage.getItem("auth_token");
  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.detail || result.message || "An API exception occurred.",
      );
    }

    return result;
  } catch (error) {
    console.error("Backend API Route Failure [${endpoint}]:", error.message);
    throw error;
  }
}

export const authAPI = {
  async signup(username, email, password) {
    return request("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
  },

  async login(email, password, is_admin = false) {
    const response = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, is_admin }),
    });

    if (response.data && response.data.access_token) {
      localStorage.setItem("auth_token", response.data.access_token);
    }

    return response.data;
  },

  async getMe() {
    return request("/auth/me", { method: "GET" });
  },

  async logout() {
    try {
      await request("/auth/logout", { method: "DELETE" });
    } catch (error) {
      console.warn("Backend session already stale or missing:", error.message);
    } finally {
      localStorage.removeItem("auth_token");
    }
  },
};
