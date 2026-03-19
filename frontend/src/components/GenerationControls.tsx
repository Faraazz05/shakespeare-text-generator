import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useGenerateStore } from '@/stores/useGenerateStore';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const SliderRow = ({
  label,
  value,
  min,
  max,
  step,
  tooltip,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  tooltip: string;
  onChange: (v: number) => void;
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-xs text-muted-foreground cursor-help">{label}</span>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
      <span className="text-xs font-mono text-foreground">{value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-primary"
    />
  </div>
);

const GenerationControls = () => {
  const [open, setOpen] = useState(false);
  const { temperature, topK, maxLength, setTemperature, setTopK, setMaxLength } =
    useGenerateStore();

  return (
    <div className="rounded-lg border border-border bg-secondary/50">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        Advanced Settings
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="space-y-4 px-4 pb-4">
          <SliderRow
            label="Temperature"
            value={temperature}
            min={0.1}
            max={2.0}
            step={0.1}
            tooltip="Higher = more creative"
            onChange={setTemperature}
          />
          <SliderRow
            label="Top-K"
            value={topK}
            min={0}
            max={200}
            step={5}
            tooltip="0 = disabled"
            onChange={setTopK}
          />
          <SliderRow
            label="Max Length"
            value={maxLength}
            min={10}
            max={1000}
            step={10}
            tooltip="Maximum tokens to generate"
            onChange={setMaxLength}
          />
        </div>
      )}
    </div>
  );
};

export default GenerationControls;
