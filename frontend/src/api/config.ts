// src/api/config.ts
// Single source of truth for the backend URL.
// Reads from .env → VITE_API_BASE_URL, falls back to localhost:8000

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
