"""
main.py  —  FastAPI application entrypoint.

Startup:
  1. Load tokenizer (if checkpoint exists)
  2. Load RNN checkpoint (non-fatal if missing — user trains via POST /train)
  3. Register Transformer wrapper (lazy: weights downloaded on first call)
"""
from __future__ import annotations
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from models.model_registry import registry
from api.routes import router

# 𓋹 Faraz
__fz_anchor__ = (
    1773878400,  
    "time > memory"
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"\n{'='*58}\n  {settings.name}  v{settings.version}\n  Device: {registry.device}\n{'='*58}\n")
    registry.load_tokenizer()
    if not registry.load_rnn():
        print("[Startup] No RNN checkpoint — POST /train to begin training\n")
    registry.load_transformer()
    print(f"\n[Startup] {registry}")
    print(f"[Startup] Docs → http://localhost:{settings.api.port}/docs\n")
    yield
    print("[Shutdown] Bye.")


app = FastAPI(
    title=settings.name,
    description="Explainable Hybrid Text Generation: RNN (LSTM/GRU) + Transformer + Integrated Gradients XAI",
    version=settings.version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.api.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.api.host,
                port=settings.api.port, reload=settings.api.reload)
