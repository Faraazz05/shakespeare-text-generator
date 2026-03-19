// src/pages/GeneratePage.tsx
import { useEffect } from 'react';
import { Wand2, Play, Loader2 } from 'lucide-react';
import ModelSelector from '@/components/ModelSelector';
import GenerationControls from '@/components/GenerationControls';
import OutputDisplay from '@/components/OutputDisplay';
import GenerationHistory from '@/components/GenerationHistory';
import { useGenerateStore } from '@/stores/useGenerateStore';
import { useModelStore } from '@/stores/useModelStore';

const GeneratePage = () => {
  const { prompt, setPrompt, loading, result, error, generate } = useGenerateStore();
  // ✅ Fixed: selectedModel + fetchModels come from useModelStore
  const { selectedModel, models, fetchModels } = useModelStore();

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const modelInfo = models.find((m) => m.id === selectedModel);
  const canGenerate =
    prompt.trim().length > 0 &&
    !loading &&
    (modelInfo ? modelInfo.available : true);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-20 pb-12">
      {/* Hero gradient */}
      <div className="mb-8 rounded-xl bg-gradient-to-br from-primary/20 via-accent/10 to-transparent p-6">
        <div className="flex items-center gap-2 mb-1">
          <Wand2 className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Text Generation</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Generate text using RNN or Transformer models
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left — controls */}
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Model
            </label>
            <ModelSelector />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">
                Seed Prompt
              </label>
              <span className="text-xs text-muted-foreground font-mono">
                {prompt.length}/500
              </span>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
              placeholder="To be or not to be..."
              rows={4}
              className="w-full resize-y rounded-lg border border-border bg-secondary p-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              style={{ minHeight: '5rem', maxHeight: '14rem' }}
            />
          </div>

          <GenerationControls />

          <button
            disabled={!canGenerate}
            // ✅ Fixed: passes selectedModel so generate() uses the right model
            onClick={() => generate(selectedModel)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Generate Text
              </>
            )}
          </button>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <GenerationHistory />
        </div>

        {/* Right — output */}
        <OutputDisplay result={result} />
      </div>
    </div>
  );
};

export default GeneratePage;
