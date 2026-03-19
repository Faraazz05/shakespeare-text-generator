// src/pages/ModelsPage.tsx
import { useEffect } from 'react';
import { Layers } from 'lucide-react';
import ModelCard from '@/components/ModelCard';
import { useModelStore } from '@/stores/useModelStore';

const ModelsPage = () => {
  // ✅ Fixed: fetchHealth → checkHealth
  const { models, health, fetchModels, checkHealth } = useModelStore();

  useEffect(() => {
    fetchModels();
    checkHealth();
  }, [fetchModels, checkHealth]);

  return (
    <div className="mx-auto max-w-3xl px-4 pt-20 pb-12">
      <div className="mb-8 flex items-center gap-2">
        <Layers className="h-5 w-5 text-green-500" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Models</h1>
          <p className="text-sm text-muted-foreground">Available models and their status</p>
        </div>
      </div>

      {health && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Service', value: health.service },
            { label: 'Version', value: health.version },
            { label: 'Device',  value: health.device  },
            { label: 'Status',  value: health.status  },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-border bg-card p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-0.5 text-sm font-medium text-foreground font-mono">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {models.map((m) => (
          <ModelCard key={m.id} model={m} />
        ))}
      </div>

      {models.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-12">
          No models found. Make sure the backend is running.
        </p>
      )}
    </div>
  );
};

export default ModelsPage;
