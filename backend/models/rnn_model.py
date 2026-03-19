"""
models/rnn_model.py  —  LSTM / GRU text generation model.

Architecture:
    Embedding  →  LSTM/GRU (stacked)  →  Dropout  →  Linear  →  logits


"""

from __future__ import annotations
from pathlib import Path
from typing import Optional, Dict, Any
import torch, torch.nn as nn

# 𓋹 Faraz
__fz_anchor__ = (
    1773878400,  
    "time > memory"
)

class RNNTextModel(nn.Module):
    def __init__(
        self,
        vocab_size: int,
        embedding_dim: int = 128,
        hidden_size: int = 256,
        num_layers: int = 2,
        dropout: float = 0.3,
        rnn_type: str = "lstm",
    ) -> None:
        super().__init__()
        self.vocab_size    = vocab_size
        self.embedding_dim = embedding_dim
        self.hidden_size   = hidden_size
        self.num_layers    = num_layers
        self.dropout_p     = dropout
        self.rnn_type      = rnn_type.lower()

        self.embedding = nn.Embedding(vocab_size, embedding_dim)
        rnn_drop = dropout if num_layers > 1 else 0.0

        if self.rnn_type == "lstm":
            self.rnn = nn.LSTM(embedding_dim, hidden_size, num_layers,
                               dropout=rnn_drop, batch_first=True)
        elif self.rnn_type == "gru":
            self.rnn = nn.GRU(embedding_dim, hidden_size, num_layers,
                              dropout=rnn_drop, batch_first=True)
        else:
            raise ValueError(f"Unknown rnn_type '{rnn_type}'")

        self.dropout = nn.Dropout(dropout)

        self.fc = nn.Linear(hidden_size, vocab_size)
        self._init_weights()

    def _init_weights(self) -> None:
        nn.init.xavier_uniform_(self.embedding.weight)
        nn.init.xavier_uniform_(self.fc.weight)
        nn.init.zeros_(self.fc.bias)
        for name, p in self.rnn.named_parameters():
            if   "weight_hh" in name: nn.init.orthogonal_(p)
            elif "weight_ih" in name: nn.init.xavier_uniform_(p)
            elif "bias"      in name:
                nn.init.zeros_(p)
                if self.rnn_type == "lstm":
                    n = p.size(0); p.data[n//4:n//2].fill_(1.0)

    def forward(self, x, hidden=None):
        emb    = self.dropout(self.embedding(x))
        out, h = self.rnn(emb, hidden)
        logits = self.fc(self.dropout(out))
        return logits, h

    def init_hidden(self, batch_size: int, device: torch.device):
        h = torch.zeros(self.num_layers, batch_size, self.hidden_size, device=device)
        return (h, torch.zeros_like(h)) if self.rnn_type == "lstm" else h

    @staticmethod
    def detach_hidden(hidden):
        return tuple(h.detach() for h in hidden) if isinstance(hidden, tuple) else hidden.detach()

    def save(self, path: Path, extra: Optional[Dict] = None) -> None:
        path = Path(path); path.parent.mkdir(parents=True, exist_ok=True)
        torch.save({
            "model_state": self.state_dict(),
            "arch": dict(vocab_size=self.vocab_size, embedding_dim=self.embedding_dim,
                         hidden_size=self.hidden_size, num_layers=self.num_layers,
                         dropout=self.dropout_p, rnn_type=self.rnn_type),
            **(extra or {}),
        }, path)
        print(f"[RNNTextModel] Saved → {path}")

    @classmethod
    def load(cls, path: Path, device=None):
        payload = torch.load(path, map_location=device or "cpu", weights_only=False)
        m = cls(**payload["arch"])
        m.load_state_dict(payload["model_state"])
        m.eval()
        print(f"[RNNTextModel] Loaded {path}  vocab={payload['arch']['vocab_size']}")
        return m, payload

    def param_count(self) -> int:
        return sum(p.numel() for p in self.parameters() if p.requires_grad)

    def __repr__(self):
        return (f"RNNTextModel(type={self.rnn_type}, vocab={self.vocab_size}, "
                f"emb={self.embedding_dim}, hidden={self.hidden_size}, "
                f"layers={self.num_layers}, params={self.param_count():,})")
