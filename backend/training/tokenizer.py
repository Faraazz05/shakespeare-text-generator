"""
training/tokenizer.py — Character-level tokenizer.

Builds a vocabulary from raw text, maps characters ↔ integers,
and provides encode / decode utilities used at training and inference time.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List


class CharTokenizer:
    """
    Character-level tokenizer.

    Two special tokens are always prepended to the vocab:
        0 → <PAD>
        1 → <UNK>
    """

    PAD = "<PAD>"
    UNK = "<UNK>"

    def __init__(self) -> None:
        self.char2idx: Dict[str, int] = {}
        self.idx2char: Dict[int, str] = {}
        self.vocab_size: int = 0

    # ── Build ────────────────────────────────────────────────────────────────

    def fit(self, text: str) -> "CharTokenizer":
        """Derive vocabulary from a raw text corpus."""
        specials = [self.PAD, self.UNK]
        chars    = sorted(set(text))
        vocab    = specials + chars

        self.char2idx  = {ch: i for i, ch in enumerate(vocab)}
        self.idx2char  = {i: ch for ch, i in self.char2idx.items()}
        self.vocab_size = len(vocab)
        return self

    # ── Encode / Decode ──────────────────────────────────────────────────────

    def encode(self, text: str) -> List[int]:
        unk = self.char2idx[self.UNK]
        return [self.char2idx.get(ch, unk) for ch in text]

    def decode(self, ids: List[int]) -> str:
        pad = self.char2idx.get(self.PAD, 0)
        return "".join(
            self.idx2char.get(i, self.UNK)
            for i in ids
            if i != pad
        )

    # ── Persistence ──────────────────────────────────────────────────────────

    def save(self, path: Path) -> None:
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        state = {
            "char2idx": self.char2idx,
            # JSON requires string keys
            "idx2char": {str(k): v for k, v in self.idx2char.items()},
            "vocab_size": self.vocab_size,
        }
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(state, fh, ensure_ascii=False, indent=2)

    @classmethod
    def load(cls, path: Path) -> "CharTokenizer":
        path = Path(path)
        with open(path, "r", encoding="utf-8") as fh:
            state = json.load(fh)
        tok = cls()
        tok.char2idx   = state["char2idx"]
        tok.idx2char   = {int(k): v for k, v in state["idx2char"].items()}
        tok.vocab_size = state["vocab_size"]
        return tok

    def __repr__(self) -> str:
        return f"CharTokenizer(vocab_size={self.vocab_size})"
