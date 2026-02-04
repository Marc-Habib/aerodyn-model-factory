import * as Tabs from '@radix-ui/react-tabs';
import { Slider } from './Slider';
import type { Parameter, State } from '../api';

interface ParameterPanelProps {
  parameters: Record<string, Parameter>;
  states: Record<string, State>;
  paramValues: Record<string, number>;
  initialValues: Record<string, number>;
  onParamChange: (key: string, value: number) => void;
  onInitialChange: (key: string, value: number) => void;
}

export function ParameterPanel({
  parameters,
  states,
  paramValues,
  initialValues,
  onParamChange,
  onInitialChange,
}: ParameterPanelProps) {
  // Group parameters by category
  const categories = new Map<string, [string, Parameter][]>();
  Object.entries(parameters).forEach(([key, param]) => {
    const cat = param.category || 'other';
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push([key, param]);
  });

  const categoryList = Array.from(categories.keys()).sort();

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
      <Tabs.Root defaultValue="initial" className="flex flex-col">
        <Tabs.List className="flex border-b border-slate-700 bg-slate-800/80">
          <Tabs.Trigger
            value="initial"
            className="flex-1 px-4 py-3 text-sm font-medium text-slate-400 hover:text-slate-200 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 transition-colors"
          >
            Initial States
          </Tabs.Trigger>
          {categoryList.map(cat => (
            <Tabs.Trigger
              key={cat}
              value={cat}
              className="flex-1 px-4 py-3 text-sm font-medium text-slate-400 hover:text-slate-200 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 transition-colors capitalize"
            >
              {cat}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <div className="p-4 max-h-[400px] overflow-y-auto">
          <Tabs.Content value="initial" className="space-y-2">
            {Object.entries(states).map(([key, state]) => (
              <Slider
                key={key}
                label={`${key}: ${state.name}`}
                description={state.description}
                value={initialValues[key] ?? state.initial}
                min={state.min}
                max={state.max}
                onChange={(v) => onInitialChange(key, v)}
              />
            ))}
          </Tabs.Content>

          {categoryList.map(cat => (
            <Tabs.Content key={cat} value={cat} className="space-y-2">
              {categories.get(cat)!.map(([key, param]) => (
                <Slider
                  key={key}
                  label={key}
                  description={param.description}
                  value={paramValues[key] ?? param.value}
                  min={param.min}
                  max={param.max}
                  onChange={(v) => onParamChange(key, v)}
                />
              ))}
            </Tabs.Content>
          ))}
        </div>
      </Tabs.Root>
    </div>
  );
}
