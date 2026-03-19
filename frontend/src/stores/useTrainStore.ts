// src/stores/useTrainStore.ts
import { create } from "zustand";
import {
  startTraining,
  getTrainStatus,
  TrainRequest,
  TrainStatusResponse,
} from "../api/train";

interface TrainStore {
  config: TrainRequest;
  status: TrainStatusResponse | null;
  loading: boolean;
  isPolling: boolean;
  error: string | null;
  _intervalId: ReturnType<typeof setInterval> | null;
  setConfig: (c: Partial<TrainRequest>) => void;
  startTraining: () => Promise<void>;
  pollStatus: () => Promise<void>;
  stopPolling: () => void;
  clearError: () => void;
}

export const useTrainStore = create<TrainStore>((set, get) => ({
  config: {
    epochs: 20,
    learning_rate: 0.001,
    batch_size: 64,
    sequence_length: 100,
    rnn_type: "lstm",
    hidden_size: 256,
  },
  status: null,
  loading: false,
  isPolling: false,
  error: null,
  _intervalId: null,

  setConfig: (c) => set((s) => ({ config: { ...s.config, ...c } })),
  clearError: () => set({ error: null }),

  startTraining: async () => {
    const { config } = get();
    set({ loading: true, error: null });
    try {
      await startTraining(config);
      set({ loading: false });
      // Start polling every 3s
      const id = setInterval(() => get().pollStatus(), 3000);
      set({ isPolling: true, _intervalId: id });
      get().pollStatus(); // immediate first poll
    } catch (err: any) {
      set({
        error: err.userMessage ?? "Failed to start training.",
        loading: false,
      });
    }
  },

  pollStatus: async () => {
    try {
      const status = await getTrainStatus();
      // ✅ Always clear error on successful poll
      set({ status, error: null });
      if (status.finished || status.error) {
        get().stopPolling();
        // Surface backend error if present
        if (status.error) set({ error: status.error });
      }
    } catch (err: any) {
      // Only show network error if we were actively polling (training in progress)
      // Don't show error on the passive background poll on page mount
      const { isPolling } = get();
      if (isPolling) {
        set({ error: err.userMessage ?? "Lost connection to backend." });
        get().stopPolling();
      }
      // Silent fail on background mount poll — navbar already shows offline state
    }
  },

  stopPolling: () => {
    const { _intervalId } = get();
    if (_intervalId) clearInterval(_intervalId);
    set({ isPolling: false, _intervalId: null });
  },
}));
