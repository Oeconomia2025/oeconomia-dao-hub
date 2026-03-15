import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Rocket,
  Coins,
  CheckCircle,
  AlertCircle,
  Loader2,
  Wallet,
  ArrowRight,
  BarChart3,
  Globe,
  Shield,
  Code,
  Palette,
  Landmark,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { SiX, SiDiscord, SiMedium, SiGithub, SiTelegram } from "react-icons/si";
import { useAccount } from "wagmi";
import { WalletConnect } from "@/components/wallet-connect";
import { usePresale } from "@/hooks/use-presale";
import { useToast } from "@/hooks/use-toast";
import {
  PRESALE_PRICE,
  HARD_CAP,
  HARD_CAP_USDC,
  approveUsdc,
  buyTokens,
  claimTokens,
  usdcToOec,
} from "@/services/presale-contract";
import { cn } from "@/lib/utils";
import { EcosystemCube } from "@/components/ecosystem-cube";

// ============================================================
// Types
// ============================================================
type TxStatus = "idle" | "pending" | "success" | "error";

// ============================================================
// Countdown display helper
// ============================================================
function formatCountdown(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return { d, h, m, s };
}

// ============================================================
// Presale Page
// ============================================================
export default function Presale() {
  const { address, isConnected } = useAccount();
  const presale = usePresale();
  const { toast } = useToast();

  const [usdcInput, setUsdcInput] = useState("");
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txError, setTxError] = useState("");

  // Derived
  const usdcAmount = parseFloat(usdcInput) || 0;
  const oecOutput = usdcToOec(usdcAmount);
  const progressPercent = presale.hardCap > 0
    ? Math.min((presale.tokensSold / presale.hardCap) * 100, 100)
    : 0;
  const countdown = formatCountdown(presale.timeRemaining);
  const needsApproval = isConnected && usdcAmount > 0 && presale.usdcAllowance < usdcAmount;

  // Determine presale status badge
  const statusBadge = useMemo(() => {
    if (presale.tokensSold >= presale.hardCap) return { label: "SOLD OUT", color: "bg-red-500/20 text-red-400 border-red-500/30" };
    if (!presale.isPresaleActive) return { label: "PRESALE ENDED", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" };
    if (presale.timeRemaining <= 0 && presale.presaleEndTime > 0) return { label: "PRESALE ENDED", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" };
    return { label: "PRESALE IS LIVE", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
  }, [presale.isPresaleActive, presale.timeRemaining, presale.tokensSold, presale.hardCap, presale.presaleEndTime]);

  const isLive = statusBadge.label === "PRESALE IS LIVE";

  // --------------------------------------------------------
  // Transaction handlers
  // --------------------------------------------------------
  async function handleApprove() {
    if (!usdcInput || usdcAmount <= 0) return;
    setTxStatus("pending");
    setTxError("");
    try {
      await approveUsdc(usdcInput);
      setTxStatus("success");
      toast({ title: "Approval successful", description: `Approved ${usdcAmount.toLocaleString()} USDC for presale` });
      presale.refetch();
      setTimeout(() => setTxStatus("idle"), 3000);
    } catch (err: any) {
      setTxStatus("error");
      setTxError(err?.shortMessage || err?.message || "Approval failed");
      toast({ title: "Approval failed", description: err?.shortMessage || err?.message, variant: "destructive" });
    }
  }

  async function handleBuy() {
    if (!usdcInput || usdcAmount <= 0) return;
    setTxStatus("pending");
    setTxError("");
    try {
      await buyTokens(usdcInput);
      setTxStatus("success");
      toast({ title: "Purchase successful!", description: `You bought ${oecOutput.toLocaleString()} OEC` });
      setUsdcInput("");
      presale.refetch();
      setTimeout(() => setTxStatus("idle"), 3000);
    } catch (err: any) {
      setTxStatus("error");
      setTxError(err?.shortMessage || err?.message || "Purchase failed");
      toast({ title: "Purchase failed", description: err?.shortMessage || err?.message, variant: "destructive" });
    }
  }

  async function handleClaim() {
    setTxStatus("pending");
    setTxError("");
    try {
      await claimTokens();
      setTxStatus("success");
      toast({ title: "Claim successful!", description: "Your OEC tokens have been sent to your wallet" });
      presale.refetch();
      setTimeout(() => setTxStatus("idle"), 3000);
    } catch (err: any) {
      setTxStatus("error");
      setTxError(err?.shortMessage || err?.message || "Claim failed");
      toast({ title: "Claim failed", description: err?.shortMessage || err?.message, variant: "destructive" });
    }
  }

  const [, navigate] = useLocation();

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div
      className="min-h-screen text-white relative"
      style={{ background: "#000000" }}
    >
      {/* Full-screen 3D cube background */}
      <EcosystemCube className="fixed inset-0 w-full h-full z-0" />

      {/* ============================== */}
      {/* STANDALONE HEADER              */}
      {/* ============================== */}
      <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-14 px-4 md:px-6">
          {/* Left — logo + back */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <img src="/oec-logo.png" alt="OEC" className="w-7 h-7 rounded-full" />
              <span className="hidden sm:inline text-sm font-medium">Oeconomia</span>
            </button>
          </div>

          {/* Center — presale label (desktop) */}
          <span className="hidden md:inline text-sm font-semibold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            OEC Token Presale
          </span>

          {/* Right — wallet */}
          <div className="w-44">
            <WalletConnect />
          </div>
        </div>
      </header>

      <div className="relative z-10 p-4 md:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">

          {/* ============================== */}
          {/* HERO SECTION                   */}
          {/* ============================== */}
          <section className="text-center space-y-6 pt-4">
            <div className="flex justify-center h-20">
              <img
                src="/oec-logo.png"
                alt="OEC Token"
                className="w-40 h-40 rounded-full animate-pulse -mt-10"
                style={{ animationDuration: "3s" }}
              />
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                OEC Token Presale
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
              Be part of the Oeconomia ecosystem from day one
            </p>

            {/* Status badge */}
            <div className="flex justify-center">
              <span
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border",
                  statusBadge.color,
                  isLive && "animate-pulse"
                )}
              >
                {isLive && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
                {statusBadge.label}
              </span>
            </div>
          </section>

          {/* ============================== */}
          {/* PRESALE WIDGET                 */}
          {/* ============================== */}
          <section className="mt-4">
            <Card className="bg-gray-900/20 border-gray-700/50 overflow-hidden backdrop-blur-xl">
              {/* Gradient top bar */}
              <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #00d4ff, #ff00ff)" }} />

              <CardContent className="p-6 space-y-6">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Tokens Sold</span>
                    <span className="text-white font-medium">
                      {presale.tokensSold.toLocaleString()} / {HARD_CAP.toLocaleString()} OEC
                    </span>
                  </div>
                  <div className="w-full h-4 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${progressPercent}%`,
                        background: "linear-gradient(90deg, #00d4ff, #a855f7, #ff00ff)",
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{progressPercent.toFixed(1)}% filled</span>
                    <span>${HARD_CAP_USDC.toLocaleString()} USDC hard cap</span>
                  </div>
                </div>

                {/* Countdown */}
                {presale.timeRemaining > 0 && (
                  <div className="flex justify-center gap-3">
                    {[
                      { val: countdown.d, label: "Days" },
                      { val: countdown.h, label: "Hours" },
                      { val: countdown.m, label: "Mins" },
                      { val: countdown.s, label: "Secs" },
                    ].map((unit) => (
                      <div key={unit.label} className="flex flex-col items-center">
                        <div className="w-14 h-14 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center">
                          <span className="text-xl font-bold text-white font-mono">
                            {String(unit.val).padStart(2, "0")}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-500 mt-1">{unit.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Price info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/30 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Price per OEC</p>
                    <p className="text-lg font-bold text-cyan-400">${PRESALE_PRICE}</p>
                  </div>
                  <div className="bg-gray-800/30 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Your Allocation</p>
                    <p className="text-lg font-bold text-purple-400">
                      {isConnected ? `${presale.userAllocation.toLocaleString()} OEC` : "—"}
                    </p>
                  </div>
                </div>

                {/* Input */}
                <div className="space-y-3">
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="Enter USDC amount"
                      value={usdcInput}
                      onChange={(e) => setUsdcInput(e.target.value)}
                      min="0"
                      step="any"
                      className="bg-gray-800 border-gray-700 text-white pr-16 h-12 text-lg"
                      disabled={!isLive || txStatus === "pending"}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
                      USDC
                    </span>
                  </div>
                  {usdcAmount > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-400 px-1">
                      <ArrowRight className="w-4 h-4 text-cyan-500" />
                      <span>
                        You will receive{" "}
                        <span className="text-white font-semibold">{oecOutput.toLocaleString()}</span>{" "}
                        OEC
                      </span>
                    </div>
                  )}
                  {isConnected && (
                    <p className="text-xs text-gray-500 px-1">
                      USDC Balance: {presale.usdcBalance.toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                  {!isConnected ? (
                    <div className="text-center space-y-2">
                      <p className="text-sm text-gray-400">Connect your wallet to participate</p>
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                        <Wallet className="w-4 h-4" />
                        <span>Use the sidebar wallet button to connect</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Approve + Buy */}
                      {isLive && (
                        <>
                          {needsApproval ? (
                            <Button
                              onClick={handleApprove}
                              disabled={txStatus === "pending" || usdcAmount <= 0}
                              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                            >
                              {txStatus === "pending" ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                              ) : (
                                <CheckCircle className="w-5 h-5 mr-2" />
                              )}
                              Approve USDC
                            </Button>
                          ) : (
                            <Button
                              onClick={handleBuy}
                              disabled={txStatus === "pending" || usdcAmount <= 0}
                              className="w-full h-12 text-base font-semibold text-white"
                              style={{ background: "linear-gradient(45deg, #00d4ff, #ff00ff)" }}
                            >
                              {txStatus === "pending" ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                              ) : (
                                <Rocket className="w-5 h-5 mr-2" />
                              )}
                              Buy OEC
                            </Button>
                          )}
                        </>
                      )}

                      {/* Claim */}
                      {!presale.isPresaleActive && presale.userAllocation > 0 && !presale.hasClaimed && (
                        <Button
                          onClick={handleClaim}
                          disabled={txStatus === "pending"}
                          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                        >
                          {txStatus === "pending" ? (
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          ) : (
                            <Coins className="w-5 h-5 mr-2" />
                          )}
                          Claim {presale.userAllocation.toLocaleString()} OEC
                        </Button>
                      )}

                      {presale.hasClaimed && (
                        <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          <span>Tokens claimed successfully</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Transaction feedback */}
                  {txStatus === "success" && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      Transaction confirmed!
                    </div>
                  )}
                  {txStatus === "error" && txError && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {txError}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* ============================== */}
          {/* TOKENOMICS                     */}
          {/* ============================== */}
          <section className="mt-12 space-y-6">
            <h2 className="text-2xl font-bold text-center">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Tokenomics
              </span>
            </h2>
            <p className="text-center text-gray-400 text-sm max-w-xl mx-auto">
              500,000,000 OEC total supply &mdash; strategically allocated for ecosystem growth
            </p>

            <Card className="bg-gray-900/20 border-gray-700/50 backdrop-blur-xl">
              <CardContent className="p-6 space-y-4">
                {[
                  { label: "Presale", pct: 35, color: "#00d4ff" },
                  { label: "Liquidity", pct: 35, color: "#a855f7" },
                  { label: "Staking Emissions", pct: 20, color: "#22c55e" },
                  { label: "Achievement Rewards", pct: 5, color: "#f59e0b" },
                  { label: "Founder Vesting", pct: 4, color: "#ef4444" },
                  { label: "Founder", pct: 1, color: "#6366f1" },
                ].map((item) => (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">{item.label}</span>
                      <span className="text-white font-medium">{item.pct}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          {/* ============================== */}
          {/* FUND ALLOCATION                */}
          {/* ============================== */}
          <section className="mt-12 space-y-6">
            <h2 className="text-2xl font-bold text-center">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Fund Allocation
              </span>
            </h2>
            <p className="text-center text-gray-400 text-sm max-w-xl mx-auto">
              Transparency in how presale funds are deployed
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gray-900/20 border-gray-700/50 backdrop-blur-xl group hover:border-cyan-500/30 transition-colors">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-cyan-500/10 flex items-center justify-center">
                    <BarChart3 className="w-7 h-7 text-cyan-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-white">90%</h3>
                  <p className="text-gray-400">Eloqura Liquidity Pool</p>
                  <p className="text-xs text-gray-500">
                    Providing deep liquidity for OEC trading on our decentralized exchange
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/20 border-gray-700/50 backdrop-blur-xl group hover:border-purple-500/30 transition-colors">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Shield className="w-7 h-7 text-purple-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-white">10%</h3>
                  <p className="text-gray-400">Operations Wallet</p>
                  <p className="text-xs text-gray-500">
                    Infrastructure, development, audits, and ecosystem growth
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ============================== */}
          {/* PROTOCOL OVERVIEW              */}
          {/* ============================== */}
          <section className="mt-12 space-y-6">
            <h2 className="text-2xl font-bold text-center">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                The Oeconomia Ecosystem
              </span>
            </h2>
            <p className="text-center text-gray-400 text-sm max-w-xl mx-auto">
              OEC powers a full suite of DeFi protocols
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  icon: Coins,
                  title: "OEC Staking",
                  desc: "Earn rewards by staking OEC tokens",
                  color: "from-cyan-500/20 to-cyan-600/5",
                  iconColor: "text-cyan-400",
                  borderHover: "hover:border-cyan-500/40",
                },
                {
                  icon: Globe,
                  title: "Eloqura DEX",
                  desc: "Decentralized token exchange",
                  color: "from-blue-500/20 to-blue-600/5",
                  iconColor: "text-blue-400",
                  borderHover: "hover:border-blue-500/40",
                },
                {
                  icon: Landmark,
                  title: "Alluria Lending",
                  desc: "Borrow and lend crypto assets",
                  color: "from-emerald-500/20 to-emerald-600/5",
                  iconColor: "text-emerald-400",
                  borderHover: "hover:border-emerald-500/40",
                },
                {
                  icon: Palette,
                  title: "Artivya NFT",
                  desc: "Create and trade digital collectibles",
                  color: "from-purple-500/20 to-purple-600/5",
                  iconColor: "text-purple-400",
                  borderHover: "hover:border-purple-500/40",
                },
                {
                  icon: Code,
                  title: "Iridescia Dev Tools",
                  desc: "Build on the Oeconomia protocol",
                  color: "from-amber-500/20 to-amber-600/5",
                  iconColor: "text-amber-400",
                  borderHover: "hover:border-amber-500/40",
                },
              ].map((item) => (
                <Card
                  key={item.title}
                  className={cn(
                    "bg-gray-900/20 border-gray-700/50 backdrop-blur-xl transition-all duration-200",
                    item.borderHover
                  )}
                >
                  <CardContent className="p-5 space-y-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                        item.color
                      )}
                    >
                      <item.icon className={cn("w-5 h-5", item.iconColor)} />
                    </div>
                    <h3 className="text-white font-semibold">{item.title}</h3>
                    <p className="text-sm text-gray-400">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* ============================== */}
          {/* FAQ                            */}
          {/* ============================== */}
          <section className="mt-12 space-y-6">
            <h2 className="text-2xl font-bold text-center">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Frequently Asked Questions
              </span>
            </h2>

            <Card className="bg-gray-900/20 border-gray-700/50 backdrop-blur-xl">
              <CardContent className="p-6">
                <Accordion type="single" collapsible className="w-full">
                  {[
                    {
                      q: "What is OEC?",
                      a: "OEC is the governance and utility token of the Oeconomia ecosystem. It powers staking rewards, governance voting, protocol fee sharing, and serves as the native token across all Oeconomia dApps including Eloqura DEX, Alluria Lending, Artivya NFT, and Iridescia Dev Tools.",
                    },
                    {
                      q: "How do I participate in the presale?",
                      a: "Connect your wallet using the button in the top-right corner, enter the amount of USDC you'd like to spend, approve the USDC spending, and click \"Buy OEC\". Your allocation will be tracked on-chain and visible in the presale widget above.",
                    },
                    {
                      q: "What's the presale price?",
                      a: `Each OEC token is priced at $${PRESALE_PRICE} USDC during the presale. The hard cap is ${HARD_CAP.toLocaleString()} OEC tokens ($${HARD_CAP_USDC.toLocaleString()} USDC).`,
                    },
                    {
                      q: "When can I claim my tokens?",
                      a: "Tokens can be claimed after the presale period ends. Once the presale closes, the \"Claim OEC\" button will become active and you can transfer your allocated tokens to your wallet.",
                    },
                    {
                      q: "What chain is the presale on?",
                      a: "The presale is currently deployed on the Sepolia testnet for testing. The production presale chain will be announced before launch.",
                    },
                    {
                      q: "Is there a vesting period?",
                      a: "Presale tokens are fully unlocked at claim time — no vesting schedule for presale participants. Founder tokens (4% allocation) are subject to a vesting schedule.",
                    },
                    {
                      q: "How are presale funds used?",
                      a: "90% of funds go directly into the Eloqura liquidity pool to provide deep OEC trading liquidity. 10% supports operations including infrastructure, development, security audits, and ecosystem growth.",
                    },
                  ].map((faq, i) => (
                    <AccordionItem key={i} value={`faq-${i}`} className="border-gray-700">
                      <AccordionTrigger className="text-left text-gray-200 hover:text-white hover:no-underline py-4">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-400 leading-relaxed">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </section>

          {/* ============================== */}
          {/* FOOTER                         */}
          {/* ============================== */}
          <footer className="mt-12 border-t border-gray-800 pt-8 pb-4 space-y-6">
            {/* Ecosystem links */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-sm">
              {[
                { label: "OEC Staking", url: "https://oec-staking.netlify.app" },
                { label: "Eloqura DEX", url: "https://eloqura.netlify.app" },
                { label: "Alluria Lending", url: "#" },
                { label: "Artivya NFT", url: "#" },
                { label: "Iridescia Tools", url: "#" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-gray-500 hover:text-cyan-400 transition-colors"
                >
                  <ChevronRight className="w-3 h-3" />
                  {link.label}
                </a>
              ))}
            </div>

            {/* Social links */}
            <div className="flex justify-center gap-4">
              {[
                { icon: SiX, url: "https://x.com/Oeconomia2025", label: "X / Twitter" },
                { icon: SiDiscord, url: "https://discord.com/invite/XSgZgeVD", label: "Discord" },
                { icon: SiMedium, url: "https://medium.com/@oeconomia2025", label: "Medium" },
                { icon: SiGithub, url: "https://github.com/Oeconomia2025", label: "GitHub" },
                { icon: SiTelegram, url: "https://t.me/OeconomiaDAO", label: "Telegram" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
                  title={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>

            {/* Docs link */}
            <div className="text-center">
              <a
                href="https://oeconomia.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-cyan-400 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Oeconomia Documentation
              </a>
            </div>

            <p className="text-center text-xs text-gray-600">
              &copy; 2025 Oeconomia. All rights reserved.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
