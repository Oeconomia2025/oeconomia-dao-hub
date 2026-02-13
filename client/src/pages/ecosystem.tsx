import { useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ExternalLink,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// Protocol definitions
const protocols = [
  {
    slug: "staking",
    name: "OEC Staking",
    description: "Stake OEC tokens to earn yield and secure the network. Flexible and locked staking options with competitive APY.",
    category: "Staking",
    gradient: "from-cyan-500 to-blue-600",
    gradientCSS: "linear-gradient(135deg, #06b6d4, #2563eb)",
    accentColor: "#06b6d4",
    accentColor2: "#2563eb",
    borderColor: "#9ca3af",
    pillColor: "#9ca3af",
    logo: "/ecosystem/stake.png",
    url: "https://staking.oeconomia.io",
    tvl: "$2,400,000",
    users: "1,247",
    apy: "12.5%",
    volume24h: "$185,000",
  },
  {
    slug: "eloqura",
    name: "Eloqura",
    description: "Decentralized exchange with deep liquidity pools, token swaps, and yield farming across multiple trading pairs.",
    category: "DEX",
    gradient: "from-purple-500 to-pink-500",
    gradientCSS: "linear-gradient(135deg, #a855f7, #ec4899)",
    accentColor: "#a855f7",
    accentColor2: "#ec4899",
    borderColor: "linear-gradient(90deg, #c084fc, #22d3ee)",
    pillColor: "#c084fc",
    logo: "/ecosystem/eloqura.png",
    url: "https://eloqura.oeconomia.io",
    tvl: "$5,100,000",
    users: "3,892",
    apy: "18.2%",
    volume24h: "$720,000",
  },
  {
    slug: "alluria",
    name: "Alluria",
    description: "Collateralized lending protocol. Deposit assets as collateral and borrow ALUD stablecoin at low interest rates.",
    category: "Lending",
    gradient: "from-green-500 to-teal-500",
    gradientCSS: "linear-gradient(135deg, #22c55e, #14b8a6)",
    accentColor: "#22c55e",
    accentColor2: "#14b8a6",
    borderColor: "#c08050",
    pillColor: "#c08050",
    logo: "/ecosystem/alur.png",
    url: "https://alluria.oeconomia.io",
    tvl: "$3,800,000",
    users: "2,156",
    apy: "8.7%",
    volume24h: "$430,000",
  },
  {
    slug: "artivya",
    name: "Artivya",
    description: "NFT marketplace and creator platform. Mint, trade, and showcase digital art with built-in royalty enforcement.",
    category: "NFT",
    gradient: "from-orange-500 to-red-500",
    gradientCSS: "linear-gradient(135deg, #f97316, #ef4444)",
    accentColor: "#f97316",
    accentColor2: "#ef4444",
    borderColor: "linear-gradient(90deg, #8b5cf6, #22d3ee)",
    pillColor: "#22d3ee",
    logo: "/ecosystem/art.png",
    url: "https://artivya.oeconomia.io",
    tvl: "$890,000",
    users: "5,340",
    apy: "—",
    volume24h: "$95,000",
  },
  {
    slug: "iridescia",
    name: "Iridescia",
    description: "Advanced DeFi aggregator with yield optimization, auto-compounding vaults, and cross-protocol strategies.",
    category: "DeFi",
    gradient: "from-pink-500 to-violet-500",
    gradientCSS: "linear-gradient(135deg, #ec4899, #8b5cf6)",
    accentColor: "#ec4899",
    accentColor2: "#8b5cf6",
    borderColor: "linear-gradient(90deg, #f9a8d4, #99f6e4, #fcd6bb)",
    pillColor: "#f9a8d4",
    logo: "/ecosystem/ill.png",
    url: "https://iridescia.oeconomia.io",
    tvl: "$1,600,000",
    users: "982",
    apy: "22.4%",
    volume24h: "$210,000",
  },
];

// Chart styling
const chartTooltipStyle = {
  backgroundColor: "#1F2937",
  border: "1px solid #374151",
  borderRadius: "8px",
  color: "#F9FAFB",
  fontSize: "12px",
};

const detailTooltipStyle = {
  backgroundColor: "#0d1219",
  border: "1px solid #1e2733",
  borderRadius: "6px",
  color: "#e6edf3",
  fontSize: "12px",
};

const chartMargin = { top: 10, right: 10, bottom: 0, left: -15 };

// Mock data generators
function generateTVLData() {
  const base = 1000000 + Math.random() * 4000000;
  return Array.from({ length: 30 }, (_, i) => ({
    day: `Day ${i + 1}`,
    tvl: base + (base * 0.4 * (i / 30)) + (Math.random() - 0.3) * base * 0.08,
  }));
}

function generateVolumeData() {
  return Array.from({ length: 14 }, (_, i) => ({
    day: `Day ${i + 1}`,
    volume: 50000 + Math.random() * 200000,
  }));
}

function generateUsersData() {
  const base = 50 + Math.floor(Math.random() * 100);
  return Array.from({ length: 30 }, (_, i) => ({
    day: `Day ${i + 1}`,
    users: base + Math.floor(i * 2.5) + Math.floor(Math.random() * 20),
  }));
}

function generateRevenueData() {
  return Array.from({ length: 14 }, (_, i) => ({
    day: `Day ${i + 1}`,
    fees: 500 + Math.random() * 3000,
    rewards: 200 + Math.random() * 1500,
  }));
}

// Protocol card for overview grid
function ProtocolCard({ protocol, onClick }: { protocol: typeof protocols[0]; onClick: () => void }) {
  return (
    <Card
      className="group cursor-pointer border border-gray-700 bg-[#030712] transition-all duration-300 hover:shadow-lg hover:shadow-black/30 overflow-hidden rounded-lg"
      onClick={onClick}
    >
      <div className="px-5 py-3 flex items-center gap-5">
        {/* Left: Logo + Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-[72px] h-[72px] rounded-xl overflow-hidden flex-shrink-0 border border-gray-700/50">
            <img src={protocol.logo} alt={protocol.name} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-2xl font-bold text-white group-hover:text-gray-100">{protocol.name}</h3>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                style={{
                  background: `${protocol.pillColor}20`,
                  color: protocol.pillColor,
                  border: `1px solid ${protocol.pillColor}40`,
                }}
              >
                {protocol.category}
              </span>
            </div>
            <p className="text-sm text-gray-400 line-clamp-1">{protocol.description}</p>
          </div>
        </div>

        {/* Right: TVL + Users stacked */}
        <div className="flex flex-col gap-1.5 flex-shrink-0" style={{ minWidth: "240px" }}>
          <div className="border border-gray-800/60 bg-[#0b0f16] hover:border-gray-700 transition-all duration-200 shadow-md shadow-black/50 rounded-lg px-4 py-1.5 text-right">
            <p className="text-xs text-white leading-tight">TVL</p>
            <p className="text-lg font-semibold text-white leading-tight">{protocol.tvl}</p>
          </div>
          <div className="border border-gray-800/60 bg-[#0b0f16] hover:border-gray-700 transition-all duration-200 shadow-md shadow-black/50 rounded-lg px-4 py-1.5 text-right">
            <p className="text-xs text-white leading-tight">Users</p>
            <p className="text-lg font-semibold text-white leading-tight">{protocol.users}</p>
          </div>
        </div>

        {/* Click indicator */}
        <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white flex-shrink-0 transition-colors duration-200" />
      </div>

      {/* Bottom accent */}
      <div className="h-1 w-full" style={{ background: protocol.borderColor }} />
    </Card>
  );
}

// Detail view for a single protocol
function ProtocolDetail({ protocol }: { protocol: typeof protocols[0] }) {
  const [, navigate] = useLocation();

  const tvlData = useMemo(() => generateTVLData(), [protocol.slug]);
  const volumeData = useMemo(() => generateVolumeData(), [protocol.slug]);
  const usersData = useMemo(() => generateUsersData(), [protocol.slug]);
  const revenueData = useMemo(() => generateRevenueData(), [protocol.slug]);

  const kpis = [
    { label: "Total Value Locked", value: protocol.tvl, change: 12.3 },
    { label: "Active Users", value: protocol.users, change: 8.1 },
    { label: "24h Volume", value: protocol.volume24h, change: 5.7 },
    { label: "APY", value: protocol.apy, change: protocol.apy === "—" ? 0 : 2.1 },
  ];

  return (
    <div className="p-4 md:p-5" style={{ background: 'linear-gradient(180deg, #080c12 0%, #0a0e15 50%, #090d13 100%)' }}>
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Back button + header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/ecosystem")}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-700/50">
              <img src={protocol.logo} alt={protocol.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                {protocol.name}{" "}
                <span className="text-gray-400 font-normal">Protocol Analytics</span>
              </h1>
              <p className="text-sm text-gray-400">{protocol.description}</p>
            </div>
          </div>
          <a
            href={protocol.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: protocol.gradientCSS }}
          >
            Visit dApp <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {kpis.map((kpi) => {
            const isPositive = kpi.change >= 0;
            return (
              <Card
                key={kpi.label}
                className="p-4 border border-gray-800/60 bg-[#0b0f16] hover:border-gray-700 transition-all duration-200 shadow-md shadow-black/50 rounded-lg relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-white/[0.01] to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <p className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wide">{kpi.label}</p>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-white">{kpi.value}</span>
                    {kpi.change !== 0 && (
                      <span
                        className={`text-xs font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded ${
                          isPositive
                            ? "text-emerald-400 bg-emerald-500/10"
                            : "text-red-400 bg-red-500/10"
                        }`}
                      >
                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {isPositive ? "+" : ""}{kpi.change.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* TVL over time - Area Chart */}
          <Card className="p-4 border border-gray-700 bg-[#030712] rounded-lg shadow-md shadow-black/50">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Total Value Locked (30d)</h3>
            <div className="h-[205px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tvlData} margin={chartMargin}>
                  <defs>
                    <linearGradient id={`tvl-${protocol.slug}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={protocol.accentColor} stopOpacity={0.6} />
                      <stop offset="100%" stopColor={protocol.accentColor} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#6b7280" fontSize={10} tickLine={false} interval={6} />
                  <YAxis stroke="#6b7280" fontSize={10} tickLine={false} tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} />
                  <Tooltip contentStyle={detailTooltipStyle} formatter={(v: number) => [`$${(v / 1e6).toFixed(2)}M`, "TVL"]} />
                  <Area type="monotone" dataKey="tvl" stroke={protocol.accentColor} strokeWidth={2} fill={`url(#tvl-${protocol.slug})`} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Volume - Bar Chart */}
          <Card className="p-4 border border-gray-700 bg-[#030712] rounded-lg shadow-md shadow-black/50">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Daily Volume (14d)</h3>
            <div className="h-[205px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData} margin={chartMargin}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#6b7280" fontSize={10} tickLine={false} interval={2} />
                  <YAxis stroke="#6b7280" fontSize={10} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={detailTooltipStyle} formatter={(v: number) => [`$${(v / 1000).toFixed(1)}K`, "Volume"]} />
                  <Bar dataKey="volume" fill={protocol.accentColor2} radius={[3, 3, 0, 0]} opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Users growth - Line Chart */}
          <Card className="p-4 border border-gray-700 bg-[#030712] rounded-lg shadow-md shadow-black/50">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Active Users (30d)</h3>
            <div className="h-[205px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={usersData} margin={chartMargin}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#6b7280" fontSize={10} tickLine={false} interval={6} />
                  <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={detailTooltipStyle} formatter={(v: number) => [v.toLocaleString(), "Users"]} />
                  <Line type="monotone" dataKey="users" stroke={protocol.accentColor} strokeWidth={2} dot={false} activeDot={{ r: 3, fill: protocol.accentColor }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Revenue breakdown - Composed Chart */}
          <Card className="p-4 border border-gray-700 bg-[#030712] rounded-lg shadow-md shadow-black/50">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Revenue Breakdown (14d)</h3>
            <div className="h-[205px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revenueData} margin={chartMargin}>
                  <defs>
                    <linearGradient id={`fees-${protocol.slug}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={protocol.accentColor} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={protocol.accentColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#6b7280" fontSize={10} tickLine={false} interval={2} />
                  <YAxis stroke="#6b7280" fontSize={10} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}K`} />
                  <Tooltip contentStyle={detailTooltipStyle} formatter={(v: number) => [`$${v.toFixed(0)}`, undefined]} />
                  <Area type="monotone" dataKey="fees" stroke={protocol.accentColor} fill={`url(#fees-${protocol.slug})`} strokeWidth={2} name="Fees" />
                  <Line type="monotone" dataKey="rewards" stroke={protocol.accentColor2} strokeWidth={2} dot={false} name="Rewards" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Main Ecosystem page
export default function Ecosystem() {
  const [, navigate] = useLocation();
  const [matched, params] = useRoute("/ecosystem/:protocol");
  const selectedSlug = matched ? params?.protocol : null;
  const selectedProtocol = selectedSlug ? protocols.find((p) => p.slug === selectedSlug) : null;

  return (
    <Layout>
      {selectedProtocol ? (
        <ProtocolDetail protocol={selectedProtocol} />
      ) : (
        <div className="p-4 md:p-5" style={{ background: 'linear-gradient(180deg, #080c12 0%, #0a0e15 50%, #090d13 100%)' }}>
          <div className="max-w-7xl mx-auto space-y-3">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-white">Oeconomia Ecosystem</h1>
            <p className="text-sm text-gray-400 mt-1">
              Explore the protocols powering the Oeconomia DeFi ecosystem
            </p>
          </div>

          {/* Protocol list */}
          <div className="flex flex-col gap-3">
            {protocols.map((protocol) => (
              <ProtocolCard
                key={protocol.slug}
                protocol={protocol}
                onClick={() => navigate(`/ecosystem/${protocol.slug}`)}
              />
            ))}
          </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
