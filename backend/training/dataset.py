"""
training/dataset.py — Dataset pipeline.

Downloads TinyShakespeare (or reads from cache), builds the tokenizer,
and returns PyTorch DataLoader pairs ready for training.
"""
from __future__ import annotations

import urllib.request
from pathlib import Path
from typing import Tuple

import torch
from torch.utils.data import Dataset, DataLoader, random_split

from training.tokenizer import CharTokenizer

_SHAKESPEARE_URL = (
    "https://raw.githubusercontent.com/karpathy/char-rnn/"
    "master/data/tinyshakespeare/input.txt"
)


# ── Download helper ──────────────────────────────────────────────────────────

def _fetch_shakespeare(data_dir: str) -> str:
    dest = Path(data_dir) / "tinyshakespeare.txt"
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists():
        print(f"[Dataset] Downloading TinyShakespeare → {dest}")
        urllib.request.urlretrieve(_SHAKESPEARE_URL, dest)
        print(f"[Dataset] Done ({dest.stat().st_size // 1024} KB)")
    else:
        print(f"[Dataset] Loaded from cache: {dest}")
    return dest.read_text(encoding="utf-8")


# ── PyTorch Dataset ──────────────────────────────────────────────────────────

class CharSequenceDataset(Dataset):
    """
    Sliding-window character sequence dataset.

    Each item is a (input_ids, target_ids) pair where
    target_ids is input_ids shifted one position forward.
    """

    def __init__(self, encoded: list, seq_len: int) -> None:
        self.data    = torch.tensor(encoded, dtype=torch.long)
        self.seq_len = seq_len

    def __len__(self) -> int:
        return max(0, len(self.data) - self.seq_len - 1)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        x = self.data[idx            : idx + self.seq_len    ]
        y = self.data[idx + 1        : idx + self.seq_len + 1]
        return x, y


# ── Public factory ───────────────────────────────────────────────────────────

def build_datasets(
    data_dir: str   = "./data",
    seq_len: int    = 100,
    val_split: float = 0.1,
    batch_size: int = 64,
    tokenizer_save_path: str = "./checkpoints/tokenizer.json",
) -> Tuple[DataLoader, DataLoader, CharTokenizer]:
    """
    End-to-end factory:
        download → tokenize → split → DataLoaders

    Returns
    -------
    train_loader, val_loader, tokenizer
    """
    text = _fetch_shakespeare(data_dir)
    print(f"[Dataset] Corpus: {len(text):,} chars")

    tokenizer = CharTokenizer().fit(text)
    print(f"[Dataset] Vocab size: {tokenizer.vocab_size}")
    tokenizer.save(Path(tokenizer_save_path))

    encoded = tokenizer.encode(text)
    dataset = CharSequenceDataset(encoded, seq_len)
    print(f"[Dataset] Sequences: {len(dataset):,}")

    val_size   = int(len(dataset) * val_split)
    train_size = len(dataset) - val_size
    train_ds, val_ds = random_split(
        dataset, [train_size, val_size],
        generator=torch.Generator().manual_seed(42),
    )
    print(f"[Dataset] Train {train_size:,} | Val {val_size:,}")

    pin = torch.cuda.is_available()
    train_loader = DataLoader(train_ds, batch_size=batch_size,
                              shuffle=True,  num_workers=0, pin_memory=pin)
    val_loader   = DataLoader(val_ds,   batch_size=batch_size,
                              shuffle=False, num_workers=0, pin_memory=pin)
    return train_loader, val_loader, tokenizer
