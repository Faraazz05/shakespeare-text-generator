// src/api/explain.ts
import client from "./client";

export interface ExplainRequest {
  prompt: string;
  model: "rnn" | "transformer";
  top_k: number;
}

// Exported as both names — Lovable uses TopToken, rest of codebase uses TokenImportance
export interface TokenImportance {
  token: string;
  importance: number;
}
export type TopToken = TokenImportance;   // ← alias fixes ImportanceChart import

export interface ExplainResponse {
  method: string;
  prompt: string;
  tokens: string[];
  importances: number[];
  target_token: string | null;
  top_tokens: TokenImportance[];
}

export const explainText = async (
  req: ExplainRequest
): Promise<ExplainResponse> => {
  const { data } = await client.post<ExplainResponse>("/explain", req);
  return data;
};
