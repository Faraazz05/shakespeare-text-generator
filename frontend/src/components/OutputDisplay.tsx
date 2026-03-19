import { Copy, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { GenerateResponse } from '@/api/generate';
import { useExplainStore } from '@/stores/useExplainStore';
import { toast } from 'sonner';

const OutputDisplay = ({ result }: { result: GenerateResponse | null }) => {
  const navigate = useNavigate();
  const setExplainPrompt = useExplainStore((s) => s.setPrompt);

  if (!result) {
    return (
      <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-border p-8">
        <Sparkles className="mb-3 h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Your generated text will appear here</p>
      </div>
    );
  }

  const modelColor = result.model === 'rnn' ? 'bg-primary' : 'bg-accent';

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className={`rounded-full px-2.5 py-0.5 font-medium text-foreground ${modelColor}`}>
          {result.model.toUpperCase()}
        </span>
        <span className="text-muted-foreground">{result.time_ms}ms</span>
        <span className="text-muted-foreground">{result.tokens_generated} tokens</span>
      </div>

      <div className="rounded-md bg-background p-4 font-mono text-sm leading-relaxed">
        <span className="text-muted-foreground">{result.prompt}</span>
        <span className="text-foreground">{result.new_text}</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            navigator.clipboard.writeText(result.generated_text);
            toast.success('Copied to clipboard');
          }}
          className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs text-secondary-foreground hover:border-primary/50 transition-colors"
        >
          <Copy className="h-3.5 w-3.5" /> Copy
        </button>
        <button
          onClick={() => {
            setExplainPrompt(result.prompt);
            navigate('/explain');
          }}
          className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/80"
        >
          Explain This <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default OutputDisplay;
