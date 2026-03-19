import { useModelStore } from '@/stores/useModelStore';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const ModelSelector = () => {
  const { selectedModel, setSelectedModel, models } = useModelStore();

  const options = [
    { id: 'rnn', label: 'RNN (LSTM)' },
    { id: 'transformer', label: 'Transformer' },
  ];

  return (
    <div className="flex gap-2">
      {options.map((opt) => {
        const info = models.find((m) => m.id === opt.id);
        const available = info ? info.available : true;
        const active = selectedModel === opt.id;

        const btn = (
          <button
            key={opt.id}
            disabled={!available}
            onClick={() => setSelectedModel(opt.id)}
            className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-all ${
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : available
                ? 'border-border bg-secondary text-secondary-foreground hover:border-primary/50'
                : 'cursor-not-allowed border-border bg-muted text-muted-foreground opacity-50'
            }`}
          >
            {opt.label}
          </button>
        );

        if (!available) {
          return (
            <Tooltip key={opt.id}>
              <TooltipTrigger asChild>{btn}</TooltipTrigger>
              <TooltipContent>Model not loaded — train first</TooltipContent>
            </Tooltip>
          );
        }
        return btn;
      })}
    </div>
  );
};

export default ModelSelector;
