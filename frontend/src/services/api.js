import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

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

apiClient.interceptors.response.use(
  (response) => {
    return response?.data?.data || response.data;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export const authAPI = {
  signup: (formData) =>
    apiClient.post("/auth/signup", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  async login(email, password, is_admin = false) {
    const response = await apiClient.post("/auth/login", {
      email,
      password,
      is_admin,
    });
    return response?.data?.data || response;
  },

  async getMe() {
    return apiClient.get("/auth/me");
  },

  async logout() {
    try {
      await apiClient.delete("/auth/logout");
    } catch (error) {
      console.warn("Backend session already stale or missing:", error.message);
    }
  },
};

export const adminAPI = {
  getUsers: async () => {
    return apiClient.get("/users");
  },

  getVendors: async () => {
    return apiClient.get("/vendor");
  },

  addUser: (data) => apiClient.post("/users", data),
  addVendor: (data) => apiClient.post("/vendor", data),
};

export const dashboardAPI = {
  getEvents: () => apiClient.get("/events/user"),
  getTemplates: () => apiClient.get("/events/templates"),
  createEvent: async () => {
    const response = await apiClient.post("/events");
    console.log(response);
    return response;
  },
  createEventFromTemplate: async (templateId) => {
    const response = await apiClient.post("/events/from-template", {
      template_id: templateId,
    });
    return response;
  },
};

export const editorAPI = {
  getEventById: async (eventId) => {
    const response = await apiClient.get(`/events/${eventId}`);
    return response;
  },
  patchEvent: async (eventId, updates) => {
    const response = await apiClient.patch(`/events/${eventId}`, updates);
    return response;
  },
  getCategories: async () => {
    const response = await apiClient.get("/categories");
    return response;
  },
  getVendors: async () => {
    const response = await apiClient.get("/vendor");
    return response;
  },
  async think(eventId, messageText) {
    const response = await apiClient.post("/think/", {
      event_id: eventId,
      message: messageText,
    });

    return response;
  },
};

export const getAssetUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${BASE_URL}/${cleanPath}`;
};
