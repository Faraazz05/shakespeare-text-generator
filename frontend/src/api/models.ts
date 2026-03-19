// src/api/models.ts
import client from "./client";

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  available: boolean;
  params: number | null;
  meta: Record<string, unknown>;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  device: string;
  models: { rnn: boolean; transformer: boolean };
}

export const getModels = async (): Promise<ModelInfo[]> => {
  const { data } = await client.get<{ models: ModelInfo[] }>("/models");
  return data.models;
};

export const getHealth = async (): Promise<HealthResponse> => {
  const { data } = await client.get<HealthResponse>("/");
  return data;
};
