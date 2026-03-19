// src/pages/LandingPage.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain, ChevronDown, Github, Zap, Eye, FlaskConical,
  Layers, ArrowRight, Cpu, Network,
} from "lucide-react";

function useCounter(target: number, duration = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

function Particles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 28 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-20"
          style={{
            width:  `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            background: i % 3 === 0 ? "#3b82f6" : i % 3 === 1 ? "#a855f7" : "#10b981",
            left:  `${Math.random() * 100}%`,
            top:   `${Math.random() * 100}%`,
            animation: `float ${6 + Math.random() * 8}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 6}s`,
          }}
        />
      ))}
    </div>
  );
}

function Stat({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
  const v = useCounter(value);
  return (
    <div className="text-center">
      <p className="text-3xl font-black tracking-tight text-white font-mono">
        {v.toLocaleString()}{suffix}
      </p>
      <p className="mt-1 text-xs text-slate-500 uppercase tracking-widest">{label}</p>
    </div>
  );
}

function Feature({ icon: Icon, label, color }: { icon: any; label: string; color: string }) {
  return (
    <div className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium ${color}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const demoRef  = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const scrollToDemo = () =>
    demoRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen bg-[#080b12] text-white overflow-x-hidden">
      <style>{`
        @keyframes float {
          0%,100% { transform:translateY(0) }
          50%      { transform:translateY(-18px) }
        }
        @keyframes slide-up {
          from { opacity:0; transform:translateY(32px) }
          to   { opacity:1; transform:translateY(0) }
        }
        .anim { opacity:0 }
        .anim.go { animation: slide-up 0.7s ease forwards }
        .d1 { animation-delay:0.05s }
        .d2 { animation-delay:0.15s }
        .d3 { animation-delay:0.25s }
        .d4 { animation-delay:0.35s }
        .d5 { animation-delay:0.45s }
      `}</style>

      {/* ── HERO ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <Particles />

        {/* glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[120px]" />
          <div className="absolute h-[400px] w-[400px] rounded-full bg-purple-600/8 blur-[100px]" />
        </div>

        {/* badge */}
        <div className={`anim ${visible ? "go d1" : ""} mb-8 flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/80 px-4 py-1.5 text-xs text-slate-400 backdrop-blur`}>
          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          v1.0.0 · PyTorch 2.3 · FastAPI · React
        </div>

        {/* title */}
        <h1 className={`anim ${visible ? "go d2" : ""} max-w-4xl text-5xl font-black leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl`}>
          <span className="text-white">Explainable</span>
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
            Shakespeare Text Generator
          </span>
        </h1>

        {/* subtitle */}
        <p className={`anim ${visible ? "go d3" : ""} mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg`}>
          A full-stack AI system combining{" "}
          <span className="text-blue-400 font-semibold">RNN (LSTM/GRU)</span> and{" "}
          <span className="text-purple-400 font-semibold">Transformer</span> models
          — with{" "}
          <span className="text-emerald-400 font-semibold">Integrated Gradients XAI</span>{" "}
          to explain every token prediction.
        </p>

        {/* pills */}
        <div className={`anim ${visible ? "go d3" : ""} mt-8 flex flex-wrap justify-center gap-2`}>
          <Feature icon={Brain}        label="LSTM / GRU"           color="border-blue-500/40 text-blue-400 bg-blue-500/10" />
          <Feature icon={Network}      label="DistilGPT-2"          color="border-purple-500/40 text-purple-400 bg-purple-500/10" />
          <Feature icon={Eye}          label="Integrated Gradients" color="border-emerald-500/40 text-emerald-400 bg-emerald-500/10" />
          <Feature icon={Cpu}          label="FastAPI"              color="border-amber-500/40 text-amber-400 bg-amber-500/10" />
          <Feature icon={Layers}       label="Docker"               color="border-sky-500/40 text-sky-400 bg-sky-500/10" />
          <Feature icon={FlaskConical} label="TinyShakespeare"      color="border-rose-500/40 text-rose-400 bg-rose-500/10" />
        </div>

        {/* CTAs */}
        <div className={`anim ${visible ? "go d4" : ""} mt-10 flex flex-col items-center gap-3 sm:flex-row`}>
          <button
            onClick={scrollToDemo}
            className="group flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500 hover:scale-105 active:scale-100"
          >
            <Zap className="h-4 w-4" />
            Scroll for Demo
            <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
          </button>
          <a
            href="https://github.com/Faraazz05/shakespeare-text-generator"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-7 py-3 text-sm font-semibold text-slate-300 backdrop-blur transition-all hover:border-slate-500 hover:text-white hover:scale-105 active:scale-100"
          >
            <Github className="h-4 w-4" />
            View on GitHub
          </a>
        </div>

        {/* stats */}
        <div className={`anim ${visible ? "go d5" : ""} mt-16 flex items-center gap-10 rounded-2xl border border-slate-800/80 bg-slate-900/50 px-10 py-5 backdrop-blur`}>
          <Stat value={930}  suffix="K" label="RNN Params" />
          <div className="h-8 w-px bg-slate-800" />
          <Stat value={67}             label="Vocab Size" />
          <div className="h-8 w-px bg-slate-800" />
          <Stat value={1115} suffix="K" label="Train Chars" />
          <div className="h-8 w-px bg-slate-800" />
          <Stat value={20}             label="Epochs" />
        </div>

        {/* scroll hint */}
        <button onClick={scrollToDemo} className="absolute bottom-8 flex flex-col items-center gap-1 text-slate-600 hover:text-slate-400 transition-colors">
          <span className="text-[10px] uppercase tracking-widest">Scroll</span>
          <ChevronDown className="h-4 w-4 animate-bounce" />
        </button>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section ref={demoRef} className="relative px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <p className="mb-2 text-xs uppercase tracking-widest text-blue-400">Architecture</p>
            <h2 className="text-3xl font-black text-white">How it works</h2>
          </div>

          {/* pipeline */}
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:flex-wrap">
            {[
              { label: "Prompt Input",      c: "border-slate-600 bg-slate-800/60 text-slate-300" },
              { label: "FastAPI Router",    c: "border-blue-500/50 bg-blue-900/30 text-blue-300" },
              { label: "RNN / Transformer", c: "border-purple-500/50 bg-purple-900/30 text-purple-300" },
              { label: "XAI — Int. Grads",  c: "border-emerald-500/50 bg-emerald-900/30 text-emerald-300" },
              { label: "Token Heatmap",     c: "border-amber-500/50 bg-amber-900/30 text-amber-300" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`rounded-xl border px-5 py-3 text-sm font-semibold ${s.c}`}>
                  {s.label}
                </div>
                {i < 4 && <ArrowRight className="hidden h-4 w-4 shrink-0 text-slate-600 sm:block" />}
              </div>
            ))}
          </div>

          {/* cards */}
          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Brain,   title: "RNN Generator",   desc: "Character-level LSTM trained from scratch on TinyShakespeare. Learns sequential text patterns purely from data.", color: "border-blue-500/30 bg-blue-950/30", ic: "text-blue-400" },
              { icon: Network, title: "Transformer",      desc: "DistilGPT2 via HuggingFace for comparison against the RNN. Pre-trained on internet text, serves as a modern benchmark.", color: "border-purple-500/30 bg-purple-950/30", ic: "text-purple-400" },
              { icon: Eye,     title: "Integrated Grads", desc: "XAI layer that attributes each input token's contribution to the output. Visualised as a colour heatmap over the prompt.", color: "border-emerald-500/30 bg-emerald-950/30", ic: "text-emerald-400" },
            ].map((c, i) => (
              <div key={i} className={`rounded-2xl border p-6 transition-transform hover:-translate-y-1 ${c.color}`}>
                <c.icon className={`mb-4 h-6 w-6 ${c.ic}`} />
                <h3 className="mb-2 text-sm font-bold text-white">{c.title}</h3>
                <p className="text-xs leading-relaxed text-slate-400">{c.desc}</p>
              </div>
            ))}
          </div>

          {/* launch */}
          <div className="mt-16 text-center">
            <button
              onClick={() => navigate("/generate")}
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition-all hover:shadow-blue-600/40 hover:scale-105 active:scale-100"
            >
              Launch the App
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>cd 
            <p className="mt-3 text-xs text-slate-600">Backend must be running on localhost:8000</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-800/60 px-6 py-8 text-center">
        <p className="text-xs text-slate-600">
          Built by{" "}
          <a href="https://faraazz05.github.io/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">Mohd Faraz</a>
          {" "}·{" "}Apache 2.0 License{" "}·{" "}
          <a href="https://github.com/Faraazz05/shakespeare-text-generator" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">GitHub</a>
        </p>
      </footer>
    </div>
  );
}
