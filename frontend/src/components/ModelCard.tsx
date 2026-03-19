import { Box, CheckCircle, XCircle } from 'lucide-react';
import type { ModelInfo } from '@/api/models';

const ModelCard = ({ model }: { model: ModelInfo }) => {
  const formatParams = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : `${n}`;

  return (
    <div className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/30">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Box className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">{model.name}</h3>
        </div>
        {model.available ? (
          <span className="flex items-center gap-1 text-xs text-success">
            <CheckCircle className="h-3.5 w-3.5" /> Ready
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-destructive">
            <XCircle className="h-3.5 w-3.5" /> Not loaded
          </span>
        )}
      </div>
      <p className="mb-3 text-xs text-muted-foreground">{model.description}</p>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="font-mono">{formatParams(model.params)} params</span>
      </div>
    </div>
  );
};

export default ModelCard;
