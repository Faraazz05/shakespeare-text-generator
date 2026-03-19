import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  tokens: string[];
  importances: number[];
}

const TokenHeatmap = ({ tokens, importances }: Props) => {
  const max = Math.max(...importances, 1e-9);

  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-4">
      {tokens.map((token, i) => {
        const norm = importances[i] / max;
        const alpha = Math.round(norm * 0.8 * 100);
        return (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <span
                className="cursor-default rounded px-1 py-0.5 font-mono text-sm text-foreground transition-colors"
                style={{ backgroundColor: `hsl(var(--accent) / ${alpha}%)` }}
              >
                {token}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <span className="font-mono text-xs">
                "{token}" → {importances[i].toFixed(4)}
              </span>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
};

export default TokenHeatmap;
