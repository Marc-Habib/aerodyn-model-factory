import * as SliderPrimitive from '@radix-ui/react-slider';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label: string;
  description?: string;
}

export function Slider({ value, min, max, step = 0.01, onChange, label, description }: SliderProps) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <span className="text-sm font-mono text-blue-400">{value?.toFixed(2) ?? '0.00'}</span>
      </div>
      {description && (
        <p className="text-xs text-slate-500 mb-2">{description}</p>
      )}
      <SliderPrimitive.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
      >
        <SliderPrimitive.Track className="bg-slate-700 relative grow rounded-full h-1.5">
          <SliderPrimitive.Range className="absolute bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full h-full" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block w-4 h-4 bg-white rounded-full shadow-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-transform hover:scale-110" />
      </SliderPrimitive.Root>
    </div>
  );
}
