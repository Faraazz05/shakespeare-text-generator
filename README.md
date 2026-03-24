<div align="center">

# 🧠 Explainable Hybrid Text Generation System

**RNN (LSTM/GRU) + Transformer with Integrated Gradients XAI — full-stack, containerised**

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.3-EE4C2C?style=flat&logo=pytorch&logoColor=white)](https://pytorch.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)](https://docker.com)
[![License](https://img.shields.io/badge/License-Apache%202.0-green?style=flat)](LICENSE)

</div>

---

## 📸 Demo

| Generate Page | Explain Page | Train Page |
| --- | --- | --- |
| ![generate](docs/assets/generate.png) | ![explain](docs/assets/explain.png) | ![train](docs/assets/train.png) |

---

## 🔥 Problem

Most text generation systems are **black boxes** — they produce output but give no insight into *why* they generated those specific words. At the same time, most XAI tools are tacked on as afterthoughts, not integrated into the generation pipeline itself.

This project solves both: it builds a generation system where **explainability is first-class**, not optional.

---

## 💡 Approach

### Why RNN as the primary model?

RNNs (specifically LSTM/GRU) are the classical approach to sequential text modelling. Training one from scratch on a real corpus demonstrates the full ML pipeline — tokenisation, architecture design, training loop, checkpointing — in a way that using a pre-trained model does not.

The character-level approach was chosen deliberately: it forces the model to learn spelling, punctuation, and word structure from raw data rather than relying on a pre-built vocabulary.

### Why Transformer for comparison?

DistilGPT2 represents the modern architecture paradigm. Placing it alongside the RNN allows direct comparison of:

- Output quality at different scales
- Generation speed
- XAI interpretability differences (attention vs. integrated gradients)

### Why Integrated Gradients for XAI?

SHAP requires sampling and is slow for sequential models. Integrated Gradients (Sundararajan et al., 2017) works directly on embedding inputs — it approximates the contribution of each input token by integrating gradients along a path from a zero baseline to the actual input. No external library required, fully differentiable, and model-agnostic.

---

## 🏗️ Architecture

``` bash
User Interface (React + TypeScript)
            │
            ▼
        FastAPI Backend  (port 8000)
            │
     Model Routing Layer
            │
 ┌──────────┴───────────┐
 │                      │
RNN Generator     Transformer
(LSTM/GRU)        (DistilGPT2)
 │                      │
 └──────────┬───────────┘
            │
        XAI Module
   (Integrated Gradients /
    Attention Rollout)
            │
     JSON Response
            │
    Token Heatmap +
    Importance Chart
```

### Project Structure

``` bash
shakespeare-text-generator/
├── backend/
│   ├── main.py                  # FastAPI app entrypoint
│   ├── config.toml              # All settings (single source of truth)
│   ├── config.py                # TOML loader → typed dataclasses
│   ├── models/
│   │   ├── rnn_model.py         # LSTM/GRU architecture
│   │   ├── transformer_model.py # HuggingFace wrapper
│   │   └── model_registry.py   # Central model router
│   ├── training/
│   │   ├── tokenizer.py         # Character-level tokenizer
│   │   ├── dataset.py           # TinyShakespeare + DataLoaders
│   │   └── trainer.py           # Training loop + checkpointing
│   ├── generation/
│   │   └── generator.py         # Temperature + top-k sampling
│   ├── xai/
│   │   └── explainer.py         # Integrated Gradients + Attention Rollout
│   └── api/
│       └── routes.py            # All FastAPI endpoints
├── frontend/
│   └── src/
│       ├── api/                 # Axios API client + typed endpoints
│       ├── stores/              # Zustand global state
│       ├── components/          # Reusable UI components
│       └── pages/              # Generate, Explain, Models, Train, Config
├── checkpoints/                 # Model weights (git-ignored)
├── data/                        # Corpus cache (git-ignored)
└── docker-compose.yml
```

---

## 📊 Results

| Metric | Value |
| --- | --- |
| RNN type | LSTM |
| Parameters | 930,243 |
| Vocab size | 67 characters |
| Training corpus | TinyShakespeare (1.1M chars) |
| Best val loss | ~1.50 |
| Best perplexity | ~4.5 |
| Epochs | 20 |
| Training time (T4 GPU) | ~8 minutes |

**Sample RNN output** (prompt: `"To be or not to be"`, temperature 0.8):

``` bash
To be or not to be the state of the world,
And so the night is not the man that speaks
To the great lord of the sun and the earth...
```

---

## 🛠️ Tech Stack

| Layer | Technology |
| --- | --- |
| ML Framework | PyTorch 2.3 |
| RNN Model | Custom LSTM/GRU (from scratch) |
| Transformer | DistilGPT2 via HuggingFace Transformers |
| XAI | Integrated Gradients (custom PyTorch impl) |
| Backend | FastAPI + Uvicorn |
| Config | TOML + Python dataclasses |
| Frontend | React 18 + TypeScript + Vite |
| Styling | TailwindCSS + shadcn/ui |
| State | Zustand |
| Charts | Chart.js + react-chartjs-2 |
| Containerisation | Docker + Docker Compose |

---

## 🚀 How to Run

### Prerequisites

- Docker Desktop installed and running
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Faraazz05/shakespeare-text-generator.git
cd shakespeare-text-generator 
```

### 2. Start the backend

```bash
docker compose up --build
```

Backend available at `http://localhost:8000`
Swagger docs at `http://localhost:8000/docs`

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend available at `http://localhost:8080`

### 4. Train the RNN model

**Option A — via the UI:**
Navigate to `http://localhost:8080/train` → click **Start Training**
*(takes ~30–60 min on CPU)*

**Option B — Google Colab (recommended, ~8 min on T4 GPU):**

1. Open `colab/train_rnn_colab_v2.py` in Google Colab
2. Set runtime to T4 GPU
3. Run all cells
4. Download `rnn_best.pt` + `tokenizer.json`
5. Place both in `hybrid-text-gen/checkpoints/`
6. Restart Docker: `docker compose down && docker compose up`

### 5. Use the app

- **Generate** — type a prompt, pick RNN or Transformer, click Generate
- **Explain** — run XAI analysis on any prompt to see token importance
- **Models** — view model status and parameters
- **Train** — train or retrain the RNN with custom hyperparameters
- **Config** — view the live backend configuration

---

## 🧪 API Reference

```
GET  /           Health check + model status
GET  /models     List available models
POST /generate   Generate text
POST /explain    Token importance (XAI)
POST /train      Start training (background)
GET  /train/status  Poll training progress
GET  /config     Read active configuration
```

Full interactive docs: `http://localhost:8000/docs`

---

## 🎓 Key Learnings

- **Weight tying fails when embedding_dim ≠ hidden_size** — a subtle PyTorch bug that only surfaces at training time, not model construction
- **`float("inf")` breaks JSON serialization** — FastAPI crashes silently; always sanitize float values before returning from endpoints
- **Integrated Gradients without Captum** — implementing IG directly in PyTorch is straightforward and removes a heavy dependency
- **Character-level models are surprisingly expressive** — 930K parameters trained on 1.1M chars produces coherent Shakespearean style within 20 epochs
- **CORS must include every frontend port** — easy to forget when Vite uses a non-standard port like 8080

---

## 🙏 Credits

Built by **Faraz** as a deep-dive into production ML systems, classical vs. modern NLP architectures, and explainable AI.

- [Andrej Karpathy](https://github.com/karpathy) — TinyShakespeare dataset and char-rnn inspiration
- [Mukund Sundararajan et al.](https://arxiv.org/abs/1703.01365) — Integrated Gradients paper
- [HuggingFace](https://huggingface.co) — Transformers library and DistilGPT2
- [PyTorch](https://pytorch.org) — ML framework

---

## 📄 License

Licensed under the [Apache License 2.0](LICENSE).

---

<div align="center">

Build by Mohd Faraz

</div>
"" 
