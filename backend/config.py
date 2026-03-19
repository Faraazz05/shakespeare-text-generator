"""
config.py — Typed configuration loader.

Reads config.toml and exposes a `settings` singleton
that every module imports instead of touching the file directly.

Usage
-----
    from config import settings
    print(settings.model.rnn.hidden_size)
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import List

# Python 3.11 ships tomllib; older versions need the backport
try:
    import tomllib
except ImportError:
    import tomli as tomllib  # type: ignore[no-redef]

_CONFIG_PATH = Path(__file__).parent / "config.toml"


# ── Leaf dataclasses ─────────────────────────────────────────────────────────

@dataclass
class RNNConfig:
    type: str          = "lstm"
    embedding_dim: int = 128
    hidden_size: int   = 256
    num_layers: int    = 2
    dropout: float     = 0.3
    vocab_size: int    = 0


@dataclass
class TransformerConfig:
    model_name: str    = "distilgpt2"
    max_new_tokens: int = 100
    cache_dir: str     = "./checkpoints/hf_cache"


@dataclass
class ModelConfig:
    default: str        = "rnn"
    checkpoint_dir: str = "./checkpoints"
    device: str         = "auto"
    rnn: RNNConfig      = field(default_factory=RNNConfig)
    transformer: TransformerConfig = field(default_factory=TransformerConfig)


@dataclass
class TrainingConfig:
    dataset: str          = "tinyshakespeare"
    data_dir: str         = "./data"
    sequence_length: int  = 100
    batch_size: int       = 64
    epochs: int           = 20
    learning_rate: float  = 0.001
    grad_clip: float      = 5.0
    val_split: float      = 0.1
    save_every: int       = 5
    log_every: int        = 100


@dataclass
class GenerationConfig:
    temperature: float = 0.8
    top_k: int         = 40
    max_length: int    = 200
    seed_text: str     = "To be or not to be"


@dataclass
class XAIConfig:
    method: str      = "integrated_gradients"
    n_steps: int     = 50
    top_k_tokens: int = 10


@dataclass
class APIConfig:
    host: str         = "0.0.0.0"
    port: int         = 8000
    reload: bool      = True
    cors_origins: List[str] = field(
        default_factory=lambda: ["http://localhost:3000"]
    )


@dataclass
class AppConfig:
    name: str          = "Hybrid Text Generation System"
    version: str       = "1.0.0"
    description: str   = ""
    model: ModelConfig      = field(default_factory=ModelConfig)
    training: TrainingConfig = field(default_factory=TrainingConfig)
    generation: GenerationConfig = field(default_factory=GenerationConfig)
    xai: XAIConfig     = field(default_factory=XAIConfig)
    api: APIConfig     = field(default_factory=APIConfig)


# ── Loader ───────────────────────────────────────────────────────────────────

def _load(path: Path = _CONFIG_PATH) -> AppConfig:
    with open(path, "rb") as fh:
        raw = tomllib.load(fh)

    proj = raw.get("project", {})
    m    = raw.get("model", {})
    t    = raw.get("training", {})
    g    = raw.get("generation", {})
    x    = raw.get("xai", {})
    a    = raw.get("api", {})

    return AppConfig(
        name        = proj.get("name", ""),
        version     = proj.get("version", "1.0.0"),
        description = proj.get("description", ""),
        model = ModelConfig(
            default        = m.get("default", "rnn"),
            checkpoint_dir = m.get("checkpoint_dir", "./checkpoints"),
            device         = m.get("device", "auto"),
            rnn            = RNNConfig(**m.get("rnn", {})),
            transformer    = TransformerConfig(**m.get("transformer", {})),
        ),
        training   = TrainingConfig(**t),
        generation = GenerationConfig(**g),
        xai        = XAIConfig(**x),
        api        = APIConfig(**a),
    )


# ── Singleton ────────────────────────────────────────────────────────────────
settings: AppConfig = _load()
