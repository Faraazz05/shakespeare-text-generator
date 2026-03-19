// src/stores/useGenerateStore.ts
import { create } from "zustand";
import { generateText, GenerateResponse } from "../api/generate";

export interface HistoryEntry {
  id: string;
  prompt: string;
  model: "rnn" | "transformer";
  result: GenerateResponse;
  timestamp: number;
}

interface GenerateStore {
  prompt: string;
  model: "rnn" | "transformer";
  maxLength: number;
  temperature: number;
  topK: number;
  result: GenerateResponse | null;
  loading: boolean;
  error: string | null;
  history: HistoryEntry[];
  setPrompt: (p: string) => void;
  setModel: (m: "rnn" | "transformer") => void;
  setMaxLength: (n: number) => void;
  setTemperature: (n: number) => void;
  setTopK: (n: number) => void;
  clearError: () => void;
  clearResult: () => void;
  generate: (model?: "rnn" | "transformer") => Promise<void>;
  rerun: (entry: HistoryEntry) => Promise<void>;
  clearHistory: () => void;
}

export const useGenerateStore = create<GenerateStore>((set, get) => ({
  prompt: "",
  model: "rnn",
  maxLength: 200,
  temperature: 0.8,
  topK: 40,
  result: null,
  loading: false,
  error: null,
  history: [],

  setPrompt: (p) => set({ prompt: p, error: null }), // ✅ clear error on new input
  setModel: (m) => set({ model: m }),
  setMaxLength: (n) => set({ maxLength: n }),
  setTemperature: (n) => set({ temperature: n }),
  setTopK: (n) => set({ topK: n }),
  clearError: () => set({ error: null }),
  clearResult: () => set({ result: null }),
  clearHistory: () => set({ history: [] }),

  generate: async (modelOverride?: "rnn" | "transformer") => {
    const { prompt, model, maxLength, temperature, topK, history } = get();
    const activeModel = modelOverride ?? model;
    if (!prompt.trim()) return;

    set({ loading: true, error: null, result: null });
    try {
      const result = await generateText({
        prompt: prompt.trim(),
        model: activeModel,
        max_length: maxLength,
        temperature,
        top_k: topK,
      });

      const entry: HistoryEntry = {
        id: Date.now().toString(),
        prompt: prompt.trim(),
        model: activeModel,
        result,
        timestamp: Date.now(),
      };
      set({
        result,
        loading: false,
        model: activeModel,
        history: [entry, ...history].slice(0, 20),
      });
    } catch (err: any) {
      set({
        error: err.userMessage ?? "Generation failed. Please try again.",
        loading: false,
      });
    }
  },

  rerun: async (entry: HistoryEntry) => {
    set({ prompt: entry.prompt, error: null });
    await get().generate(entry.model);
  },
}));
