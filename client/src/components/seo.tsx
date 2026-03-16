import { Helmet } from "react-helmet-async";

const SITE_URL = "https://oeconomia.io";
const DEFAULT_IMAGE = `${SITE_URL}/oec-logo.png`;
const TWITTER_HANDLE = "@CryptoM33156512";

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
  noIndex?: boolean;
}

const PAGE_SEO: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Oeconomia DAO Hub — DeFi Dashboard & Token Analytics",
    description:
      "Track OEC token prices, holder stats, and blockchain analytics on the Oeconomia DAO dashboard. Your gateway to the Oeconomia DeFi ecosystem.",
  },
  "/dashboard": {
    title: "Dashboard — Oeconomia Token Analytics & Price Tracking",
    description:
      "Real-time OEC token dashboard with live price tracking, holder statistics, volume analytics, and blockchain data.",
  },
  "/presale": {
    title: "OEC Token Presale — Buy OEC at Launch Price",
    description:
      "Participate in the Oeconomia (OEC) token presale. Get early access to OEC tokens at presale pricing. 500M total supply, transparent tokenomics.",
  },
  "/ecosystem": {
    title: "Oeconomia Ecosystem — Five Protocols, One Vision",
    description:
      "Explore the Oeconomia Pantheon: Eloqura DEX, Alluria Lending, Artivya Trading, Iridescia DevOps, and OECsplorer — a complete DeFi ecosystem.",
  },
  "/analytics": {
    title: "Analytics — OEC Token Volume, Trades & Market Data",
    description:
      "Deep-dive into Oeconomia (OEC) token analytics: trade volume, price history, market trends, and on-chain activity.",
  },
  "/governance": {
    title: "Governance — Oeconomia DAO Proposals & Voting",
    description:
      "Participate in Oeconomia DAO governance. View proposals, cast votes, and shape the future of the OEC ecosystem.",
  },
  "/portfolio": {
    title: "Portfolio — Track Your Oeconomia Holdings",
    description:
      "Monitor your OEC token holdings, staking rewards, and portfolio performance across the Oeconomia ecosystem.",
  },
  "/roadmap": {
    title: "Roadmap — Oeconomia Development Timeline",
    description:
      "View the Oeconomia ecosystem roadmap: completed milestones, current development, and upcoming features across all five protocols.",
  },
};

export function SEO({ title, description, path = "/", image, type = "website", noIndex }: SEOProps) {
  const pageSeo = PAGE_SEO[path] || PAGE_SEO["/"]!;
  const pageTitle = title || pageSeo.title;
  const pageDescription = description || pageSeo.description;
  const pageUrl = `${SITE_URL}${path}`;
  const pageImage = image || DEFAULT_IMAGE;

  return (
    <Helmet>
      {/* Primary */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <link rel="canonical" href={pageUrl} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:site_name" content="Oeconomia" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:creator" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageImage} />
    </Helmet>
  );
}

export function getPageSEO(path: string) {
  return PAGE_SEO[path] || PAGE_SEO["/"]!;
}
