import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  withCredentials: true, // so your secure cookies (access token) are sent
});

// Simple global error handler
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;

    // Handle 401 Unauthorized
    if (status === 401) {
      console.warn("Unauthorized request — redirecting to login.");
      // Redirect to login
      window.location.href = "/auth";
      return;
    }

    // Handle 403 Forbidden
    if (status === 403) {
      console.warn("Forbidden access — insufficient permissions.");
    }

    // Network or server errors
    if (!error.response) {
      console.error("Network error or server unreachable:", error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
