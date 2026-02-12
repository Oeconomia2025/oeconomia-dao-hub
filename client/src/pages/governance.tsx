import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Vote,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Clock3,
  TrendingUp,
  FileText,
  Plus,
  Eye,
  MessageSquare,
  ArrowRight,
  Shield,
  Coins,
  Target,
  Activity,
  BarChart3,
  User,
  UserCheck,
  ExternalLink,
  AlertCircle,
  Info,
  CheckCheck,
  X,
  Hash,
  Timer,
  Zap
} from "lucide-react";
import { useAccount } from "wagmi";
import { WalletConnect } from "@/components/wallet-connect"
import { WalletSetupGuide } from "@/components/wallet-setup-guide";

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: 'active' | 'passed' | 'defeated' | 'queued' | 'executed' | 'cancelled';
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  totalVotes: number;
  quorum: number;
  startTime: string;
  endTime: string;
  executionTime?: string;
  category: 'treasury' | 'protocol' | 'meta' | 'grants';
  actions: {
    target: string;
    value: string;
    signature: string;
    calldata: string;
    description: string;
  }[];
}

interface DelegateProfile {
  address: string;
  name: string;
  votingPower: number;
  proposalsVoted: number;
  participationRate: number;
  statement: string;
  twitter?: string;
  website?: string;
  delegators: number;
}

interface GovernanceStats {
  totalProposals: number;
  activeProposals: number;
  totalVotingPower: number;
  participationRate: number;
  treasuryValue: string;
  activeDelegates: number;
}

// Mock data for development
const mockProposals: Proposal[] = [
  {
    id: "prop-001",
    title: "OIP-1: Increase Staking Rewards Pool",
    description: "Proposal to increase the staking rewards pool by 25% to incentivize more participation in network security. This would allocate an additional 1M OEC tokens to the rewards pool over the next 6 months.",
    proposer: "0x1234...5678",
    status: "active",
    votesFor: 2500000,
    votesAgainst: 150000,
    votesAbstain: 75000,
    totalVotes: 2725000,
    quorum: 4000000,
    startTime: "2025-01-20T10:00:00Z",
    endTime: "2025-01-27T10:00:00Z",
    category: "protocol",
    actions: [
      {
        target: "0xStakingContract",
        value: "0",
        signature: "setRewardRate(uint256)",
        calldata: "0x1234...",
        description: "Increase staking reward rate to 15%"
      }
    ]
  },
  {
    id: "prop-002", 
    title: "OIP-2: Treasury Diversification Strategy",
    description: "Diversify the DAO treasury by allocating 30% to stablecoins, 20% to blue-chip assets (ETH, BTC), and maintaining 50% in OEC tokens. This will reduce volatility risk while maintaining upside exposure.",
    proposer: "0x9876...5432",
    status: "passed",
    votesFor: 4200000,
    votesAgainst: 800000,
    votesAbstain: 150000,
    totalVotes: 5150000,
    quorum: 4000000,
    startTime: "2025-01-13T10:00:00Z",
    endTime: "2025-01-20T10:00:00Z",
    executionTime: "2025-01-22T10:00:00Z",
    category: "treasury",
    actions: [
      {
        target: "0xTreasury",
        value: "1000000000000000000000000",
        signature: "diversifyTreasury(address[],uint256[])",
        calldata: "0x5678...",
        description: "Execute treasury diversification"
      }
    ]
  },
  {
    id: "prop-003",
    title: "OIP-3: Developer Grant Program",
    description: "Establish a quarterly developer grant program with 500K OEC tokens to fund ecosystem development. Priority given to DeFi, gaming, and infrastructure projects building on Oeconomia.",
    proposer: "0x5555...9999",
    status: "queued",
    votesFor: 3800000,
    votesAgainst: 200000,
    votesAbstain: 100000,
    totalVotes: 4100000,
    quorum: 4000000,
    startTime: "2025-01-06T10:00:00Z",
    endTime: "2025-01-13T10:00:00Z",
    executionTime: "2025-01-25T10:00:00Z",
    category: "grants",
    actions: [
      {
        target: "0xGrantsContract",
        value: "0",
        signature: "createGrantProgram(uint256,uint256)",
        calldata: "0x9abc...",
        description: "Create quarterly grant program"
      }
    ]
  }
];

const mockDelegates: DelegateProfile[] = [
  {
    address: "0x1111...aaaa",
    name: "EcoBuilder",
    votingPower: 1250000,
    proposalsVoted: 47,
    participationRate: 94,
    statement: "Focus on sustainable ecosystem growth and developer onboarding. I vote for proposals that strengthen long-term value creation.",
    twitter: "@ecobuilder",
    website: "ecobuilder.io",
    delegators: 234
  },
  {
    address: "0x2222...bbbb", 
    name: "DeFi Maxi",
    votingPower: 950000,
    proposalsVoted: 42,
    participationRate: 84,
    statement: "Specialized in DeFi protocol analysis and risk assessment. Committed to maintaining high security standards in governance decisions.",
    twitter: "@defimaxi",
    delegators: 189
  },
  {
    address: "0x3333...cccc",
    name: "Community Voice",
    votingPower: 800000,
    proposalsVoted: 50,
    participationRate: 100,
    statement: "Representing smaller token holders and community interests. Every proposal gets careful consideration and transparent explanation.",
    delegators: 156
  }
];

const mockStats: GovernanceStats = {
  totalProposals: 48,
  activeProposals: 3,
  totalVotingPower: 25000000,
  participationRate: 67,
  treasuryValue: "$12.5M",
  activeDelegates: 89
};

export function Governance() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState("proposals");
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [userVotingPower, setUserVotingPower] = useState(15000);
  const [userDelegatedTo, setUserDelegatedTo] = useState<string | null>(null);
  const [showCreateProposal, setShowCreateProposal] = useState(false);
  const [voteChoice, setVoteChoice] = useState<string>("");
  
  // Filter proposals by status
  const activeProposals = mockProposals.filter(p => p.status === 'active');
  const passedProposals = mockProposals.filter(p => p.status === 'passed' || p.status === 'queued' || p.status === 'executed');
  const failedProposals = mockProposals.filter(p => p.status === 'defeated' || p.status === 'cancelled');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-500';
      case 'passed': return 'bg-green-500';
      case 'defeated': return 'bg-red-500';
      case 'queued': return 'bg-yellow-500';
      case 'executed': return 'bg-purple-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'treasury': return <Coins className="w-4 h-4" />;
      case 'protocol': return <Shield className="w-4 h-4" />;
      case 'meta': return <Vote className="w-4 h-4" />;
      case 'grants': return <Target className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getTimeRemaining = (endTime: string): string => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return "Ended";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  if (!isConnected) {
    return (
      <Layout>
        <div className="p-4 md:p-5" style={{ background: 'linear-gradient(180deg, #080c12 0%, #0a0e15 50%, #090d13 100%)' }}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-16">
              <Vote className="w-16 h-16 text-cyan-400 mx-auto mb-6" />
              <p className="text-gray-400 mb-8">Connect your wallet to participate in Oeconomia governance</p>
              <div className="max-w-xs mx-auto">
                <WalletConnect />
                <WalletSetupGuide />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-5" style={{ background: 'linear-gradient(180deg, #080c12 0%, #0a0e15 50%, #090d13 100%)' }}>
        <div className="max-w-7xl mx-auto space-y-3">
          {/* Governance Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <Card className="p-4 border border-gray-800/60 bg-[#0b0f16] hover:border-gray-700 transition-all duration-200 shadow-md shadow-black/50 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-white/[0.01] to-transparent pointer-events-none" />
              <div className="relative z-10">
                <p className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wide">Total Proposals</p>
                <div className="text-2xl font-bold text-white">{mockStats.totalProposals}</div>
                <div className="text-xs text-gray-500 mt-1">{mockStats.activeProposals} active</div>
              </div>
            </Card>

            <Card className="p-4 border border-gray-800/60 bg-[#0b0f16] hover:border-gray-700 transition-all duration-200 shadow-md shadow-black/50 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-white/[0.01] to-transparent pointer-events-none" />
              <div className="relative z-10">
                <p className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wide">Voting Power</p>
                <div className="text-2xl font-bold text-white">{formatNumber(mockStats.totalVotingPower)}</div>
                <div className="text-xs text-gray-500 mt-1">{formatNumber(userVotingPower)} yours</div>
              </div>
            </Card>

            <Card className="p-4 border border-gray-800/60 bg-[#0b0f16] hover:border-gray-700 transition-all duration-200 shadow-md shadow-black/50 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-white/[0.01] to-transparent pointer-events-none" />
              <div className="relative z-10">
                <p className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wide">Participation</p>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold text-white">{mockStats.participationRate}%</span>
                  <span className="text-xs font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded text-emerald-400 bg-emerald-500/10">+3.2%</span>
                </div>
              </div>
            </Card>

            <Card className="p-4 border border-gray-800/60 bg-[#0b0f16] hover:border-gray-700 transition-all duration-200 shadow-md shadow-black/50 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-white/[0.01] to-transparent pointer-events-none" />
              <div className="relative z-10">
                <p className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wide">Treasury</p>
                <div className="text-2xl font-bold text-white">{mockStats.treasuryValue}</div>
                <div className="text-xs text-cyan-400 mt-1">Diversified</div>
              </div>
            </Card>

            <Card className="p-4 border border-gray-800/60 bg-[#0b0f16] hover:border-gray-700 transition-all duration-200 shadow-md shadow-black/50 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-white/[0.01] to-transparent pointer-events-none" />
              <div className="relative z-10">
                <p className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wide">Delegates</p>
                <div className="text-2xl font-bold text-white">{mockStats.activeDelegates}</div>
                <div className="text-xs text-gray-500 mt-1">Active participants</div>
              </div>
            </Card>

            <Card className="p-4 border border-gray-800/60 bg-[#0b0f16] hover:border-gray-700 transition-all duration-200 shadow-md shadow-black/50 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-white/[0.01] to-transparent pointer-events-none" />
              <div className="relative z-10">
                <p className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wide">Your Status</p>
                <div className="text-lg font-bold text-white">
                  {userDelegatedTo ? "Delegated" : "Self-voting"}
                </div>
                <div className="text-xs text-gray-500 mt-1">{formatNumber(userVotingPower)} power</div>
              </div>
            </Card>
          </div>

          {/* Main Governance Interface */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
              <div className="flex gap-1 bg-[#161b22] rounded-lg p-0.5 border border-gray-800/60">
                {["proposals", "delegates", "voting", "analytics"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all duration-150 capitalize ${
                      activeTab === tab
                        ? "bg-cyan-600/80 text-white shadow-sm"
                        : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/40"
                    }`}
                  >
                    {tab === "voting" ? "My Votes" : tab}
                  </button>
                ))}
              </div>

              <Button
                onClick={() => setShowCreateProposal(true)}
                size="sm"
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-xs"
              >
                <Plus className="w-3 h-3 mr-1.5" />
                Create Proposal
              </Button>
            </div>

            {/* Proposals Tab */}
            <TabsContent value="proposals">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Active Proposals */}
                <div className="lg:col-span-2">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Active Proposals</h3>
                    {activeProposals.map((proposal) => (
                      <Card key={proposal.id} className="border border-gray-800/60 bg-[#0b0f16] rounded-lg shadow-md shadow-black/50 cursor-pointer hover:border-gray-700 transition-all duration-200">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              {getCategoryIcon(proposal.category)}
                              <div>
                                <h4 className="font-semibold text-white">{proposal.title}</h4>
                                <p className="text-sm text-gray-400">
                                  by {formatAddress(proposal.proposer)} • {getTimeRemaining(proposal.endTime)}
                                </p>
                              </div>
                            </div>
                            <Badge className={`${getStatusColor(proposal.status)} text-white capitalize`}>
                              {proposal.status}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-300 mb-4 line-clamp-2">{proposal.description}</p>
                          
                          {/* Voting Progress */}
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">For: {formatNumber(proposal.votesFor)}</span>
                              <span className="text-gray-400">Against: {formatNumber(proposal.votesAgainst)}</span>
                            </div>
                            <Progress 
                              value={(proposal.votesFor / (proposal.votesFor + proposal.votesAgainst)) * 100} 
                              className="h-2 bg-gray-700"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Quorum: {formatNumber(proposal.totalVotes)}/{formatNumber(proposal.quorum)}</span>
                              <span>{Math.round((proposal.totalVotes / proposal.quorum) * 100)}%</span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedProposal(proposal)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                            
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => {setVoteChoice('for'); setSelectedProposal(proposal);}}
                              >
                                Vote For
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                                onClick={() => {setVoteChoice('against'); setSelectedProposal(proposal);}}
                              >
                                Vote Against
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {/* Past Proposals */}
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold text-white mb-4">Recent Decisions</h3>
                      <div className="space-y-3">
                        {passedProposals.slice(0, 3).map((proposal) => (
                          <Card key={proposal.id} className="border border-gray-800/60 bg-[#0b0f16] rounded-lg shadow-md shadow-black/50">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  {getCategoryIcon(proposal.category)}
                                  <div>
                                    <h5 className="font-medium text-white">{proposal.title}</h5>
                                    <p className="text-sm text-gray-400">
                                      {formatNumber(proposal.votesFor)} for • {formatNumber(proposal.votesAgainst)} against
                                    </p>
                                  </div>
                                </div>
                                <Badge className={`${getStatusColor(proposal.status)} text-white capitalize`}>
                                  {proposal.status}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-3">
                  {/* User Delegation Status */}
                  <Card className="border border-gray-800/60 bg-[#0b0f16] rounded-lg shadow-md shadow-black/50">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <UserCheck className="w-5 h-5" />
                        <span>Your Delegation</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {userDelegatedTo ? (
                        <div>
                          <p className="text-gray-300 mb-2">Delegated to:</p>
                          <p className="font-mono text-white mb-4">{formatAddress(userDelegatedTo)}</p>
                          <Button variant="outline" size="sm" className="w-full">
                            Change Delegate
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-gray-300 mb-4">You are self-voting with {formatNumber(userVotingPower)} voting power.</p>
                          <Button variant="outline" size="sm" className="w-full">
                            Delegate Votes
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick Stats */}
                  <Card className="border border-gray-800/60 bg-[#0b0f16] rounded-lg shadow-md shadow-black/50">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="w-5 h-5" />
                        <span>Governance Health</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Participation Rate</span>
                        <span className="text-white font-medium">{mockStats.participationRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Active Delegates</span>
                        <span className="text-white font-medium">{mockStats.activeDelegates}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Avg Vote Duration</span>
                        <span className="text-white font-medium">7 days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Success Rate</span>
                        <span className="text-green-400 font-medium">73%</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card className="border border-gray-800/60 bg-[#0b0f16] rounded-lg shadow-md shadow-black/50">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Activity className="w-5 h-5" />
                        <span>Recent Activity</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-gray-300">OIP-2 executed successfully</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Vote className="w-4 h-4 text-blue-500" />
                          <span className="text-gray-300">New vote on OIP-1</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Plus className="w-4 h-4 text-yellow-500" />
                          <span className="text-gray-300">OIP-4 proposal submitted</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-purple-500" />
                          <span className="text-gray-300">15 new delegations</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Delegates Tab */}
            <TabsContent value="delegates">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {mockDelegates.map((delegate) => (
                  <Card key={delegate.address} className="border border-gray-800/60 bg-[#0b0f16] rounded-lg shadow-md shadow-black/50 hover:border-gray-700 transition-all duration-200">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-white text-lg">{delegate.name}</h4>
                          <p className="text-sm text-gray-400 font-mono">{formatAddress(delegate.address)}</p>
                        </div>
                        <Badge variant="outline" className="text-cyan-400 border-cyan-400">
                          {formatNumber(delegate.votingPower)} VP
                        </Badge>
                      </div>
                      
                      <p className="text-gray-300 text-sm mb-4 line-clamp-3">{delegate.statement}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-gray-400">Participation</p>
                          <p className="text-white font-medium">{delegate.participationRate}%</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Proposals Voted</p>
                          <p className="text-white font-medium">{delegate.proposalsVoted}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Delegators</p>
                          <p className="text-white font-medium">{delegate.delegators}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Voting Power</p>
                          <p className="text-white font-medium">{formatNumber(delegate.votingPower)}</p>
                        </div>
                      </div>
                      
                      {/* Flexible space to push buttons to bottom */}
                      <div className="flex-grow"></div>
                      
                      <div className="space-y-3">
                        <div className="flex space-x-2 h-9">
                          {delegate.twitter && (
                            <Button variant="outline" size="sm" className="flex-1">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Twitter
                            </Button>
                          )}
                          {delegate.website && (
                            <Button variant="outline" size="sm" className="flex-1">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Website
                            </Button>
                          )}
                        </div>
                        
                        <Button className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
                          Delegate to {delegate.name}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* My Votes Tab */}
            <TabsContent value="voting">
              <Card className="border border-gray-800/60 bg-[#0b0f16] rounded-lg shadow-md shadow-black/50">
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <Vote className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Your Voting History</h3>
                    <p className="text-gray-400 mb-6">Track your participation in governance decisions</p>
                    <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
                      View Voting History
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <Card className="border border-gray-800/60 bg-[#0b0f16] rounded-lg shadow-md shadow-black/50">
                  <CardHeader>
                    <CardTitle>Proposal Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="text-4xl font-bold text-green-400 mb-2">73%</div>
                      <p className="text-gray-400">of proposals pass</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-800/60 bg-[#0b0f16] rounded-lg shadow-md shadow-black/50">
                  <CardHeader>
                    <CardTitle>Average Participation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="text-4xl font-bold text-blue-400 mb-2">{mockStats.participationRate}%</div>
                      <p className="text-gray-400">voter turnout</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Proposal Detail Modal */}
          {selectedProposal && (
            <Dialog open={!!selectedProposal} onOpenChange={() => setSelectedProposal(null)}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto border border-gray-800/60 bg-[#0b0f16] rounded-lg shadow-md shadow-black/50">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-3">
                    {getCategoryIcon(selectedProposal.category)}
                    <span>{selectedProposal.title}</span>
                    <Badge className={`${getStatusColor(selectedProposal.status)} text-white capitalize ml-auto`}>
                      {selectedProposal.status}
                    </Badge>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Proposal Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Proposer</p>
                      <p className="text-white font-mono">{formatAddress(selectedProposal.proposer)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Voting Period</p>
                      <p className="text-white">{getTimeRemaining(selectedProposal.endTime)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Quorum</p>
                      <p className="text-white">{formatNumber(selectedProposal.totalVotes)}/{formatNumber(selectedProposal.quorum)}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="font-semibold text-white mb-2">Description</h4>
                    <p className="text-gray-300">{selectedProposal.description}</p>
                  </div>

                  {/* Voting Results */}
                  <div>
                    <h4 className="font-semibold text-white mb-4">Voting Results</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-white">For</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Progress 
                            value={(selectedProposal.votesFor / selectedProposal.totalVotes) * 100} 
                            className="w-32 h-2"
                          />
                          <span className="text-white font-medium w-20 text-right">
                            {formatNumber(selectedProposal.votesFor)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <XCircle className="w-5 h-5 text-red-500" />
                          <span className="text-white">Against</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Progress 
                            value={(selectedProposal.votesAgainst / selectedProposal.totalVotes) * 100} 
                            className="w-32 h-2"
                          />
                          <span className="text-white font-medium w-20 text-right">
                            {formatNumber(selectedProposal.votesAgainst)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Clock3 className="w-5 h-5 text-yellow-500" />
                          <span className="text-white">Abstain</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Progress 
                            value={(selectedProposal.votesAbstain / selectedProposal.totalVotes) * 100} 
                            className="w-32 h-2"
                          />
                          <span className="text-white font-medium w-20 text-right">
                            {formatNumber(selectedProposal.votesAbstain)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <h4 className="font-semibold text-white mb-4">Proposed Actions</h4>
                    <div className="space-y-3">
                      {selectedProposal.actions.map((action, index) => (
                        <Card key={index} className="bg-gray-800 border-gray-700">
                          <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-400">Target</p>
                                <p className="text-white font-mono">{formatAddress(action.target)}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">Value</p>
                                <p className="text-white">{action.value} ETH</p>
                              </div>
                            </div>
                            <div className="mt-3">
                              <p className="text-gray-400">Description</p>
                              <p className="text-white">{action.description}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Voting Interface */}
                  {selectedProposal.status === 'active' && (
                    <div className="border-t border-gray-700 pt-6">
                      <h4 className="font-semibold text-white mb-4">Cast Your Vote</h4>
                      <div className="flex space-x-4">
                        <Button 
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => setVoteChoice('for')}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Vote For
                        </Button>
                        <Button 
                          className="flex-1 bg-red-600 hover:bg-red-700"
                          onClick={() => setVoteChoice('against')}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Vote Against
                        </Button>
                        <Button 
                          className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                          onClick={() => setVoteChoice('abstain')}
                        >
                          <Clock3 className="w-4 h-4 mr-2" />
                          Abstain
                        </Button>
                      </div>
                      {voteChoice && (
                        <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                          <p className="text-white mb-2">
                            Voting <strong className="capitalize">{voteChoice}</strong> with {formatNumber(userVotingPower)} voting power
                          </p>
                          <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
                            Confirm Vote
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Create Proposal Modal */}
          <Dialog open={showCreateProposal} onOpenChange={setShowCreateProposal}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto border border-gray-800/60 bg-[#0b0f16] rounded-lg shadow-md shadow-black/50">
              <DialogHeader>
                <DialogTitle>Create New Proposal</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Proposal Title</Label>
                    <Input 
                      id="title"
                      placeholder="OIP-X: Proposal Title"
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select>
                      <SelectTrigger className="bg-gray-800 border-gray-700">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="treasury">Treasury</SelectItem>
                        <SelectItem value="protocol">Protocol</SelectItem>
                        <SelectItem value="meta">Meta</SelectItem>
                        <SelectItem value="grants">Grants</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description"
                    placeholder="Detailed description of the proposal..."
                    className="bg-gray-800 border-gray-700 min-h-[100px]"
                  />
                </div>

                <div>
                  <Label>Proposed Actions</Label>
                  <Card className="bg-gray-800 border-gray-700 p-4">
                    <div className="text-center py-8 text-gray-400">
                      <Zap className="w-12 h-12 mx-auto mb-2" />
                      <p>Smart contract actions will be configured here</p>
                      <Button variant="outline" className="mt-4">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Action
                      </Button>
                    </div>
                  </Card>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button variant="outline" onClick={() => setShowCreateProposal(false)}>
                    Cancel
                  </Button>
                  <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
                    Submit Proposal
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Layout>
  );
}

export default Governance;