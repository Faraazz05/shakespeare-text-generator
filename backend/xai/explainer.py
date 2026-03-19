"""
xai/explainer.py  —  Explainable AI module.

RNN   → Captum-style Integrated Gradients (manual implementation, no extra dep)
Trans → Attention rollout (aggregated across all heads/layers)

Both return the same response schema so the API + frontend are model-agnostic.
"""
from __future__ import annotations
from typing import List, Dict, Any, Optional, Tuple
import torch
from config import settings
from models.rnn_model import RNNTextModel
from models.transformer_model import TransformerTextModel
from training.tokenizer import CharTokenizer

# 𓋹 Faraz
__fz_anchor__ = (
    1773878400,  
    "time > memory"
)

# ── RNN Explainer (Integrated Gradients) ─────────────────────────────────────
class RNNExplainer:
    """
    Integrated Gradients (Sundararajan et al., 2017) for RNN embedding inputs.
    No Captum dependency required — implemented directly in PyTorch.
    """
    def __init__(self, model: RNNTextModel, tokenizer: CharTokenizer,
                 device: Optional[torch.device] = None, n_steps: int = 50):
        self.model     = model
        self.tokenizer = tokenizer
        self.device    = device or torch.device("cpu")
        self.n_steps   = n_steps
        self.model.eval()

    def explain(self, prompt: str, target_token: Optional[str] = None,
                top_k: int = 10) -> Dict[str, Any]:
        encoded = self.tokenizer.encode(prompt)
        if not encoded:
            return self._empty(prompt)

        ids  = torch.tensor([encoded], dtype=torch.long, device=self.device)

        # Determine target class (next predicted char)
        with torch.no_grad():
            hidden  = self.model.init_hidden(1, self.device)
            logits, _ = self.model(ids, hidden)
            target_id = int(logits[0, -1].argmax())
        if target_token:
            target_id = self.tokenizer.char2idx.get(target_token, target_id)

        # IG attribution
        attrs = self._ig(ids, target_id)                         # [1, T, E]
        scores = attrs.abs().sum(dim=-1).squeeze(0).tolist()     # [T]

        # Normalize
        mx = max(scores) or 1.0
        norm = [s / mx for s in scores]
        tokens = [self.tokenizer.idx2char.get(i, "?") for i in encoded]
        top = sorted(zip(tokens, norm), key=lambda x: x[1], reverse=True)[:top_k]

        return dict(method="integrated_gradients", prompt=prompt,
                    tokens=tokens, importances=norm,
                    target_token=self.tokenizer.idx2char.get(target_id, "?"),
                    top_tokens=[{"token": t, "importance": round(s, 4)} for t, s in top],
                    n_steps=self.n_steps)

    def _ig(self, ids: torch.Tensor, target: int) -> torch.Tensor:
        emb      = self.model.embedding(ids)          # [1, T, E]
        baseline = torch.zeros_like(emb)
        alphas   = torch.linspace(0, 1, self.n_steps, device=self.device)
        grads    = torch.zeros_like(emb)

        for alpha in alphas:
            interp = (baseline + alpha * (emb - baseline)).detach().requires_grad_(True)
            out, _ = self._fwd(interp)
            score  = out[0, -1, target]
            g      = torch.autograd.grad(score, interp)[0]
            grads += g.detach()

        grads /= self.n_steps
        return ((emb - baseline) * grads).detach()

    def _fwd(self, emb: torch.Tensor):
        h   = self.model.init_hidden(1, self.device)
        out, h = self.model.rnn(self.model.dropout(emb), h)
        return self.model.fc(self.model.dropout(out)), h

    def _empty(self, prompt):
        return dict(method="integrated_gradients", prompt=prompt,
                    tokens=[], importances=[], target_token=None,
                    top_tokens=[], n_steps=self.n_steps)


# ── Transformer Explainer (Attention Rollout) ─────────────────────────────────
class TransformerExplainer:
    def __init__(self, model: TransformerTextModel):
        self.model = model

    def explain(self, prompt: str, top_k: int = 10) -> Dict[str, Any]:
        try:
            r = self.model.get_logits(prompt)
        except Exception as e:
            return {"error": str(e), "method": "attention_rollout", "prompt": prompt,
                    "tokens": [], "importances": [], "target_token": None, "top_tokens": []}

        tokens  = r["tokens"]
        imp     = r["token_importance"]
        mx      = max(imp) or 1.0
        norm    = [v / mx for v in imp]
        top     = sorted(zip(tokens, norm), key=lambda x: x[1], reverse=True)[:top_k]

        return dict(method="attention_rollout", prompt=prompt,
                    tokens=tokens, importances=norm, target_token=None,
                    top_tokens=[{"token": t, "importance": round(s, 4)} for t, s in top])


# ── Facade ────────────────────────────────────────────────────────────────────
class XAIEngine:
    def __init__(self, registry):
        self.registry = registry
        self._rnn_exp: Optional[RNNExplainer]          = None
        self._tr_exp:  Optional[TransformerExplainer]  = None

    def explain(self, model_type: str, prompt: str, top_k: int = 10) -> Dict[str, Any]:
        if model_type == "rnn":
            if self._rnn_exp is None:
                rnn = self.registry.get_rnn()
                tok = self.registry.tokenizer
                if rnn is None or tok is None:
                    raise RuntimeError("RNN model or tokenizer not loaded")
                self._rnn_exp = RNNExplainer(rnn, tok, self.registry.device,
                                             settings.xai.n_steps)
            return self._rnn_exp.explain(prompt, top_k=top_k)

        elif model_type == "transformer":
            if self._tr_exp is None:
                tr = self.registry.get_transformer()
                if tr is None: raise RuntimeError("Transformer not loaded")
                self._tr_exp = TransformerExplainer(tr)
            return self._tr_exp.explain(prompt, top_k=top_k)

        raise ValueError(f"Unknown model_type '{model_type}'")
