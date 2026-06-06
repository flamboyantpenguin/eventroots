import axios from "axios";

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

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export const authAPI = {
  async signup(username, email, password) {
    return request("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
  },

  async login(email, password, is_admin = false) {
    try {
      const response = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, is_admin }),
      });

      if (response && response.access_token) {
        localStorage.setItem("auth_token", response.access_token);
      }

      return response.data;
    } catch (error) {
      console.warn("Login failed: ", error);
    }
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

export const adminAPI = {
  getUsers: async () => {
    return request("/users", { method: "GET" });
  },

  getVendors: async () => {
    return request("/vendor", { method: "GET" });
  },

  addUser: (data) => apiClient.post("/users", data),
  addVendor: (data) => apiClient.post("/vendor", data),
};
