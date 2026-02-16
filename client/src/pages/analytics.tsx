import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Layout } from "@/components/layout";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ComposedChart,
  Legend,
} from "recharts";

// ─── Mock Data Layer ───────────────────────────────────────────────
// Swap to real API by toggling USE_MOCK_DATA or replacing fetch functions

const DATE_RANGES = ["Last 7 Days", "Last 30 Days", "Last 90 Days", "1 Year"] as const;
const PROTOCOLS = ["All", "Staking", "DEX", "Bridge", "Lending", "NFT"] as const;

type DateRange = (typeof DATE_RANGES)[number];
type Protocol = (typeof PROTOCOLS)[number];

function generateTVLData(range: DateRange) {
  const days = range === "Last 7 Days" ? 7 : range === "Last 30 Days" ? 30 : range === "Last 90 Days" ? 90 : 365;
  const data = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - i));
    const base = 8 + i * (4.5 / days);
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      Staking: +(base * 0.30 + Math.random() * 0.3).toFixed(2),
      DEX: +(base * 0.25 + Math.random() * 0.25).toFixed(2),
      Bridge: +(base * 0.15 + Math.random() * 0.15).toFixed(2),
      Lending: +(base * 0.20 + Math.random() * 0.2).toFixed(2),
      NFT: +(base * 0.10 + Math.random() * 0.1).toFixed(2),
    });
  }
  return data;
}

function generateVolumeFeesData(range: DateRange) {
  const days = range === "Last 7 Days" ? 7 : range === "Last 30 Days" ? 30 : range === "Last 90 Days" ? 90 : 52;
  const data = [];
  for (let i = 0; i < Math.min(days, 30); i++) {
    const d = new Date();
    d.setDate(d.getDate() - (Math.min(days, 30) - i));
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      volume: +(500 + Math.random() * 600).toFixed(0),
      fees: +(15 + Math.random() * 20).toFixed(1),
    });
  }
  return data;
}

function generateUserGrowthData(range: DateRange) {
  const days = range === "Last 7 Days" ? 7 : range === "Last 30 Days" ? 30 : range === "Last 90 Days" ? 90 : 365;
  const data = [];
  for (let i = 0; i < Math.min(days, 30); i++) {
    const d = new Date();
    d.setDate(d.getDate() - (Math.min(days, 30) - i));
    const progress = i / Math.min(days, 30);
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      users: Math.floor(4200 + progress * 4100 + Math.random() * 300),
    });
  }
  return data;
}

function generateNFTData(range: DateRange) {
  const days = range === "Last 7 Days" ? 7 : range === "Last 30 Days" ? 30 : range === "Last 90 Days" ? 90 : 365;
  const data = [];
  for (let i = 0; i < Math.min(days, 30); i++) {
    const d = new Date();
    d.setDate(d.getDate() - (Math.min(days, 30) - i));
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      sales: Math.floor(60 + Math.random() * 120),
      floorPrice: +(0.08 + Math.random() * 0.06).toFixed(3),
      buyers: Math.floor(30 + Math.random() * 50),
    });
  }
  return data;
}

// ─── Protocol-Specific Mock Data ──────────────────────────────────

function getDays(range: DateRange) {
  return range === "Last 7 Days" ? 7 : range === "Last 30 Days" ? 30 : range === "Last 90 Days" ? 90 : 365;
}

function dateLabel(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function generateStakingData(range: DateRange) {
  const days = getDays(range);
  const pts = Math.min(days, 30);
  const data = [];
  let cumRewards = 0;
  for (let i = 0; i < pts; i++) {
    const progress = i / pts;
    const staked = +(2.5 + progress * 1.2 + Math.random() * 0.2).toFixed(2);
    const apy = +(11 + Math.sin(i * 0.3) * 2 + Math.random() * 0.5).toFixed(1);
    const stakers = Math.floor(1200 + progress * 400 + Math.random() * 80);
    const dailyRewards = +(staked * (apy / 100) / 365).toFixed(4);
    cumRewards += dailyRewards;
    data.push({
      date: dateLabel(pts - i),
      staked,
      apy,
      stakers,
      dailyRewards: +dailyRewards.toFixed(4),
      cumRewards: +cumRewards.toFixed(4),
    });
  }
  return data;
}

function generateDEXData(range: DateRange) {
  const days = getDays(range);
  const pts = Math.min(days, 30);
  const data = [];
  let cumFees = 0;
  for (let i = 0; i < pts; i++) {
    const progress = i / pts;
    const liquidity = +(2.8 + progress * 1.0 + Math.random() * 0.3).toFixed(2);
    const swapVolume = Math.floor(250 + Math.random() * 350);
    const dailyFees = +(swapVolume * 0.003 * 10).toFixed(1); // 0.3% fee
    cumFees += dailyFees;
    data.push({
      date: dateLabel(pts - i),
      liquidity,
      swapVolume,
      dailyFees,
      cumFees: +cumFees.toFixed(1),
    });
  }
  return data;
}

const DEX_PAIRS_DATA = [
  { pair: "OEC/ETH", volume: 142 },
  { pair: "OEC/USDC", volume: 118 },
  { pair: "ETH/USDC", volume: 95 },
  { pair: "OEC/LINK", volume: 48 },
  { pair: "LINK/ETH", volume: 32 },
];

function generateBridgeData(range: DateRange) {
  const days = getDays(range);
  const pts = Math.min(days, 30);
  const data = [];
  for (let i = 0; i < pts; i++) {
    const progress = i / pts;
    const total = 80 + Math.random() * 100;
    data.push({
      date: dateLabel(pts - i),
      bridgeVolume: +total.toFixed(0),
      ethereum: +(total * 0.4 + Math.random() * 10).toFixed(0),
      polygon: +(total * 0.25 + Math.random() * 8).toFixed(0),
      arbitrum: +(total * 0.2 + Math.random() * 6).toFixed(0),
      optimism: +(total * 0.15 + Math.random() * 5).toFixed(0),
      bridgers: Math.floor(40 + progress * 30 + Math.random() * 20),
      avgSize: +(1.2 + Math.random() * 2.5).toFixed(2),
    });
  }
  return data;
}

function generateLendingData(range: DateRange) {
  const days = getDays(range);
  const pts = Math.min(days, 30);
  const data = [];
  for (let i = 0; i < pts; i++) {
    const progress = i / pts;
    const supplied = +(2.0 + progress * 0.8 + Math.random() * 0.15).toFixed(2);
    const borrowed = +(supplied * (0.55 + Math.random() * 0.15)).toFixed(2);
    const utilization = +((borrowed / supplied) * 100).toFixed(1);
    const supplyAPY = +(3 + utilization * 0.06 + Math.random() * 0.5).toFixed(2);
    const borrowAPY = +(supplyAPY * 1.6 + Math.random() * 0.3).toFixed(2);
    const liquidations = Math.floor(Math.random() * 8);
    data.push({
      date: dateLabel(pts - i),
      supplied,
      borrowed,
      utilization,
      supplyAPY,
      borrowAPY,
      liquidations,
    });
  }
  return data;
}

function generateNFTDetailData(range: DateRange) {
  const days = getDays(range);
  const pts = Math.min(days, 30);
  const data = [];
  for (let i = 0; i < pts; i++) {
    const progress = i / pts;
    const sales = Math.floor(60 + Math.random() * 120);
    const listings = Math.floor(sales * (1.2 + Math.random() * 0.8));
    data.push({
      date: dateLabel(pts - i),
      salesVolume: +(3 + progress * 2 + Math.random() * 1.5).toFixed(2),
      floorPrice: +(0.08 + progress * 0.04 + Math.random() * 0.02).toFixed(3),
      buyers: Math.floor(30 + Math.random() * 50),
      sellers: Math.floor(20 + Math.random() * 40),
      listings,
      sales,
    });
  }
  return data;
}

// ─── Protocol Table Data ──────────────────────────────────────────

const PROTOCOL_TABLE_DATA = [
  { name: "Staking", tvl: "$3.12M", volume: "$180K", users: 1540, fees: "$8.2K", apy: "12.3%", change: 3.2 },
  { name: "DEX/Eloqura", tvl: "$3.45M", volume: "$320K", users: 2890, fees: "$12.1K", apy: "8.5%", change: 5.1 },
  { name: "Bridge", tvl: "$2.10M", volume: "$95K", users: 680, fees: "$3.8K", apy: "0.06%", change: -1.2 },
  { name: "Lending/Alluria", tvl: "$2.54M", volume: "$185K", users: 1760, fees: "$9.5K", apy: "6.7%", change: 4.8 },
  { name: "NFT/Artivya", tvl: "$1.24M", volume: "$76K", users: 1450, fees: "$5.2K", apy: "12.2%", change: 8.4 },
];

// ─── KPI Card ──────────────────────────────────────────────────────

function KPICard({
  label,
  value,
  change,
  prefix = "",
}: {
  label: string;
  value: string;
  change: number;
  prefix?: string;
}) {
  const isPositive = change >= 0;
  return (
    <Card className="p-4 border border-gray-800/60 bg-[#0b0f16] hover:border-gray-700 transition-all duration-200 shadow-md shadow-black/50 rounded-lg relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-white/[0.01] to-transparent pointer-events-none" />
      <div className="relative z-10">
        <p className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wide">{label}</p>
        <div className="flex items-end justify-between">
          <span className="text-2xl font-bold text-white">
            {prefix}{value}
          </span>
          <span
            className={`text-xs font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded ${
              isPositive
                ? "text-emerald-400 bg-emerald-500/10"
                : "text-red-400 bg-red-500/10"
            }`}
          >
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {isPositive ? "+" : ""}
            {change.toFixed(1)}%
          </span>
        </div>
      </div>
    </Card>
  );
}

// ─── Chart Card Wrapper ────────────────────────────────────────────

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

// ─── Custom Tooltip ────────────────────────────────────────────────

const chartTooltipStyle = {
  backgroundColor: "#0d1219",
  border: "1px solid #1e2733",
  borderRadius: "6px",
  color: "#e6edf3",
  fontSize: "12px",
};

// ─── Protocol KPI Configs ──────────────────────────────────────────

function getProtocolKPIs(protocol: Protocol, data: any[]) {
  const last = data[data.length - 1] || {};
  switch (protocol) {
    case "Staking":
      return [
        { label: "Total Staked", value: `$${last.staked?.toFixed(2) || "0"}M`, change: 3.2 },
        { label: "APY", value: `${last.apy?.toFixed(1) || "0"}%`, change: 0.8 },
        { label: "Total Stakers", value: (last.stakers || 0).toLocaleString(), change: 5.1 },
        { label: "Rewards Distributed", value: `$${last.cumRewards?.toFixed(2) || "0"}M`, change: 2.4 },
      ];
    case "DEX":
      return [
        { label: "DEX TVL", value: `$${last.liquidity?.toFixed(2) || "0"}M`, change: 5.1 },
        { label: "24h Swap Volume", value: `$${last.swapVolume || 0}K`, change: 3.1 },
        { label: "Total Pairs", value: "5", change: 0.0 },
        { label: "Fees Earned", value: `$${last.cumFees?.toFixed(1) || "0"}K`, change: 6.3 },
      ];
    case "Bridge":
      return [
        { label: "Bridge TVL", value: "$2.10M", change: -1.2 },
        { label: "24h Transfer Volume", value: `$${last.bridgeVolume || 0}K`, change: 2.8 },
        { label: "Unique Bridgers", value: (last.bridgers || 0).toLocaleString(), change: 4.2 },
        { label: "Avg Transfer Size", value: `$${last.avgSize || 0}K`, change: -0.5 },
      ];
    case "Lending":
      return [
        { label: "Total Supplied", value: `$${last.supplied?.toFixed(2) || "0"}M`, change: 4.8 },
        { label: "Total Borrowed", value: `$${last.borrowed?.toFixed(2) || "0"}M`, change: 3.6 },
        { label: "Utilization Rate", value: `${last.utilization?.toFixed(1) || "0"}%`, change: 1.2 },
        { label: "Supply APY", value: `${last.supplyAPY?.toFixed(2) || "0"}%`, change: 0.3 },
      ];
    case "NFT":
      return [
        { label: "NFT Market Cap", value: "$1.24M", change: 8.4 },
        { label: "24h Sales Volume", value: `$${last.salesVolume?.toFixed(2) || "0"}K`, change: 12.3 },
        { label: "Floor Price (ETH)", value: `${last.floorPrice || "0"} ETH`, change: 5.6 },
        { label: "Unique Collectors", value: (last.buyers || 0).toLocaleString(), change: 7.1 },
      ];
    default:
      return [];
  }
}

// ─── Protocol Chart Renderers ─────────────────────────────────────

const chartMargin = { top: 0, right: 5, bottom: 0, left: -15 };

function renderStakingCharts(data: any[]) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <ChartCard title="Staked TVL Over Time">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={chartMargin}>
            <defs>
              <linearGradient id="gradStakingTVL" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
            <YAxis stroke="#6b7280" fontSize={10} tickLine={false} tickFormatter={(v) => `$${v}M`} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`$${v.toFixed(2)}M`, "Staked"]} />
            <Area type="monotone" dataKey="staked" stroke="#06b6d4" fill="url(#gradStakingTVL)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="APY Trend">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
            <YAxis stroke="#6b7280" fontSize={10} tickLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${v.toFixed(1)}%`, "APY"]} />
            <Line type="monotone" dataKey="apy" stroke="#06b6d4" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: "#06b6d4" }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Daily Stakers">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
            <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [v.toLocaleString(), "Stakers"]} />
            <Bar dataKey="stakers" fill="#06b6d4" radius={[3, 3, 0, 0]} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Rewards Distribution">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
            <YAxis yAxisId="left" stroke="#6b7280" fontSize={10} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={10} tickLine={false} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number, name: string) => [
              name === "cumRewards" ? `$${v.toFixed(2)}M` : `$${v.toFixed(4)}M`,
              name === "cumRewards" ? "Cumulative" : "Daily Rewards",
            ]} />
            <Bar yAxisId="left" dataKey="dailyRewards" fill="#06b6d4" radius={[3, 3, 0, 0]} opacity={0.7} />
            <Line yAxisId="right" type="monotone" dataKey="cumRewards" stroke="#22d3ee" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function renderDEXCharts(data: any[]) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <ChartCard title="Liquidity Pool Depth Over Time">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={chartMargin}>
            <defs>
              <linearGradient id="gradDEXLiquidity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
            <YAxis stroke="#6b7280" fontSize={10} tickLine={false} tickFormatter={(v) => `$${v}M`} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`$${v.toFixed(2)}M`, "Liquidity"]} />
            <Area type="monotone" dataKey="liquidity" stroke="#8b5cf6" fill="url(#gradDEXLiquidity)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Swap Volume by Day">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
            <YAxis stroke="#6b7280" fontSize={10} tickLine={false} tickFormatter={(v) => `$${v}K`} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`$${v}K`, "Volume"]} />
            <Bar dataKey="swapVolume" fill="#8b5cf6" radius={[3, 3, 0, 0]} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Top Trading Pairs Volume">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={DEX_PAIRS_DATA} margin={chartMargin} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis type="number" stroke="#6b7280" fontSize={10} tickLine={false} tickFormatter={(v) => `$${v}K`} />
            <YAxis type="category" dataKey="pair" stroke="#6b7280" fontSize={10} tickLine={false} width={70} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`$${v}K`, "Volume"]} />
            <Bar dataKey="volume" fill="#a78bfa" radius={[0, 3, 3, 0]} opacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Fee Revenue Trend">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
            <YAxis yAxisId="left" stroke="#6b7280" fontSize={10} tickLine={false} tickFormatter={(v) => `$${v}K`} />
            <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={10} tickLine={false} tickFormatter={(v) => `$${v}K`} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number, name: string) => [
              `$${v.toFixed(1)}K`,
              name === "cumFees" ? "Cumulative" : "Daily Fees",
            ]} />
            <Bar yAxisId="left" dataKey="dailyFees" fill="#8b5cf6" radius={[3, 3, 0, 0]} opacity={0.7} />
            <Line yAxisId="right" type="monotone" dataKey="cumFees" stroke="#c4b5fd" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function renderBridgeCharts(data: any[]) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <ChartCard title="Bridge Volume Over Time">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={chartMargin}>
            <defs>
              <linearGradient id="gradBridgeVol" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
            <YAxis stroke="#6b7280" fontSize={10} tickLine={false} tickFormatter={(v) => `$${v}K`} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`$${v}K`, "Volume"]} />
            <Area type="monotone" dataKey="bridgeVolume" stroke="#f59e0b" fill="url(#gradBridgeVol)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Transfers by Chain">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
            <YAxis stroke="#6b7280" fontSize={10} tickLine={false} tickFormatter={(v) => `$${v}K`} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number, name: string) => [`$${v}K`, name]} />
            <Bar dataKey="ethereum" stackId="chain" fill="#627eea" radius={[0, 0, 0, 0]} />
            <Bar dataKey="polygon" stackId="chain" fill="#8247e5" radius={[0, 0, 0, 0]} />
            <Bar dataKey="arbitrum" stackId="chain" fill="#28a0f0" radius={[0, 0, 0, 0]} />
            <Bar dataKey="optimism" stackId="chain" fill="#ff0420" radius={[3, 3, 0, 0]} />
            <Legend wrapperStyle={{ fontSize: "11px", color: "#9ca3af" }} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Unique Bridgers Trend">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={chartMargin}>
            <defs>
              <linearGradient id="gradBridgers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
            <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [v, "Bridgers"]} />
            <Area type="monotone" dataKey="bridgers" stroke="#fbbf24" fill="url(#gradBridgers)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Average Transfer Size">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
            <YAxis stroke="#6b7280" fontSize={10} tickLine={false} tickFormatter={(v) => `$${v}K`} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`$${v.toFixed(2)}K`, "Avg Size"]} />
            <Line type="monotone" dataKey="avgSize" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: "#f59e0b" }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function renderLendingCharts(data: any[]) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <ChartCard title="Supply vs Borrow Over Time">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={chartMargin}>
            <defs>
              <linearGradient id="gradSupply" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gradBorrow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
            <YAxis stroke="#6b7280" fontSize={10} tickLine={false} tickFormatter={(v) => `$${v}M`} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number, name: string) => [
              `$${v.toFixed(2)}M`,
              name === "supplied" ? "Supplied" : "Borrowed",
            ]} />
            <Area type="monotone" dataKey="supplied" stroke="#10b981" fill="url(#gradSupply)" strokeWidth={2} />
            <Area type="monotone" dataKey="borrowed" stroke="#f59e0b" fill="url(#gradBorrow)" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Utilization Rate Trend">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
            <YAxis stroke="#6b7280" fontSize={10} tickLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${v.toFixed(1)}%`, "Utilization"]} />
            <Line type="monotone" dataKey="utilization" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: "#10b981" }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Liquidations">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
            <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [v, "Liquidations"]} />
            <Bar dataKey="liquidations" fill="#ef4444" radius={[3, 3, 0, 0]} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Interest Rate Curve">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
            <YAxis stroke="#6b7280" fontSize={10} tickLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number, name: string) => [
              `${v.toFixed(2)}%`,
              name === "supplyAPY" ? "Supply APY" : "Borrow APY",
            ]} />
            <Line type="monotone" dataKey="supplyAPY" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: "#10b981" }} />
            <Line type="monotone" dataKey="borrowAPY" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: "#f59e0b" }} />
            <Legend wrapperStyle={{ fontSize: "11px", color: "#9ca3af" }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function renderNFTCharts(data: any[]) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <ChartCard title="Sales Volume Over Time">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
            <YAxis stroke="#6b7280" fontSize={10} tickLine={false} tickFormatter={(v) => `$${v}K`} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`$${v.toFixed(2)}K`, "Sales Volume"]} />
            <Bar dataKey="salesVolume" fill="#ec4899" radius={[3, 3, 0, 0]} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Floor Price Trend">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
            <YAxis stroke="#6b7280" fontSize={10} tickLine={false} tickFormatter={(v) => `${v} ETH`} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${v} ETH`, "Floor Price"]} />
            <Line type="monotone" dataKey="floorPrice" stroke="#ec4899" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: "#ec4899" }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Unique Buyers vs Sellers">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
            <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number, name: string) => [
              v,
              name === "buyers" ? "Buyers" : "Sellers",
            ]} />
            <Bar dataKey="buyers" fill="#ec4899" radius={[3, 3, 0, 0]} opacity={0.7} />
            <Bar dataKey="sellers" fill="#f9a8d4" radius={[3, 3, 0, 0]} opacity={0.7} />
            <Legend wrapperStyle={{ fontSize: "11px", color: "#9ca3af" }} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Listings vs Sales">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
            <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number, name: string) => [
              v,
              name === "listings" ? "Listings" : "Sales",
            ]} />
            <Bar dataKey="listings" fill="#d946ef" radius={[3, 3, 0, 0]} opacity={0.5} />
            <Line type="monotone" dataKey="sales" stroke="#ec4899" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: "#ec4899" }} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────

export default function Analytics() {
  const [dateRange, setDateRange] = useState<DateRange>("Last 30 Days");
  const [activeProtocol, setActiveProtocol] = useState<Protocol>("All");
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [sortCol, setSortCol] = useState<string>("tvl");
  const [sortAsc, setSortAsc] = useState(false);

  // Generate data based on selected range
  const tvlData = useMemo(() => generateTVLData(dateRange), [dateRange]);
  const volumeFeesData = useMemo(() => generateVolumeFeesData(dateRange), [dateRange]);
  const userGrowthData = useMemo(() => generateUserGrowthData(dateRange), [dateRange]);
  const nftData = useMemo(() => generateNFTData(dateRange), [dateRange]);

  // Protocol-specific data
  const stakingData = useMemo(() => generateStakingData(dateRange), [dateRange]);
  const dexData = useMemo(() => generateDEXData(dateRange), [dateRange]);
  const bridgeData = useMemo(() => generateBridgeData(dateRange), [dateRange]);
  const lendingData = useMemo(() => generateLendingData(dateRange), [dateRange]);
  const nftDetailData = useMemo(() => generateNFTDetailData(dateRange), [dateRange]);

  const protocolDataMap: Record<string, any[]> = {
    Staking: stakingData,
    DEX: dexData,
    Bridge: bridgeData,
    Lending: lendingData,
    NFT: nftDetailData,
  };

  // Protocol name mapping for table filtering
  const protocolTableFilter: Record<string, string> = {
    Staking: "Staking",
    DEX: "DEX/Eloqura",
    Bridge: "Bridge",
    Lending: "Lending/Alluria",
    NFT: "NFT/Artivya",
  };

  // Sort and filter table data
  const sortedTableData = useMemo(() => {
    let data = [...PROTOCOL_TABLE_DATA];
    if (activeProtocol !== "All") {
      const filterName = protocolTableFilter[activeProtocol];
      data = data.filter((row) => row.name === filterName);
    }
    data.sort((a, b) => {
      let aVal: number, bVal: number;
      if (sortCol === "users" || sortCol === "change") {
        aVal = (a as any)[sortCol];
        bVal = (b as any)[sortCol];
      } else {
        aVal = parseFloat(((a as any)[sortCol] || "0").replace(/[$,%KM]/g, ""));
        bVal = parseFloat(((b as any)[sortCol] || "0").replace(/[$,%KM]/g, ""));
      }
      return sortAsc ? aVal - bVal : bVal - aVal;
    });
    return data;
  }, [sortCol, sortAsc, activeProtocol]);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(false);
    }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortCol !== col) return null;
    return sortAsc ? (
      <ChevronUp className="w-3 h-3 inline ml-1" />
    ) : (
      <ChevronDown className="w-3 h-3 inline ml-1" />
    );
  };

  return (
    <Layout>
      <div className="p-4 md:p-5" style={{ background: 'linear-gradient(180deg, #080c12 0%, #0a0e15 50%, #090d13 100%)' }}>
        <div className="max-w-7xl mx-auto space-y-3">
          {/* ── Header ────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/With%20Border/OEC%20Border.png"
                alt="OEC"
                className="w-8 h-8 rounded-full"
              />
              <h1 className="text-xl font-bold text-white">
                Oeconomia DAO{" "}
                <span className="text-gray-400 font-normal">Analytics Dashboard</span>
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Date Range */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 bg-[#161b22] text-gray-300 hover:bg-[#1c2128] hover:text-white text-xs rounded-lg"
                  onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
                >
                  {dateRange}
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
                {dateDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 z-50 bg-[#161b22] border border-gray-700 rounded-lg shadow-xl py-1 w-full">
                    {DATE_RANGES.map((r) => (
                      <button
                        key={r}
                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-700/50 transition-colors ${
                          dateRange === r ? "text-cyan-400" : "text-gray-300"
                        }`}
                        onClick={() => {
                          setDateRange(r);
                          setDateDropdownOpen(false);
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Protocol Filters */}
              <div className="flex gap-1 bg-[#161b22] rounded-lg p-0.5 border border-gray-800/60">
                {PROTOCOLS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setActiveProtocol(p)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all duration-150 ${
                      activeProtocol === p
                        ? "bg-cyan-600/80 text-white shadow-sm"
                        : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/40"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── KPI Cards + Charts ─────────────────────────── */}
          {activeProtocol === "All" ? (
            <>
              {/* All: 6 KPI cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                <KPICard label="Total TVL" value="$12.45M" change={3.2} />
                <KPICard label="24h Volume" value="$856K" change={3.1} />
                <KPICard label="Active Users" value="8,320" change={4.7} />
                <KPICard label="Fees / Revenue" value="$22,450" change={6.3} />
                <KPICard label="Average APY" value="7.8%" change={0.5} />
                <KPICard label="NFT Sales Volume" value="$124K" change={12.3} />
              </div>

              {/* All: 4 overview charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* TVL Stacked Area */}
                <ChartCard title="Total Value Locked">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={tvlData} margin={{ top: 0, right: 5, bottom: 0, left: -15 }}>
                      <defs>
                        <linearGradient id="gradStaking" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="gradDEX" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="gradBridge" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="gradLending" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="gradNFT" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ec4899" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#ec4899" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
                      <YAxis stroke="#6b7280" fontSize={10} tickLine={false} tickFormatter={(v) => `$${v}M`} />
                      <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => [`$${value.toFixed(2)}M`]} />
                      <Area type="monotone" dataKey="Staking" stackId="1" stroke="#06b6d4" fill="url(#gradStaking)" strokeWidth={1.5} />
                      <Area type="monotone" dataKey="DEX" stackId="1" stroke="#8b5cf6" fill="url(#gradDEX)" strokeWidth={1.5} />
                      <Area type="monotone" dataKey="Bridge" stackId="1" stroke="#f59e0b" fill="url(#gradBridge)" strokeWidth={1.5} />
                      <Area type="monotone" dataKey="Lending" stackId="1" stroke="#10b981" fill="url(#gradLending)" strokeWidth={1.5} />
                      <Area type="monotone" dataKey="NFT" stackId="1" stroke="#ec4899" fill="url(#gradNFT)" strokeWidth={1.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                  {/* Legend */}
                  <div className="flex flex-wrap gap-4 -mt-1 justify-start ml-[30px]">
                    {[
                      { name: "Staking", color: "#06b6d4" },
                      { name: "DEX", color: "#8b5cf6" },
                      { name: "Bridge", color: "#f59e0b" },
                      { name: "Lending", color: "#10b981" },
                      { name: "NFT", color: "#ec4899" },
                    ].map((item) => (
                      <div key={item.name} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-gray-400">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </ChartCard>

                {/* Volume & Fees */}
                <ChartCard title="Volume & Fees">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={volumeFeesData} margin={{ top: 0, right: 5, bottom: 0, left: -15 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
                      <YAxis yAxisId="left" stroke="#6b7280" fontSize={10} tickLine={false} tickFormatter={(v) => `$${v}K`} />
                      <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={10} tickLine={false} tickFormatter={(v) => `$${v}K`} />
                      <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number, name: string) => [
                        `$${value.toFixed(name === "fees" ? 1 : 0)}K`,
                        name === "fees" ? "Fees" : "Volume",
                      ]} />
                      <Bar yAxisId="left" dataKey="volume" fill="#8b5cf6" radius={[3, 3, 0, 0]} opacity={0.7} />
                      <Line yAxisId="right" type="monotone" dataKey="fees" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: "#10b981" }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* User Growth */}
                <ChartCard title="User Growth">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={userGrowthData} margin={{ top: 0, right: 5, bottom: 0, left: -15 }}>
                      <defs>
                        <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
                      <YAxis stroke="#6b7280" fontSize={10} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v} />
                      <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => [value.toLocaleString(), "Users"]} />
                      <Area type="monotone" dataKey="users" stroke="#6366f1" fill="url(#gradUsers)" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: "#6366f1" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* NFT Marketplace Stats */}
                <ChartCard title="NFT Marketplace Stats">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={nftData} margin={{ top: 0, right: 5, bottom: 0, left: -15 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
                      <YAxis yAxisId="left" stroke="#6b7280" fontSize={10} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={10} tickLine={false} tickFormatter={(v) => `${v} ETH`} />
                      <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number, name: string) => {
                        if (name === "floorPrice") return [`${value} ETH`, "Floor Price"];
                        if (name === "sales") return [value, "Sales"];
                        return [value, "Unique Buyers"];
                      }} />
                      <Bar yAxisId="left" dataKey="sales" fill="#f59e0b" radius={[3, 3, 0, 0]} opacity={0.7} />
                      <Bar yAxisId="left" dataKey="buyers" fill="#06b6d4" radius={[3, 3, 0, 0]} opacity={0.7} />
                      <Line yAxisId="right" type="monotone" dataKey="floorPrice" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: "#10b981" }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </>
          ) : (
            <>
              {/* Protocol-specific: 4 KPI cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {getProtocolKPIs(activeProtocol, protocolDataMap[activeProtocol] || []).map((kpi) => (
                  <KPICard key={kpi.label} label={kpi.label} value={kpi.value} change={kpi.change} />
                ))}
              </div>

              {/* Protocol-specific: 4 charts */}
              {activeProtocol === "Staking" && renderStakingCharts(stakingData)}
              {activeProtocol === "DEX" && renderDEXCharts(dexData)}
              {activeProtocol === "Bridge" && renderBridgeCharts(bridgeData)}
              {activeProtocol === "Lending" && renderLendingCharts(lendingData)}
              {activeProtocol === "NFT" && renderNFTCharts(nftDetailData)}
            </>
          )}

          {/* ── Protocol Breakdown Table ───────────────────────── */}
          <Card className="border border-gray-800/60 bg-[#0b0f16] rounded-lg shadow-md shadow-black/50 overflow-hidden">
            <div className="p-5 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300">Protocol Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    {[
                      { key: "name", label: "Protocol" },
                      { key: "tvl", label: "TVL" },
                      { key: "volume", label: "Volume (24h)" },
                      { key: "users", label: "Users" },
                      { key: "fees", label: "Fees (24h)" },
                      { key: "apy", label: "APY" },
                      { key: "change", label: "Change (7d)" },
                    ].map((col) => (
                      <th
                        key={col.key}
                        className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors select-none"
                        onClick={() => handleSort(col.key)}
                      >
                        {col.label}
                        <SortIcon col={col.key} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedTableData.map((row, i) => {
                    // Map table row names back to protocol filter values
                    const rowToProtocol: Record<string, Protocol> = {
                      "Staking": "Staking",
                      "DEX/Eloqura": "DEX",
                      "Bridge": "Bridge",
                      "Lending/Alluria": "Lending",
                      "NFT/Artivya": "NFT",
                    };
                    return (
                      <tr
                        key={row.name}
                        className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors duration-150 cursor-pointer"
                        onClick={() => {
                          const protocol = rowToProtocol[row.name];
                          if (protocol) setActiveProtocol(protocol);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <td className="px-5 py-4 font-medium text-white">{row.name}</td>
                        <td className="px-5 py-4 text-gray-300">{row.tvl}</td>
                        <td className="px-5 py-4 text-gray-300">{row.volume}</td>
                        <td className="px-5 py-4 text-gray-300">{row.users.toLocaleString()}</td>
                        <td className="px-5 py-4 text-gray-300">{row.fees}</td>
                        <td className="px-5 py-4 text-gray-300">{row.apy}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`flex items-center gap-1 text-xs font-semibold ${
                              row.change >= 0 ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            {row.change >= 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {row.change >= 0 ? "+" : ""}
                            {row.change.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
