#!/bin/bash
# download_checkpoints.sh
# Runs on Render startup to pull checkpoint files from wherever you host them
# Options: Google Drive, Hugging Face Hub, GitHub Releases, Dropbox

CKPT_DIR="/app/checkpoints"
mkdir -p "$CKPT_DIR"

# ── Option 1: Download from GitHub Releases (recommended) ────────────────────
# After uploading rnn_best.pt to a GitHub Release, paste the URL below
RNN_URL="https://github.com/Faraazz05/shakespeare-text-generator/releases/download/v1.0.0/rnn_best.pt"
TOK_URL="https://github.com/Faraazz05/shakespeare-text-generator/releases/download/v1.0.0/tokenizer.json"

if [ ! -f "$CKPT_DIR/rnn_best.pt" ]; then
    echo "[Startup] Downloading rnn_best.pt..."
    curl -L "$RNN_URL" -o "$CKPT_DIR/rnn_best.pt"
    echo "[Startup] rnn_best.pt downloaded"
else
    echo "[Startup] rnn_best.pt already exists, skipping"
fi

if [ ! -f "$CKPT_DIR/tokenizer.json" ]; then
    echo "[Startup] Downloading tokenizer.json..."
    curl -L "$TOK_URL" -o "$CKPT_DIR/tokenizer.json"
    echo "[Startup] tokenizer.json downloaded"
else
    echo "[Startup] tokenizer.json already exists, skipping"
fi

echo "[Startup] Checkpoints ready. Starting FastAPI..."
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
