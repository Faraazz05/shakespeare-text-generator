// src/api/client.ts
import axios from "axios";
import { API_BASE_URL } from "./config";

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 60000, // 60s — transformer generation can be slow on CPU
});

// ── Global response interceptor ───────────────────────────────────────────
// Attaches a human-readable .userMessage to every error so stores can
// display it directly without extra parsing.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      error.userMessage =
        `Cannot reach backend at ${API_BASE_URL} — is Docker running?`;
    } else {
      switch (error.response.status) {
        case 503:
          error.userMessage =
            "Model not loaded — go to the Train page first.";
          break;
        case 409:
          error.userMessage = "Training is already in progress.";
          break;
        case 422:
          error.userMessage = "Invalid request — check your inputs.";
          break;
        default:
          error.userMessage =
            error.response.data?.detail ?? "Something went wrong.";
      }
    }
    return Promise.reject(error);
  }
);

export default client;
