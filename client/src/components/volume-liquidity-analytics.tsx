
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Activity, DollarSign } from "lucide-react";
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

export function VolumeLiquidityAnalytics({ contractAddress }: VolumeLiquidityAnalyticsProps) {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');

  // Fetch volume analytics data
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
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    retry: 2,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });

  // Mock data for demonstration when API fails
  const mockVolumeData: VolumeData[] = [
    { date: '2024-01-01', volume: 1250000, liquidity: 5600000, price: 0.45 },
    { date: '2024-01-02', volume: 980000, liquidity: 5800000, price: 0.47 },
    { date: '2024-01-03', volume: 1650000, liquidity: 6200000, price: 0.52 },
    { date: '2024-01-04', volume: 2100000, liquidity: 6800000, price: 0.58 },
    { date: '2024-01-05', volume: 1800000, liquidity: 7200000, price: 0.61 },
    { date: '2024-01-06', volume: 1450000, liquidity: 7500000, price: 0.59 },
    { date: '2024-01-07', volume: 1920000, liquidity: 7800000, price: 0.63 }
  ];

  const data = volumeData?.data || mockVolumeData;
  
  // Calculate metrics
  const totalVolume = data.reduce((sum, item) => sum + item.volume, 0);
  const avgLiquidity = data.reduce((sum, item) => sum + item.liquidity, 0) / data.length;
  const volumeChange = data.length > 1 ? 
    ((data[data.length - 1].volume - data[data.length - 2].volume) / data[data.length - 2].volume) * 100 : 0;
  const liquidityChange = data.length > 1 ? 
    ((data[data.length - 1].liquidity - data[data.length - 2].liquidity) / data[data.length - 2].liquidity) * 100 : 0;

  if (isVolumeLoading) {
    return (
      <Card className="crypto-card mt-8">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Volume & Liquidity Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="crypto-card mt-8">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          Volume & Liquidity Analytics
        </CardTitle>
        <div className="flex space-x-2 mt-4">
          {(['7d', '30d', '90d'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                timeframe === period
                  ? 'bg-crypto-blue text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {/* Metrics Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <DollarSign className="w-4 h-4 text-crypto-gold mr-1" />
              <span className="text-gray-400 text-sm">Total Volume</span>
            </div>
            <p className="text-xl font-bold text-white">
              ${(totalVolume / 1000000).toFixed(2)}M
            </p>
            <Badge variant={volumeChange >= 0 ? "default" : "destructive"} className="mt-1">
              {volumeChange >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {Math.abs(volumeChange).toFixed(1)}%
            </Badge>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Activity className="w-4 h-4 text-crypto-blue mr-1" />
              <span className="text-gray-400 text-sm">Avg Liquidity</span>
            </div>
            <p className="text-xl font-bold text-white">
              ${(avgLiquidity / 1000000).toFixed(2)}M
            </p>
            <Badge variant={liquidityChange >= 0 ? "default" : "destructive"} className="mt-1">
              {liquidityChange >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {Math.abs(liquidityChange).toFixed(1)}%
            </Badge>
          </div>

          <div className="text-center">
            <span className="text-gray-400 text-sm">24h Volume</span>
            <p className="text-xl font-bold text-white">
              ${(data[data.length - 1]?.volume / 1000000 || 0).toFixed(2)}M
            </p>
          </div>

          <div className="text-center">
            <span className="text-gray-400 text-sm">Current Liquidity</span>
            <p className="text-xl font-bold text-white">
              ${(data[data.length - 1]?.liquidity / 1000000 || 0).toFixed(2)}M
            </p>
          </div>
        </div>

        {/* Charts Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Volume Chart */}
          <div>
            <h4 className="text-white font-semibold mb-4">Trading Volume</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    fontSize={11}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={11}
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                    cursor={false}
                    formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, 'Volume']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Bar dataKey="volume" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Liquidity Chart */}
          <div>
            <h4 className="text-white font-semibold mb-4">Liquidity Trend</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    fontSize={11}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={11}
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                    formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, 'Liquidity']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Line
                    type="monotone"
                    dataKey="liquidity"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#10B981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
