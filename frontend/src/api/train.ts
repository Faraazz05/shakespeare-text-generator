// src/api/train.ts
import client from "./client";

export interface TrainRequest {
  epochs?: number;
  learning_rate?: number;
  batch_size?: number;
  sequence_length?: number;
  rnn_type?: "lstm" | "gru";
  hidden_size?: number;
}

export interface TrainStatusResponse {
  is_running: boolean;
  finished: boolean;
  current_epoch: number;
  total_epochs: number;
  train_losses: number[];
  val_losses: number[];
  best_val_loss: number;
  last_log: string;
  error: string | null;
}

export interface TrainStartResponse {
  status: string;
  message: string;
}

export const startTraining = async (
  req: TrainRequest
): Promise<TrainStartResponse> => {
  const { data } = await client.post<TrainStartResponse>("/train", req);
  return data;
};

export const getTrainStatus = async (): Promise<TrainStatusResponse> => {
  const { data } = await client.get<TrainStatusResponse>("/train/status");
  return data;
};
