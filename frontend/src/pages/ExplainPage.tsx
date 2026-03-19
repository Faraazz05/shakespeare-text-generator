// src/pages/ExplainPage.tsx
import { useEffect } from 'react';
import { Eye, Loader2, Search } from 'lucide-react';
import ModelSelector from '@/components/ModelSelector';
import TokenHeatmap from '@/components/TokenHeatmap';
import ImportanceChart from '@/components/ImportanceChart';
import { useExplainStore } from '@/stores/useExplainStore';
import { useModelStore } from '@/stores/useModelStore';

const ExplainPage = () => {
  const { prompt, setPrompt, topK, setTopK, loading, result, error, explain } =
    useExplainStore();
  // ✅ Fixed: selectedModel comes from useModelStore
  const { selectedModel, fetchModels } = useModelStore();

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return (
    <div className="mx-auto max-w-3xl px-4 pt-20 pb-12">
      <div className="mb-8 flex items-center gap-2">
        <Eye className="h-5 w-5 text-accent" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Token Explanation</h1>
          <p className="text-sm text-muted-foreground">
            Understand which tokens influence the model's predictions
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-xs font-medium text-muted-foreground">
            Model
          </label>
          <ModelSelector />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter text to analyse…"
            rows={3}
            className="w-full resize-y rounded-lg border border-border bg-secondary p-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
          />
        </div>

        <div className="flex items-end gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Top-K Tokens
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="w-20 rounded-md border border-border bg-secondary px-3 py-2 text-sm font-mono text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <button
            disabled={!prompt.trim() || loading}
            // ✅ Fixed: passes selectedModel so explain() uses the right model
            onClick={() => explain(selectedModel)}
            className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Analyse
          </button>
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        {result && (
          <div className="space-y-6 pt-4">
            {/* Method + target badge row */}
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-medium text-accent">
                {result.method}
              </span>
              {result.target_token && (
                <span className="text-xs text-muted-foreground">
                  Target prediction:{' '}
                  <span className="font-mono text-foreground">
                    "{result.target_token}"
                  </span>
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {result.tokens.length} tokens analysed
              </span>
            </div>

            <div>
              <h2 className="mb-2 text-sm font-semibold text-foreground">
                Token Heatmap
              </h2>
              <TokenHeatmap
                tokens={result.tokens}
                importances={result.importances}
              />
            </div>

            <div>
              <h2 className="mb-2 text-sm font-semibold text-foreground">
                Top Token Importance
              </h2>
              <ImportanceChart topTokens={result.top_tokens} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplainPage;
