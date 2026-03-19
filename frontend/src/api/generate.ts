// src/api/generate.ts
import client from "./client";

export interface GenerateRequest {
  prompt: string;
  model: "rnn" | "transformer";
  max_length: number;
  temperature: number;
  top_k: number;
}

export interface GenerateResponse {
  generated_text: string;
  prompt: string;
  new_text: string;
  tokens_generated: number;
  time_ms: number;
  model: string;
  params: Record<string, number>;
}

export const generateText = async (
  req: GenerateRequest
): Promise<GenerateResponse> => {
  const { data } = await client.post<GenerateResponse>("/generate", req);
  return data;
};
