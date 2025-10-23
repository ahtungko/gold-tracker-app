import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { HistoricalData } from '@/lib/goldApi';

interface GoldChartProps {
  data: HistoricalData[];
  loading?: boolean;
}

export function GoldChart({ data, loading }: GoldChartProps) {
  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-card rounded-lg">
        <div className="text-muted-foreground">Loading chart...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-card rounded-lg">
        <div className="text-muted-foreground">No data available</div>
      </div>
    );
  }

  return (
    <div className="w-full h-96 bg-card rounded-lg p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255, 255, 255, 0.1)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            stroke="rgba(255, 255, 255, 0.5)"
            style={{ fontSize: '12px' }}
            tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
            interval={Math.floor(data.length / 6)}
          />
          <YAxis
            stroke="rgba(255, 255, 255, 0.5)"
            style={{ fontSize: '12px' }}
            tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
            domain={['dataMin - 50', 'dataMax + 50']}
            width={60}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(20, 20, 30, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '12px',
            }}
            labelStyle={{ color: 'rgba(255, 255, 255, 0.9)' }}
            formatter={(value) => {
              if (typeof value === 'number') {
                return `$${value.toFixed(2)}`;
              }
              return value;
            }}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="var(--primary)"
            strokeWidth={3}
            dot={false}
            isAnimationActive={true}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

