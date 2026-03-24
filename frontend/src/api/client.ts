// src/api/client.ts
import axios from "axios";

// ✅ Hardcoded Render URL as fallback — never falls back to localhost in production
const PROD_URL = "https://shakespeare-text-generator-1.onrender.com";
const BASE_URL = import.meta.env.VITE_API_BASE_URL || PROD_URL;

console.log("[API] Base URL:", BASE_URL); // helps debug in browser console

const client = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 60000,
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      error.userMessage =
        `Cannot reach backend at ${BASE_URL} — is it running?`;
    } else {
      switch (error.response.status) {
        case 503:
          error.userMessage = "Model not loaded — go to Train page first.";
          break;
        case 409:
          error.userMessage = "Training already in progress.";
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
