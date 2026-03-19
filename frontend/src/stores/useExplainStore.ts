// src/stores/useExplainStore.ts
import { create } from "zustand";
import { explainText, ExplainResponse } from "../api/explain";

interface ExplainStore {
  prompt: string;
  model: "rnn" | "transformer";
  topK: number;
  result: ExplainResponse | null;
  loading: boolean;
  error: string | null;
  setPrompt: (p: string) => void;
  setModel: (m: "rnn" | "transformer") => void;
  setTopK: (n: number) => void;
  clearError: () => void;
  clearResult: () => void;
  // ✅ explain(model) — ExplainPage passes selectedModel as arg
  explain: (model?: "rnn" | "transformer") => Promise<void>;
}

export const useExplainStore = create<ExplainStore>((set, get) => ({
  prompt: "",
  model: "rnn",
  topK: 10,
  result: null,
  loading: false,
  error: null,

  setPrompt: (p) => set({ prompt: p }),
  setModel: (m) => set({ model: m }),
  setTopK: (n) => set({ topK: n }),
  clearError: () => set({ error: null }),
  clearResult: () => set({ result: null }),

  explain: async (modelOverride?: "rnn" | "transformer") => {
    const { prompt, model, topK } = get();
    const activeModel = modelOverride ?? model;
    if (!prompt.trim()) return;

    set({ loading: true, error: null, result: null });
    try {
      const result = await explainText({
        prompt: prompt.trim(),
        model: activeModel,
        top_k: topK,
      });
      set({ result, model: activeModel, loading: false });
    } catch (err: any) {
      set({
        error: err.userMessage ?? "Explanation failed. Please try again.",
        loading: false,
      });
    }
  },
}));
