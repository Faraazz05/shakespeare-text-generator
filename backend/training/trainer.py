"""
training/trainer.py  —  Full training pipeline for the RNN model.
"""
from __future__ import annotations
import math
from pathlib import Path
from typing import Dict, Any, Optional, Callable
import torch
import torch.nn as nn
# ✅ Fixed: removed ProjectConfig import — not exported by config.py
from config import settings
from models.rnn_model import RNNTextModel
from training.dataset import build_datasets


def _safe_float(v) -> float:
    """Convert inf/nan to 0.0 so JSON serialization never crashes."""
    try:
        f = float(v)
        if math.isnan(f) or math.isinf(f):
            return 0.0
        return round(f, 6)
    except Exception:
        return 0.0


class TrainingProgress:
    def __init__(self):
        self.is_running    = False
        self.finished      = False
        self.current_epoch = 0
        self.total_epochs  = 0
        self.train_losses: list  = []
        self.val_losses:   list  = []
        self.best_val_loss = float("inf")
        self.last_log      = ""
        self.error: Optional[str] = None

progress = TrainingProgress()


class Trainer:
    # ✅ Fixed: cfg type is just 'object' — no ProjectConfig import needed
    def __init__(self, cfg=None, on_epoch_end: Optional[Callable] = None):
        self.cfg = cfg or settings
        self.on_epoch_end = on_epoch_end
        self.device = torch.device(
            "cuda" if torch.cuda.is_available() and self.cfg.model.device != "cpu" else "cpu"
        )

    def train(self) -> RNNTextModel:
        global progress
        progress.is_running = True
        progress.finished   = False
        progress.error      = None
        progress.train_losses = []
        progress.val_losses   = []

        cfg = self.cfg
        t   = cfg.training
        m   = cfg.model.rnn
        progress.last_log = "Building dataset…"

        train_loader, val_loader, tokenizer = build_datasets(
            data_dir=t.data_dir,
            seq_len=t.sequence_length,
            val_split=t.val_split,
            batch_size=t.batch_size,
            tokenizer_save_path=str(Path(cfg.model.checkpoint_dir) / "tokenizer.json"),
        )

        vocab_size = tokenizer.vocab_size
        model = RNNTextModel(
            vocab_size=vocab_size,
            embedding_dim=m.embedding_dim,
            hidden_size=m.hidden_size,
            num_layers=m.num_layers,
            dropout=m.dropout,
            rnn_type=m.type,
        ).to(self.device)
        print(f"[Trainer] {model}")

        optimizer = torch.optim.Adam(model.parameters(), lr=t.learning_rate)
        scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
            optimizer, mode="min", patience=3, factor=0.5)
        criterion = nn.CrossEntropyLoss()
        ckpt_dir  = Path(cfg.model.checkpoint_dir)
        ckpt_dir.mkdir(parents=True, exist_ok=True)

        best_val = float("inf")
        progress.total_epochs = t.epochs

        for epoch in range(1, t.epochs + 1):
            progress.current_epoch = epoch

            train_loss = self._train_epoch(
                model, train_loader, optimizer, criterion, t.grad_clip, t.log_every)
            val_loss = self._val_epoch(model, val_loader, criterion)
            scheduler.step(val_loss)

            # ✅ Only store finite loss values
            if math.isfinite(train_loss):
                progress.train_losses.append(round(train_loss, 6))
            if math.isfinite(val_loss):
                progress.val_losses.append(round(val_loss, 6))

            ppl = math.exp(min(val_loss, 20)) if math.isfinite(val_loss) else 0.0
            msg = (f"[{epoch:>3}/{t.epochs}]  train={train_loss:.4f}  "
                   f"val={val_loss:.4f}  ppl={ppl:.1f}  "
                   f"lr={optimizer.param_groups[0]['lr']:.1e}")
            print(msg)
            progress.last_log = msg

            extra = {"epoch": epoch, "val_loss": val_loss, "vocab_size": vocab_size}

            if val_loss < best_val:
                best_val = val_loss
                # ✅ Store safe float — never inf
                progress.best_val_loss = _safe_float(best_val)
                model.save(ckpt_dir / "rnn_best.pt", extra=extra)

            if epoch % t.save_every == 0:
                model.save(ckpt_dir / f"rnn_epoch_{epoch:03d}.pt", extra=extra)

            if self.on_epoch_end:
                self.on_epoch_end(epoch, train_loss, val_loss)

        best_model, _ = RNNTextModel.load(ckpt_dir / "rnn_best.pt", device=self.device)
        progress.is_running = False
        progress.finished   = True
        print(f"[Trainer] Done. Best val loss: {best_val:.4f}")
        return best_model

    def _train_epoch(self, model, loader, optimizer, criterion, grad_clip, log_every):
        model.train()
        total  = 0.0
        hidden = None
        for step, (x, y) in enumerate(loader):
            x, y = x.to(self.device), y.to(self.device)
            if hidden is not None:
                hidden = RNNTextModel.detach_hidden(hidden)
            optimizer.zero_grad()
            logits, hidden = model(x, hidden)
            loss = criterion(logits.view(-1, model.vocab_size), y.view(-1))
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), grad_clip)
            optimizer.step()
            total += loss.item()
            if (step + 1) % log_every == 0:
                print(f"  step {step+1:>5} | loss {total/(step+1):.4f}")
        return total / len(loader)

    @torch.no_grad()
    def _val_epoch(self, model, loader, criterion):
        model.eval()
        total = 0.0
        for x, y in loader:
            x, y = x.to(self.device), y.to(self.device)
            logits, _ = model(x)
            total += criterion(logits.view(-1, model.vocab_size), y.view(-1)).item()
        return total / len(loader)

    @staticmethod
    def get_progress() -> Dict[str, Any]:
        p = progress
        return dict(
            is_running=p.is_running,
            finished=p.finished,
            current_epoch=p.current_epoch,
            total_epochs=p.total_epochs,
            train_losses=p.train_losses,
            val_losses=p.val_losses,
            best_val_loss=_safe_float(p.best_val_loss),
            last_log=p.last_log,
            error=p.error,
        )
