import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { SimulationResult } from '../api';

const COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
];

interface ChartProps {
  result: SimulationResult | null;
  title?: string;
}

export function SimulationChart({ result, title }: ChartProps) {
  if (!result) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-500">
        <p>No simulation data available</p>
      </div>
    );
  }

  // Detect stagnation: find where all values stop changing significantly
  const detectStagnationPoint = (data: any[]) => {
    if (data.length < 10) return data.length;
    
    const threshold = 0.001; // Consider stagnant if change < 0.1%
    let stagnationStart = data.length;
    
    for (let i = data.length - 1; i >= 10; i--) {
      let allStagnant = true;
      const currentPoint = data[i];
      const prevPoint = data[i - 1];
      
      for (const key of Object.keys(currentPoint)) {
        if (key === 't') continue;
        const change = Math.abs(currentPoint[key] - prevPoint[key]);
        if (change > threshold) {
          allStagnant = false;
          break;
        }
      }
      
      if (!allStagnant) {
        stagnationStart = i + 5; // Add small buffer
        break;
      }
    }
    
    return Math.min(stagnationStart, data.length);
  };

  const stagnationPoint = detectStagnationPoint(result.t.map((t, i) => {
    const point: Record<string, number> = { t: parseFloat(t.toFixed(1)) };
    Object.keys(result.states).forEach(name => {
      point[name] = result.states[name][i];
    });
    return point;
  }));
  const trimmedData = result.t.slice(0, stagnationPoint).map((t, i) => {
    const point: Record<string, number> = { t: parseFloat(t.toFixed(1)) };
    Object.keys(result.states).forEach(name => {
      point[name] = result.states[name][i];
    });
    return point;
  });

  const stateNames = Object.keys(result.states);
  
  const data = trimmedData;

  // Sample data for performance (every 5th point)
  const sampledData = data.filter((_, i) => i % 5 === 0 || i === data.length - 1);

  return (
    <div className="w-full" style={{ height: '400px' }}>
      {title && <h3 className="text-lg font-semibold text-slate-200 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height="100%" minHeight={300}>
        <LineChart data={sampledData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="t" 
            stroke="#94a3b8" 
            fontSize={12}
            label={{ value: 'Time', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
          />
          <YAxis 
            stroke="#94a3b8" 
            fontSize={12} 
            domain={[0, 1]}
            label={{ value: 'State', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1e293b', 
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#e2e8f0'
            }}
          />
          <Legend />
          {stateNames.map((name, i) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface CompareChartProps {
  results: Record<string, SimulationResult>;
  stateKey: string;
}

export function CompareChart({ results, stateKey }: CompareChartProps) {
  const scenarioNames = Object.keys(results);
  if (scenarioNames.length === 0) return null;

  const firstResult = results[scenarioNames[0]];
  const data = firstResult.t.map((t, i) => {
    const point: Record<string, number> = { t: parseFloat(t.toFixed(1)) };
    scenarioNames.forEach(name => {
      point[name] = results[name].states[stateKey][i];
    });
    return point;
  });

  const sampledData = data.filter((_, i) => i % 5 === 0 || i === data.length - 1);

  return (
    <div className="w-full" style={{ height: '400px' }}>
      <h3 className="text-lg font-semibold text-slate-200 mb-4">
        Compare: {stateKey} across scenarios
      </h3>
      <ResponsiveContainer width="100%" height="100%" minHeight={300}>
        <LineChart data={sampledData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="t" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 1]} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1e293b', 
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#e2e8f0'
            }}
          />
          <Legend />
          {scenarioNames.map((name, i) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
