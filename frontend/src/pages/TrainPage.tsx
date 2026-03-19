// src/pages/TrainPage.tsx
import { useEffect } from 'react';
import { GraduationCap, Play, Loader2 } from 'lucide-react';
import LossChart from '@/components/LossChart';
import StatusBadge from '@/components/StatusBadge';
import { useTrainStore } from '@/stores/useTrainStore';

const ParamInput = ({
  label, value, onChange, step,
}: {
  label: string; value: number;
  onChange: (v: number) => void; step?: number;
}) => (
  <div>
    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
    <input
      type="number"
      step={step ?? 1}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm font-mono text-foreground focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
    />
  </div>
);

const TrainPage = () => {
  const {
    status, loading, error, config,
    setConfig, startTraining, pollStatus, clearError,
  } = useTrainStore();

  useEffect(() => {
    // ✅ Clear any stale error from previous session on page load
    clearError();
    // Passive poll on mount to pick up any in-progress training
    pollStatus();
  }, []); // run once on mount only — no dependency array needed

  const isRunning = status?.is_running ?? false;
  const progress =
    status && status.total_epochs > 0
      ? Math.round((status.current_epoch / status.total_epochs) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-20 pb-12">
      <div className="mb-8 flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-yellow-500" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Train Model</h1>
          <p className="text-sm text-muted-foreground">
            Train the RNN (LSTM/GRU) model on TinyShakespeare
          </p>
        </div>
      </div>

      {/* Live status card — only shown when we have status */}
      {status && (status.is_running || status.finished || status.current_epoch > 0) && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Training Status</span>
            <StatusBadge
              running={status.is_running}
              finished={status.finished}
              error={status.error}
            />
          </div>

          {status.total_epochs > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Epoch {status.current_epoch} / {status.total_epochs}</span>
                <span>Best val loss: {status.best_val_loss?.toFixed(4) ?? '—'}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    status.finished ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">{progress}%</p>
            </div>
          )}

          {status.last_log && (
            <p className="mt-2 text-xs font-mono text-muted-foreground truncate">
              {status.last_log}
            </p>
          )}
        </div>
      )}

      {/* Loss chart — only when data exists */}
      {status && status.train_losses.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-foreground">Loss Curves</h2>
          <LossChart
            trainLosses={status.train_losses}
            valLosses={status.val_losses}
          />
        </div>
      )}

      {/* Hyperparameter form */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Hyperparameters</h2>

        {/* RNN type toggle */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            RNN Type
          </label>
          <div className="flex gap-2">
            {(['lstm', 'gru'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setConfig({ rnn_type: t })}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  config.rnn_type === t
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <ParamInput label="Epochs"          value={config.epochs ?? 20}          onChange={(v) => setConfig({ epochs: v })} />
          <ParamInput label="Learning Rate"   value={config.learning_rate ?? 0.001} onChange={(v) => setConfig({ learning_rate: v })} step={0.0001} />
          <ParamInput label="Batch Size"      value={config.batch_size ?? 64}       onChange={(v) => setConfig({ batch_size: v })} />
          <ParamInput label="Sequence Length" value={config.sequence_length ?? 100} onChange={(v) => setConfig({ sequence_length: v })} />
          <ParamInput label="Hidden Size"     value={config.hidden_size ?? 256}     onChange={(v) => setConfig({ hidden_size: v })} />
        </div>

        <button
          disabled={isRunning || loading}
          onClick={startTraining}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-500 px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Starting…</>
          ) : isRunning ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Training in progress…</>
          ) : (
            <><Play className="h-4 w-4" /> Start Training</>
          )}
        </button>

        {/* ✅ Only show error if it's NOT just a stale mount-poll failure */}
        {error && (
          <div className="mt-3 flex items-start justify-between rounded-md bg-destructive/10 px-3 py-2">
            <p className="text-xs text-destructive">{error}</p>
            <button onClick={clearError} className="ml-2 text-xs text-destructive/60 hover:text-destructive">✕</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainPage;
