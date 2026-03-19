"""
models/model_registry.py — Central model routing layer.

The ModelRegistry is the single point of contact for the API.
It owns every model instance, handles device placement, and
exposes a clean get() / register() interface.

A module-level `registry` singleton is created at the bottom
and imported by the API and engine layers.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional

import torch

from config import settings
from models.rnn_model import RNNTextModel
from models.transformer_model import TransformerTextModel
from training.tokenizer import CharTokenizer


class ModelRegistry:

    def __init__(self) -> None:
        self._rnn: Optional[RNNTextModel]                 = None
        self._transformer: Optional[TransformerTextModel] = None
        self._tokenizer: Optional[CharTokenizer]          = None
        self._rnn_meta: Dict[str, Any]                    = {}
        self._device = self._resolve_device()

    # ── Device ───────────────────────────────────────────────────────────────

    def _resolve_device(self) -> torch.device:
        d = settings.model.device
        if d == "auto":
            return torch.device("cuda" if torch.cuda.is_available() else "cpu")
        return torch.device(d)

    @property
    def device(self) -> torch.device:
        return self._device

    # ── Tokenizer ────────────────────────────────────────────────────────────

    def load_tokenizer(self, path: Optional[str] = None) -> Optional[CharTokenizer]:
        tok_path = Path(path or settings.model.checkpoint_dir) / "tokenizer.json"
        if tok_path.exists():
            self._tokenizer = CharTokenizer.load(tok_path)
            print(f"[Registry] Tokenizer loaded  vocab={self._tokenizer.vocab_size}")
        else:
            print(f"[Registry] No tokenizer at {tok_path} — train first.")
        return self._tokenizer

    @property
    def tokenizer(self) -> Optional[CharTokenizer]:
        return self._tokenizer

    # ── RNN ──────────────────────────────────────────────────────────────────

    def load_rnn(self, checkpoint_path: Optional[str] = None) -> bool:
        """Load RNN from a checkpoint. Returns True on success."""
        ckpt_dir = Path(settings.model.checkpoint_dir)
        path = (Path(checkpoint_path) if checkpoint_path
                else self._latest_rnn_ckpt(ckpt_dir))
        if path is None:
            print("[Registry] No RNN checkpoint found.")
            return False
        try:
            model, payload = RNNTextModel.load(path, device=self._device)
            model.to(self._device)
            self._rnn      = model
            self._rnn_meta = {k: v for k, v in payload.items()
                              if k != "model_state"}
            print(f"[Registry] RNN registered: {model}")
            return True
        except Exception as exc:
            print(f"[Registry] RNN load failed: {exc}")
            return False

    @staticmethod
    def _latest_rnn_ckpt(ckpt_dir: Path) -> Optional[Path]:
        candidates = sorted(ckpt_dir.glob("rnn_epoch_*.pt"))
        if candidates:
            return candidates[-1]
        best = ckpt_dir / "rnn_best.pt"
        return best if best.exists() else None

    def register_rnn(self, model: RNNTextModel) -> None:
        """Register an already-trained RNN (called after training completes)."""
        model.to(self._device)
        self._rnn = model

    # ── Transformer ──────────────────────────────────────────────────────────

    def load_transformer(self) -> bool:
        """Register the Transformer wrapper (weights are lazy-loaded on first call)."""
        try:
            self._transformer = TransformerTextModel(
                model_name=settings.model.transformer.model_name,
                cache_dir=settings.model.transformer.cache_dir,
                device=settings.model.device,
            )
            print(f"[Registry] Transformer registered (lazy): "
                  f"{settings.model.transformer.model_name}")
            return True
        except Exception as exc:
            print(f"[Registry] Transformer register failed: {exc}")
            return False

    # ── Getters ──────────────────────────────────────────────────────────────

    def get_rnn(self) -> Optional[RNNTextModel]:
        return self._rnn

    def get_transformer(self) -> Optional[TransformerTextModel]:
        return self._transformer

    def get(self, model_type: str) -> Any:
        if model_type == "rnn":
            return self._rnn
        if model_type == "transformer":
            return self._transformer
        raise ValueError(f"Unknown model '{model_type}'")

    # ── Status ───────────────────────────────────────────────────────────────

    def available_models(self) -> List[Dict[str, Any]]:
        return [
            {
                "id":          "rnn",
                "name":        f"RNN ({settings.model.rnn.type.upper()})",
                "description": "Character-level recurrent model (TinyShakespeare)",
                "available":   self._rnn is not None,
                "params":      self._rnn.param_count() if self._rnn else None,
                "meta":        self._rnn_meta,
            },
            {
                "id":          "transformer",
                "name":        f"Transformer ({settings.model.transformer.model_name})",
                "description": "Pre-trained causal LM via HuggingFace",
                "available":   self._transformer is not None,
                "params":      None,
                "meta": (self._transformer.model_info()
                         if self._transformer else {}),
            },
        ]

    def __repr__(self) -> str:
        return (f"ModelRegistry("
                f"rnn={'✓' if self._rnn else '✗'}, "
                f"transformer={'✓' if self._transformer else '✗'}, "
                f"device={self._device})")


# ── Module-level singleton (imported by all other layers) ────────────────────
registry = ModelRegistry()
