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
    <Card className="p-4 border border-gray-800/60 bg-[#0b0f16] rounded-lg shadow-md shadow-black/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-white/[0.01] to-transparent pointer-events-none" />
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

  // Sort table data
  const sortedTableData = useMemo(() => {
    const data = [...PROTOCOL_TABLE_DATA];
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
  }, [sortCol, sortAsc]);

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

          {/* ── KPI Cards ─────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <KPICard label="Total TVL" value="$12.45M" change={3.2} />
            <KPICard label="24h Volume" value="$856K" change={3.1} />
            <KPICard label="Active Users" value="8,320" change={4.7} />
            <KPICard label="Fees / Revenue" value="$22,450" change={6.3} />
            <KPICard label="Average APY" value="7.8%" change={0.5} />
            <KPICard label="NFT Sales Volume" value="$124K" change={12.3} />
          </div>

          {/* ── Charts Grid (2×2) ─────────────────────────────── */}
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
                  {sortedTableData.map((row, i) => (
                    <tr
                      key={row.name}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors duration-150"
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
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
