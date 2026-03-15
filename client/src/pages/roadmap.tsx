import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Flag,
  Rocket,
  Target,
} from "lucide-react";

// ---------- Protocol data (order matches ecosystem sidebar) ----------

interface Milestone {
  title: string;
  status: "done" | "in-progress" | "upcoming";
}

interface Protocol {
  name: string;
  slug: string;
  url: string;
  logo: string;
  accent: string;
  accent2: string;
  description: string;
  milestones: Milestone[];
}

const PROTOCOLS: Protocol[] = [
  {
    name: "OEC Pantheon",
    slug: "pantheon",
    url: "https://oeconomia.io",
    logo: "/ecosystem/oec.png",
    accent: "#06b6d4",
    accent2: "#a855f7",
    description: "Central dashboard for the Oeconomia ecosystem",
    milestones: [
      { title: "Dashboard with portfolio metrics & token price tracking", status: "done" },
      { title: "Analytics page with TVL, volume, and user growth charts", status: "done" },
      { title: "Portfolio tracker with cross-protocol holdings", status: "done" },
      { title: "Ecosystem directory with all protocol detail pages", status: "done" },
      { title: "Presale page with OEC token sale interface", status: "done" },
      { title: "Learn center with guides and documentation links", status: "done" },
      { title: "Live token price feeds (OEC, ELOQ, ALUR, ALUD)", status: "done" },
      { title: "Disclaimer modal and under-development notices", status: "done" },
      { title: "Roadmap & milestones page", status: "done" },
      { title: "Real-time cross-protocol analytics (live data)", status: "upcoming" },
    ],
  },
  {
    name: "OEC Staking",
    slug: "staking",
    url: "https://staking.oeconomia.io",
    logo: "/ecosystem/stake.png",
    accent: "#06b6d4",
    accent2: "#2563eb",
    description: "Multi-pool staking with competitive APR and flexible lock periods",
    milestones: [
      { title: "Multi-pool staking contract (V2) deployed on Sepolia", status: "done" },
      { title: "Stake, withdraw, and early withdrawal with penalty", status: "done" },
      { title: "Claim rewards and claim & restake (auto-compound)", status: "done" },
      { title: "Interactive rewards calculator with stacked bar chart", status: "done" },
      { title: "Achievement system with on-chain milestone rewards", status: "done" },
      { title: "Admin panel — pool management, APR updates, pause/unpause", status: "done" },
      { title: "Admin reward pool funding with low-balance warnings", status: "done" },
      { title: "OEC testnet faucet with 24-hour cooldown", status: "done" },
      { title: "Environment variable system for mainnet deployment", status: "done" },
      { title: "On-chain error decoding and transaction history", status: "done" },
      { title: "Deploy to Base mainnet", status: "upcoming" },
    ],
  },
  {
    name: "Eloqura",
    slug: "eloqura",
    url: "https://eloqura.oeconomia.io",
    logo: "/ecosystem/eloqura.png",
    accent: "#3b82f6",
    accent2: "#8b5cf6",
    description: "Decentralized exchange with AMM V2 liquidity pools",
    milestones: [
      { title: "AMM V2 Factory & Router contracts deployed on Sepolia", status: "done" },
      { title: "Token swap interface with multi-hop routing", status: "done" },
      { title: "Add/remove liquidity with pool management", status: "done" },
      { title: "Custom token import via contract address", status: "done" },
      { title: "Pool explorer with reserve and price data", status: "done" },
      { title: "Uniswap V3 Quoter integration for price comparison", status: "done" },
      { title: "Admin panel for pool oversight", status: "done" },
      { title: "Cross-chain swap integration (LI.FI / Squid)", status: "upcoming" },
      { title: "Deploy to Base mainnet", status: "upcoming" },
    ],
  },
  {
    name: "Alluria",
    slug: "alluria",
    url: "https://alluria.oeconomia.io",
    logo: "https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/With%20Border/ALUR%20With%20Border.png",
    accent: "#f59e0b",
    accent2: "#ef4444",
    description: "Decentralized lending and borrowing protocol",
    milestones: [
      { title: "Protocol site deployed with lending/borrowing UI", status: "done" },
      { title: "Collateral deposit and ALUD stablecoin minting", status: "done" },
      { title: "Stability Pool for yield earning", status: "done" },
      { title: "ALUR staking for fee revenue", status: "done" },
      { title: "Liquidation engine and risk parameters", status: "upcoming" },
      { title: "Deploy to Base mainnet", status: "upcoming" },
    ],
  },
  {
    name: "Artivya",
    slug: "artivya",
    url: "https://artivya.oeconomia.io",
    logo: "/ecosystem/art.png",
    accent: "#ec4899",
    accent2: "#f43f5e",
    description: "Decentralized marketplace for digital art and NFTs",
    milestones: [
      { title: "Marketplace site deployed with gallery UI", status: "done" },
      { title: "NFT minting and listing interface", status: "done" },
      { title: "Built-in royalty support for creators", status: "done" },
      { title: "Collection pages and artist profiles", status: "upcoming" },
      { title: "Auction system with bidding", status: "upcoming" },
      { title: "Deploy to Base mainnet", status: "upcoming" },
    ],
  },
  {
    name: "Iridescia",
    slug: "iridescia",
    url: "https://iridescia.oeconomia.io",
    logo: "/ecosystem/ill.png",
    accent: "#8b5cf6",
    accent2: "#6366f1",
    description: "Structured DeFi products — vaults, yield strategies, and risk-managed investments",
    milestones: [
      { title: "Protocol site deployed with vault interface", status: "done" },
      { title: "Yield strategy framework and vault architecture", status: "done" },
      { title: "Risk-managed investment options UI", status: "done" },
      { title: "Automated vault strategies with rebalancing", status: "upcoming" },
      { title: "Deploy to Base mainnet", status: "upcoming" },
    ],
  },
  {
    name: "Governance",
    slug: "governance",
    url: "https://governance.oeconomia.io",
    logo: "/ecosystem/governance.png",
    accent: "#10b981",
    accent2: "#059669",
    description: "DAO governance — proposals, voting, and protocol upgrades",
    milestones: [
      { title: "Governance portal deployed", status: "done" },
      { title: "Proposal submission and display interface", status: "done" },
      { title: "Voting mechanism with OEC token weight", status: "done" },
      { title: "On-chain proposal execution", status: "upcoming" },
      { title: "Delegation and vote history", status: "upcoming" },
    ],
  },
  {
    name: "OECsplorer",
    slug: "oecsplorer",
    url: "https://oecsplorer.oeconomia.io",
    logo: "https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/images/Globe%20White.png",
    accent: "#c0a44c",
    accent2: "#ffffff",
    description: "Protocol-aware blockchain explorer for the Oeconomia ecosystem",
    milestones: [
      { title: "Explorer site deployed with transaction search", status: "done" },
      { title: "Block and transaction detail pages", status: "done" },
      { title: "Protocol-aware labeling (Eloqura, Alluria, Staking)", status: "done" },
      { title: "PostgreSQL indexer with polling sync", status: "done" },
      { title: "Address page with balance and transaction history", status: "done" },
      { title: "Contract verification and source display", status: "upcoming" },
      { title: "Deploy to Base mainnet", status: "upcoming" },
    ],
  },
];

// ---------- Helpers ----------

function countByStatus(milestones: Milestone[], status: string) {
  return milestones.filter((m) => m.status === status).length;
}

function progressPercent(milestones: Milestone[]) {
  if (milestones.length === 0) return 0;
  return Math.round((countByStatus(milestones, "done") / milestones.length) * 100);
}

// ---------- Protocol card ----------

function ProtocolSection({ protocol }: { protocol: Protocol }) {
  const [expanded, setExpanded] = useState(true);
  const done = countByStatus(protocol.milestones, "done");
  const total = protocol.milestones.length;
  const pct = progressPercent(protocol.milestones);

  return (
    <Card className="crypto-card border bg-[#030712] overflow-hidden">
      {/* Header bar with accent gradient */}
      <div
        className="h-1"
        style={{ background: `linear-gradient(90deg, ${protocol.accent}, ${protocol.accent2})` }}
      />

      <div className="p-4 sm:p-5">
        {/* Title row */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <img
              src={protocol.logo}
              alt={protocol.name}
              className="w-8 h-8 rounded-full object-cover border border-white/10"
            />
            <div className="text-left">
              <h3 className="text-base font-semibold">{protocol.name}</h3>
              <p className="text-xs text-gray-500">{protocol.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium" style={{ color: protocol.accent }}>
              {done}/{total}
            </span>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
            )}
          </div>
        </button>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${protocol.accent}, ${protocol.accent2})`,
            }}
          />
        </div>

        {/* Milestones list */}
        {expanded && (
          <ul className="mt-4 space-y-2">
            {protocol.milestones.map((m, i) => (
              <li key={i} className="flex items-start gap-2.5">
                {m.status === "done" ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-400" />
                ) : m.status === "in-progress" ? (
                  <Circle className="w-4 h-4 mt-0.5 flex-shrink-0 text-yellow-400 animate-pulse" />
                ) : (
                  <Circle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-600" />
                )}
                <span
                  className={`text-sm ${
                    m.status === "done"
                      ? "text-gray-300"
                      : m.status === "in-progress"
                        ? "text-yellow-300"
                        : "text-gray-500"
                  }`}
                >
                  {m.title}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

// ---------- Main page ----------

export default function Roadmap() {
  const allMilestones = PROTOCOLS.flatMap((p) => p.milestones);
  const totalDone = countByStatus(allMilestones, "done");
  const totalUpcoming = countByStatus(allMilestones, "upcoming");
  const totalAll = allMilestones.length;
  const overallPct = progressPercent(allMilestones);

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flag className="w-6 h-6 text-cyan-400" />
            Roadmap & Milestones
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Track development progress across the Oeconomia ecosystem
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="crypto-card p-4 border text-center">
            <p className="text-2xl font-bold text-white">{PROTOCOLS.length}</p>
            <p className="text-xs text-gray-400">Protocols</p>
          </Card>
          <Card className="crypto-card p-4 border text-center">
            <p className="text-2xl font-bold text-green-400">{totalDone}</p>
            <p className="text-xs text-gray-400">Completed</p>
          </Card>
          <Card className="crypto-card p-4 border text-center">
            <p className="text-2xl font-bold text-gray-500">{totalUpcoming}</p>
            <p className="text-xs text-gray-400">Upcoming</p>
          </Card>
          <Card className="crypto-card p-4 border text-center">
            <div className="flex items-center justify-center gap-1.5">
              <p className="text-2xl font-bold" style={{ color: "#06b6d4" }}>
                {overallPct}%
              </p>
            </div>
            <p className="text-xs text-gray-400">Overall Progress</p>
          </Card>
        </div>

        {/* Overall progress bar */}
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${overallPct}%`,
              background: "linear-gradient(90deg, #06b6d4, #a855f7, #ff00ff)",
            }}
          />
        </div>

        {/* Protocol sections */}
        <div className="space-y-4">
          {PROTOCOLS.map((p) => (
            <ProtocolSection key={p.slug} protocol={p} />
          ))}
        </div>

        {/* Bottom legend */}
        <div className="flex items-center gap-6 text-xs text-gray-500 pt-2">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Circle className="w-3.5 h-3.5 text-yellow-400" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Circle className="w-3.5 h-3.5 text-gray-600" />
            <span>Upcoming</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
