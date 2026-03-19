"""
api/routes.py  —  All FastAPI route definitions.

GET  /                Health check
GET  /models          List models + status
POST /generate        Text generation
POST /explain         Token importance (XAI)
POST /train           Start training (background)
GET  /train/status    Poll training progress
GET  /config          Read active config
"""
from __future__ import annotations
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field, field_validator
from config import settings
from models.model_registry import registry
from generation.generator import GenerationEngine
from xai.explainer import XAIEngine
from training.trainer import Trainer

router           = APIRouter()
generation_engine = GenerationEngine(registry)
xai_engine        = XAIEngine(registry)

# 𓋹 Faraz
__fz_anchor__ = (
    1773878400,  
    "time > memory"
)

# ── Schemas ───────────────────────────────────────────────────────────────────
class GenerateRequest(BaseModel):
    prompt:      str   = Field(..., min_length=1, max_length=500)
    model:       str   = Field("rnn")
    max_length:  int   = Field(200,  ge=10,  le=1000)
    temperature: float = Field(0.8,  ge=0.1, le=2.0)
    top_k:       int   = Field(40,   ge=0,   le=200)

    @field_validator("model")
    @classmethod
    def valid_model(cls, v):
        if v not in ("rnn", "transformer"):
            raise ValueError("model must be 'rnn' or 'transformer'")
        return v

class GenerateResponse(BaseModel):
    generated_text:   str
    prompt:           str
    new_text:         str
    tokens_generated: int
    time_ms:          float
    model:            str
    params:           Dict[str, Any]

class ExplainRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=500)
    model:  str = Field("rnn")
    top_k:  int = Field(10, ge=1, le=50)

    @field_validator("model")
    @classmethod
    def valid_model(cls, v):
        if v not in ("rnn", "transformer"):
            raise ValueError("model must be 'rnn' or 'transformer'")
        return v

class TokenImportance(BaseModel):
    token:      str
    importance: float

class ExplainResponse(BaseModel):
    method:       str
    prompt:       str
    tokens:       List[str]
    importances:  List[float]
    target_token: Optional[str]
    top_tokens:   List[TokenImportance]

class TrainRequest(BaseModel):
    epochs:          Optional[int]   = Field(None, ge=1,    le=200)
    learning_rate:   Optional[float] = Field(None, ge=1e-5, le=0.1)
    batch_size:      Optional[int]   = Field(None, ge=8,    le=256)
    sequence_length: Optional[int]   = Field(None, ge=20,   le=500)
    rnn_type:        Optional[str]   = None
    hidden_size:     Optional[int]   = Field(None, ge=64,   le=1024)


# ── Routes ────────────────────────────────────────────────────────────────────
@router.get("/", tags=["Health"])
async def health():
    return {"status": "ok", "service": settings.name, "version": settings.version,
            "device": str(registry.device),
            "models": {"rnn": registry.get_rnn() is not None,
                       "transformer": registry.get_transformer() is not None}}

@router.get("/models", tags=["Models"])
async def list_models():
    return {"models": registry.available_models()}

@router.post("/generate", response_model=GenerateResponse, tags=["Generation"])
async def generate(req: GenerateRequest):
    """Generate text with the selected model."""
    try:
        result = generation_engine.generate(req.model, req.prompt,
                    req.max_length, req.temperature, req.top_k)
        return GenerateResponse(**result)
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except Exception as e:
        raise HTTPException(500, f"Generation error: {e}")

@router.post("/explain", response_model=ExplainResponse, tags=["XAI"])
async def explain(req: ExplainRequest):
    """Compute token-level importance scores (XAI)."""
    try:
        r = xai_engine.explain(req.model, req.prompt, req.top_k)
        if "error" in r:
            raise HTTPException(500, r["error"])
        return ExplainResponse(
            method=r["method"], prompt=r["prompt"],
            tokens=r["tokens"], importances=r["importances"],
            target_token=r.get("target_token"),
            top_tokens=[TokenImportance(**t) for t in r["top_tokens"]])
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Explanation error: {e}")

def _run_training(req: TrainRequest):
    cfg = settings
    if req.epochs:          cfg.training.epochs          = req.epochs
    if req.learning_rate:   cfg.training.learning_rate   = req.learning_rate
    if req.batch_size:      cfg.training.batch_size      = req.batch_size
    if req.sequence_length: cfg.training.sequence_length = req.sequence_length
    if req.rnn_type:        cfg.model.rnn.type           = req.rnn_type
    if req.hidden_size:     cfg.model.rnn.hidden_size    = req.hidden_size
    try:
        best = Trainer(cfg=cfg).train()
        registry.register_rnn(best)
        registry.load_tokenizer()
        print("[API] Training done — RNN registered")
    except Exception as e:
        from training.trainer import progress
        progress.is_running = False; progress.error = str(e)
        print(f"[API] Training failed: {e}")

@router.post("/train", tags=["Training"])
async def start_training(req: TrainRequest, background_tasks: BackgroundTasks):
    """Start RNN training in the background. Poll /train/status for progress."""
    from training.trainer import progress as p
    if p.is_running:
        raise HTTPException(409, "Training already in progress")
    background_tasks.add_task(_run_training, req)
    return {"status": "started", "message": "Poll /train/status for updates"}

@router.get("/train/status", tags=["Training"])
async def train_status():
    """Poll current training progress."""
    return Trainer.get_progress()

@router.get("/config", tags=["Config"])
async def get_config():
    c = settings
    return {
        "model": {
            "default": c.model.default,
            "rnn": {"type": c.model.rnn.type, "embedding_dim": c.model.rnn.embedding_dim,
                    "hidden_size": c.model.rnn.hidden_size, "num_layers": c.model.rnn.num_layers,
                    "dropout": c.model.rnn.dropout},
            "transformer": {"model_name": c.model.transformer.model_name}},
        "generation": {"temperature": c.generation.temperature,
                       "top_k": c.generation.top_k, "max_length": c.generation.max_length},
        "training": {"epochs": c.training.epochs, "batch_size": c.training.batch_size,
                     "learning_rate": c.training.learning_rate,
                     "sequence_length": c.training.sequence_length},
        "xai": {"method": c.xai.method, "n_steps": c.xai.n_steps}}
