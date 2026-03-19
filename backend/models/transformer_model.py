"""
models/transformer_model.py  —  HuggingFace CausalLM wrapper (lazy-loaded).
"""
from __future__ import annotations
from pathlib import Path
from typing import Optional, Dict, Any
import torch

# 𓋹 Faraz
__fz_anchor__ = (
    1773878400,  
    "time > memory"
)

class TransformerTextModel:
    def __init__(self, model_name="distilgpt2", cache_dir="./checkpoints/hf_cache", device="auto"):
        self.model_name  = model_name
        self.cache_dir   = str(cache_dir)
        self._device     = self._resolve(device)
        self._model      = None
        self._tokenizer  = None
        self._loaded     = False

    @staticmethod
    def _resolve(device: str) -> torch.device:
        if device == "auto":
            return torch.device("cuda" if torch.cuda.is_available() else "cpu")
        return torch.device(device)

    def _ensure_loaded(self):
        if self._loaded: return
        from transformers import AutoTokenizer, AutoModelForCausalLM
        print(f"[Transformer] Loading '{self.model_name}' …")
        Path(self.cache_dir).mkdir(parents=True, exist_ok=True)
        self._tokenizer = AutoTokenizer.from_pretrained(self.model_name, cache_dir=self.cache_dir)
        if self._tokenizer.pad_token is None:
            self._tokenizer.pad_token = self._tokenizer.eos_token
        self._model = AutoModelForCausalLM.from_pretrained(
            self.model_name, cache_dir=self.cache_dir).to(self._device)
        self._model.eval()
        self._loaded = True
        n = sum(p.numel() for p in self._model.parameters())
        print(f"[Transformer] Ready  device={self._device}  params={n:,}")

    @torch.no_grad()
    def generate(self, prompt: str, max_new_tokens=100, temperature=0.8,
                 top_k=40, top_p=0.95, do_sample=True) -> str:
        self._ensure_loaded()
        inputs = self._tokenizer(prompt, return_tensors="pt", padding=True).to(self._device)
        prompt_len = inputs["input_ids"].shape[1]
        ids = self._model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            temperature=temperature if do_sample else 1.0,
            top_k=top_k if do_sample else 0,
            top_p=top_p if do_sample else 1.0,
            do_sample=do_sample,
            pad_token_id=self._tokenizer.eos_token_id,
            repetition_penalty=1.1,
        )
        new_ids = ids[0][prompt_len:]
        return prompt + self._tokenizer.decode(new_ids, skip_special_tokens=True)

    def get_logits(self, text: str) -> Dict[str, Any]:
        """Return logits + per-token attention importance for XAI."""
        self._ensure_loaded()
        inputs = self._tokenizer(text, return_tensors="pt").to(self._device)
        with torch.no_grad():
            out = self._model(**inputs, output_attentions=True)
        tokens = self._tokenizer.convert_ids_to_tokens(inputs["input_ids"][0].tolist())
        attentions = torch.stack(out.attentions)        # [L, B, H, S, S]
        avg_attn   = attentions[:, 0].mean(dim=[0, 1]) # [S, S]
        importance = avg_attn.sum(dim=0).cpu().tolist()
        return {"tokens": tokens, "logits": out.logits[0].cpu().tolist(),
                "token_importance": importance}

    def model_info(self) -> Dict[str, Any]:
        info = {"model_name": self.model_name, "loaded": self._loaded, "device": str(self._device)}
        if self._loaded:
            info["param_count"] = sum(p.numel() for p in self._model.parameters())
        return info

    @property
    def is_loaded(self): return self._loaded
    def __repr__(self): return f"TransformerTextModel(model='{self.model_name}', loaded={self._loaded})"
