
import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Activity,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface VolumeData {
  date: string;
  volume: number;
  liquidity: number;
  price: number;
}

interface VolumeLiquidityAnalyticsProps {
  contractAddress: string;
}

const chartTooltipStyle = {
  backgroundColor: "#0d1219",
  border: "1px solid #1e2733",
  borderRadius: "6px",
  color: "#e6edf3",
  fontSize: "12px",
};

function MetricCard({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change?: number;
}) {
  const hasChange = change !== undefined;
  const isPositive = (change ?? 0) >= 0;
  return (
    <Card className="p-4 border border-gray-800/60 bg-[#0b0f16] hover:border-gray-700 transition-all duration-200 shadow-md shadow-black/50 rounded-lg relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-white/[0.01] to-transparent pointer-events-none" />
      <div className="relative z-10">
        <p className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wide">{label}</p>
        <div className="flex items-end justify-between">
          <span className="text-2xl font-bold text-white">{value}</span>
          {hasChange && (
            <span
              className={`text-xs font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded ${
                isPositive
                  ? "text-emerald-400 bg-emerald-500/10"
                  : "text-red-400 bg-red-500/10"
              }`}
            >
              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {isPositive ? "+" : ""}
              {change!.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-4 border border-gray-700 bg-[#030712] rounded-lg shadow-md shadow-black/50 relative overflow-hidden">
      <div className="relative z-10">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">{title}</h3>
        <div className="h-[205px]">{children}</div>
      </div>
    </Card>
  );
}

export function VolumeLiquidityAnalytics({ contractAddress }: VolumeLiquidityAnalyticsProps) {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');

  const { data: volumeData, isLoading: isVolumeLoading } = useQuery({
    queryKey: ['/api/volume-analytics', contractAddress, timeframe],
    queryFn: async () => {
      const endpoint = window.location.hostname === 'localhost'
        ? `/api/volume-analytics?contract=${contractAddress}&timeframe=${timeframe}`
        : `/.netlify/functions/volume-analytics?contract=${contractAddress}&timeframe=${timeframe}`;

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Volume analytics fetch failed: ${response.status}`);
      }
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
    staleTime: 2 * 60 * 1000,
  });

  const mockVolumeData: VolumeData[] = [
    { date: '2024-01-01', volume: 1250000, liquidity: 5600000, price: 0.45 },
    { date: '2024-01-02', volume: 980000, liquidity: 5800000, price: 0.47 },
    { date: '2024-01-03', volume: 1650000, liquidity: 6200000, price: 0.52 },
    { date: '2024-01-04', volume: 2100000, liquidity: 6800000, price: 0.58 },
    { date: '2024-01-05', volume: 1800000, liquidity: 7200000, price: 0.61 },
    { date: '2024-01-06', volume: 1450000, liquidity: 7500000, price: 0.59 },
    { date: '2024-01-07', volume: 1920000, liquidity: 7800000, price: 0.63 },
  ];

  const data = volumeData?.data || mockVolumeData;

  const totalVolume = data.reduce((sum: number, item: VolumeData) => sum + item.volume, 0);
  const avgLiquidity = data.reduce((sum: number, item: VolumeData) => sum + item.liquidity, 0) / data.length;
  const volumeChange = data.length > 1 ?
    ((data[data.length - 1].volume - data[data.length - 2].volume) / data[data.length - 2].volume) * 100 : 0;
  const liquidityChange = data.length > 1 ?
    ((data[data.length - 1].liquidity - data[data.length - 2].liquidity) / data[data.length - 2].liquidity) * 100 : 0;

  const fmtDate = (value: string) =>
    new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (isVolumeLoading) {
    return (
      <Card className="p-4 border border-gray-800/60 bg-[#0b0f16] rounded-lg shadow-md shadow-black/50 relative overflow-hidden mt-8">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-white/[0.01] to-transparent pointer-events-none" />
        <div className="relative z-10 flex items-center gap-2 text-gray-300 text-sm font-semibold mb-4">
          <Activity className="w-4 h-4" />
          Volume & Liquidity Analytics
        </div>
        <LoadingSpinner />
      </Card>
    );
  }

  return (
    <div className="mt-8 space-y-3">
      {/* Section Header + Timeframe Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">
            Volume & Liquidity Analytics
          </h2>
        </div>
        <div className="flex gap-1 bg-[#161b22] rounded-lg p-0.5 border border-gray-800/60">
          {(['7d', '30d', '90d'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-3 py-1 rounded text-xs font-medium transition-all duration-150 ${
                timeframe === period
                  ? 'bg-cyan-600/80 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/40'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <MetricCard
          label="Total Volume"
          value={`$${(totalVolume / 1000000).toFixed(2)}M`}
          change={volumeChange}
        />
        <MetricCard
          label="Avg Liquidity"
          value={`$${(avgLiquidity / 1000000).toFixed(2)}M`}
          change={liquidityChange}
        />
        <MetricCard
          label="24h Volume"
          value={`$${(data[data.length - 1]?.volume / 1000000 || 0).toFixed(2)}M`}
        />
        <MetricCard
          label="Current Liquidity"
          value={`$${(data[data.length - 1]?.liquidity / 1000000 || 0).toFixed(2)}M`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Volume Bar Chart */}
        <ChartCard title="Trading Volume">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 5, bottom: 0, left: -15 }}>
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                fontSize={10}
                tickLine={false}
                tickFormatter={fmtDate}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={10}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
              />
              <Tooltip
                contentStyle={chartTooltipStyle}
                cursor={false}
                formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, 'Volume']}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Bar dataKey="volume" fill="#06b6d4" radius={[3, 3, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Liquidity Area Chart */}
        <ChartCard title="Liquidity Trend">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 0, right: 5, bottom: 0, left: -15 }}>
              <defs>
                <linearGradient id="gradVolLiquidity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                fontSize={10}
                tickLine={false}
                tickFormatter={fmtDate}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={10}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
              />
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, 'Liquidity']}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Area
                type="monotone"
                dataKey="liquidity"
                stroke="#10b981"
                fill="url(#gradVolLiquidity)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: "#10b981" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
