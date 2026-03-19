import { Clock, RotateCcw, Trash2 } from 'lucide-react';
import { useGenerateStore, type HistoryEntry } from '@/stores/useGenerateStore';

const GenerationHistory = () => {
  const { history, rerun, clearHistory } = useGenerateStore();

  if (history.length === 0) return null;

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          History ({history.length})
        </div>
        <button
          onClick={clearHistory}
          className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors"
        >
          <Trash2 className="h-3 w-3" /> Clear
        </button>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {history.map((entry: HistoryEntry) => (
          <button
            key={entry.id}
            onClick={() => rerun(entry)}
            className="flex w-full items-start gap-3 rounded-md border border-border bg-secondary/50 p-2.5 text-left text-xs hover:border-primary/40 transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                  entry.model === 'rnn' ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'
                }`}>
                  {entry.model.toUpperCase()}
                </span>
                <span className="text-muted-foreground">{formatTime(entry.timestamp)}</span>
                <span className="text-muted-foreground">{entry.result.time_ms}ms</span>
              </div>
              <p className="font-mono text-foreground truncate">{entry.prompt}</p>
            </div>
            <RotateCcw className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default GenerationHistory;
