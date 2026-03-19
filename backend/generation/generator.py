"""
generation/generator.py — Text generation engine.

Provides temperature + top-k autoregressive sampling for both
the RNN and the Transformer, with a unified GenerationEngine
facade that routes by model type.
"""
from __future__ import annotations

import time
from typing import Any, Dict, List, Optional

import torch
import torch.nn.functional as F

from models.rnn_model import RNNTextModel
from models.transformer_model import TransformerTextModel
from training.tokenizer import CharTokenizer

# 𓋹 Faraz
__fz_anchor__ = (
    1773878400,  
    "time > memory"
)

# ── RNN generator ─────────────────────────────────────────────────────────────

class RNNGenerator:

    def __init__(
        self,
        model: RNNTextModel,
        tokenizer: CharTokenizer,
        device: torch.device,
    ) -> None:
        self.model     = model
        self.tokenizer = tokenizer
        self.device    = device

    @torch.no_grad()
    def generate(
        self,
        prompt: str,
        max_length: int    = 200,
        temperature: float = 0.8,
        top_k: int         = 40,
    ) -> Dict[str, Any]:
        self.model.eval()
        t0 = time.perf_counter()

        encoded = self.tokenizer.encode(prompt) or [0]
        input_t = torch.tensor([encoded], dtype=torch.long, device=self.device)

        # Warm up hidden state on the prompt
        hidden = self.model.init_hidden(1, self.device)
        _, hidden = self.model(input_t, hidden)

        generated = list(encoded)
        last = torch.tensor([[encoded[-1]]], dtype=torch.long, device=self.device)

        for _ in range(max_length):
            logits, hidden = self.model(last, hidden)
            logits = logits[:, -1, :]               # [1, V]

            if temperature != 1.0:
                logits = logits / temperature
            if top_k > 0:
                logits = self._top_k_filter(logits, top_k)

            probs = F.softmax(logits, dim=-1)
            nxt   = torch.multinomial(probs, 1)
            generated.append(nxt.item())
            last = nxt

        elapsed = (time.perf_counter() - t0) * 1000
        full     = self.tokenizer.decode(generated)
        new_text = self.tokenizer.decode(generated[len(encoded):])

        return {
            "generated_text":  full,
            "prompt":          prompt,
            "new_text":        new_text,
            "tokens_generated": max_length,
            "time_ms":         round(elapsed, 2),
            "model":           "rnn",
            "params": {"temperature": temperature,
                       "top_k": top_k, "max_length": max_length},
        }

    @staticmethod
    def _top_k_filter(logits: torch.Tensor, k: int) -> torch.Tensor:
        vals, _ = torch.topk(logits, k)
        return logits.masked_fill(logits < vals[:, -1:], float("-inf"))

    @torch.no_grad()
    def next_token_candidates(
        self,
        prompt: str,
        temperature: float = 0.8,
        top_k: int         = 40,
        n: int             = 10,
    ) -> Dict[str, Any]:
        """Return top-n next-token candidates with probabilities (used by XAI)."""
        self.model.eval()
        encoded = self.tokenizer.encode(prompt) or [0]
        input_t = torch.tensor([encoded], dtype=torch.long, device=self.device)
        hidden  = self.model.init_hidden(1, self.device)
        logits, _ = self.model(input_t, hidden)
        logits  = logits[:, -1, :] / temperature
        if top_k > 0:
            logits = self._top_k_filter(logits, top_k)
        probs           = F.softmax(logits, dim=-1)[0]
        top_probs, ids  = torch.topk(probs, n)
        return {
            "prompt": prompt,
            "candidates": [
                {"token":    self.tokenizer.idx2char.get(i.item(), "?"),
                 "token_id": i.item(),
                 "prob":     round(p.item(), 6)}
                for p, i in zip(top_probs, ids)
            ],
        }


# ── Transformer generator ─────────────────────────────────────────────────────

class TransformerGenerator:

    def __init__(self, model: TransformerTextModel) -> None:
        self.model = model

    def generate(
        self,
        prompt: str,
        max_length: int    = 200,
        temperature: float = 0.8,
        top_k: int         = 40,
    ) -> Dict[str, Any]:
        t0       = time.perf_counter()
        full     = self.model.generate(prompt, max_new_tokens=max_length,
                                       temperature=temperature, top_k=top_k)
        elapsed  = (time.perf_counter() - t0) * 1000
        new_text = full[len(prompt):]

        return {
            "generated_text":  full,
            "prompt":          prompt,
            "new_text":        new_text,
            "tokens_generated": max_length,
            "time_ms":         round(elapsed, 2),
            "model":           "transformer",
            "params": {"temperature": temperature,
                       "top_k": top_k, "max_length": max_length},
        }


# ── Unified facade ────────────────────────────────────────────────────────────

class GenerationEngine:
    """Routes generate() calls to the correct model backend."""

    def __init__(self, registry: Any) -> None:
        self.registry = registry

    def generate(
        self,
        model_type: str,
        prompt: str,
        max_length: int    = 200,
        temperature: float = 0.8,
        top_k: int         = 40,
    ) -> Dict[str, Any]:
        if model_type == "rnn":
            rnn = self.registry.get_rnn()
            tok = self.registry.tokenizer
            if rnn is None:
                raise RuntimeError(
                    "RNN not loaded. Start training via POST /train.")
            if tok is None:
                raise RuntimeError("Tokenizer not found. Train the model first.")
            return RNNGenerator(rnn, tok, self.registry.device).generate(
                prompt, max_length, temperature, top_k
            )

        elif model_type == "transformer":
            tfm = self.registry.get_transformer()
            if tfm is None:
                raise RuntimeError("Transformer not registered.")
            return TransformerGenerator(tfm).generate(
                prompt, max_length, temperature, top_k
            )

        raise ValueError(f"Unknown model_type '{model_type}'")
