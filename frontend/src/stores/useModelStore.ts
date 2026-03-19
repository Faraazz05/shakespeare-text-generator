// src/stores/useModelStore.ts
import { create } from "zustand";
import { getModels, getHealth, ModelInfo, HealthResponse } from "../api/models";

interface ModelStore {
  models: ModelInfo[];
  health: HealthResponse | null;
  backendOnline: boolean;
  loading: boolean;
  error: string | null;
  // ✅ selectedModel — Lovable's components (GeneratePage, ExplainPage) read this
  selectedModel: "rnn" | "transformer";
  setSelectedModel: (m: "rnn" | "transformer") => void;
  // ✅ fetchModels — used by pages on mount
  fetchModels: () => Promise<void>;
  // ✅ checkHealth — used by Navbar every 10s
  checkHealth: () => Promise<void>;
}

export const useModelStore = create<ModelStore>((set) => ({
  models: [],
  health: null,
  backendOnline: false,
  loading: false,
  error: null,
  selectedModel: "rnn",

  setSelectedModel: (m) => set({ selectedModel: m }),

  checkHealth: async () => {
    try {
      const health = await getHealth();
      set({ health, backendOnline: true });
    } catch {
      set({ backendOnline: false, health: null });
    }
  },

  fetchModels: async () => {
    set({ loading: true, error: null });
    try {
      const models = await getModels();
      set({ models, loading: false });
    } catch (err: any) {
      set({
        error: err.userMessage ?? "Failed to fetch models.",
        loading: false,
      });
    }
  },
}));
