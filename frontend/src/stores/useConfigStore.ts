// src/stores/useConfigStore.ts
// Fetches the active config from GET /config and exposes it read-only.
import { create } from "zustand";
import client from "../api/client";

export interface BackendConfig {
  model: {
    default: string;
    rnn: {
      type: string;
      embedding_dim: number;
      hidden_size: number;
      num_layers: number;
      dropout: number;
    };
    transformer: { model_name: string };
  };
  generation: { temperature: number; top_k: number; max_length: number };
  training: {
    epochs: number;
    batch_size: number;
    learning_rate: number;
    sequence_length: number;
  };
  xai: { method: string; n_steps: number };
}

interface ConfigStore {
  config: BackendConfig | null;
  loading: boolean;
  error: string | null;
  fetchConfig: () => Promise<void>;
}

export const useConfigStore = create<ConfigStore>((set) => ({
  config: null,
  loading: false,
  error: null,

  fetchConfig: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await client.get<BackendConfig>("/config");
      set({ config: data, loading: false });
    } catch (err: any) {
      set({
        error: err.userMessage ?? "Failed to load config.",
        loading: false,
      });
    }
  },
}));
