import { useEffect } from 'react';
import { Settings, Loader2, RefreshCw } from 'lucide-react';
import { useConfigStore } from '@/stores/useConfigStore';

const ConfigSection = ({ title, data }: { title: string; data: Record<string, unknown> }) => (
  <div className="rounded-lg border border-border bg-card p-5">
    <h2 className="mb-3 text-sm font-semibold text-foreground capitalize">{title}</h2>
    <div className="space-y-2">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="flex items-start justify-between gap-4 text-xs">
          <span className="text-muted-foreground font-mono">{key}</span>
          <span className="text-foreground font-mono text-right break-all">
            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const ConfigPage = () => {
  const { config, loading, error, fetchConfig } = useConfigStore();

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return (
    <div className="mx-auto max-w-3xl px-4 pt-20 pb-12">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Configuration</h1>
            <p className="text-sm text-muted-foreground">Current backend configuration from GET /config</p>
          </div>
        </div>
        <button
          onClick={fetchConfig}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs text-secondary-foreground hover:border-primary/50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading && !config && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {config && (
        <div className="grid gap-4">
          {Object.entries(config).map(([section, data]) => (
            <ConfigSection
              key={section}
              title={section}
              data={data as Record<string, unknown>}
            />
          ))}
        </div>
      )}

      {!loading && !config && !error && (
        <p className="text-center text-sm text-muted-foreground py-12">
          No configuration loaded. Make sure the backend is running.
        </p>
      )}
    </div>
  );
};

export default ConfigPage;
