import { Helmet } from "react-helmet-async";

const SITE_URL = "https://oeconomia.io";

// Organization schema — appears on every page
export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Oeconomia",
    alternateName: "Oeconomia DAO",
    url: SITE_URL,
    logo: `${SITE_URL}/oec-logo.png`,
    description:
      "Oeconomia is a decentralized finance ecosystem featuring five integrated protocols: Eloqura DEX, Alluria Lending, Artivya Trading, Iridescia DevOps, and OECsplorer.",
    sameAs: [
      "https://twitter.com/CryptoM33156512",
      "https://github.com/Oeconomia2025",
    ],
    foundingDate: "2025",
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// WebApplication schema — for the dashboard/dapp pages
export function WebAppSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Oeconomia DAO Hub",
    url: SITE_URL,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web Browser",
    description:
      "Decentralized finance dashboard for tracking OEC token analytics, managing portfolios, participating in governance, and accessing the Oeconomia ecosystem.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    creator: {
      "@type": "Organization",
      name: "Oeconomia",
      url: SITE_URL,
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// FAQ schema — for the presale page
export function PresaleFAQSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How do I participate in the OEC presale?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Connect your wallet using the button in the sidebar, enter the amount of USDC you'd like to spend, approve the USDC spending, and click Buy OEC. Your allocation will be tracked on-chain.",
        },
      },
      {
        "@type": "Question",
        name: "What is the OEC presale price?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Each OEC token is priced at $0.0025 USDC during the presale. The hard cap is 175,000,000 OEC tokens ($437,500 USDC).",
        },
      },
      {
        "@type": "Question",
        name: "When can I claim my OEC tokens?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Tokens can be claimed after the presale period ends. Once the presale closes, the Claim OEC button will become active and you can transfer your allocated tokens to your wallet.",
        },
      },
      {
        "@type": "Question",
        name: "What is the OEC token total supply?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The total supply of OEC is 500,000,000 tokens. 35% is allocated to presale, 25% to liquidity, 20% to ecosystem, 12% to team, 4% to founders, and 4% to reserves.",
        },
      },
      {
        "@type": "Question",
        name: "What is the Oeconomia ecosystem?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oeconomia is a five-protocol DeFi ecosystem consisting of Eloqura (decentralized exchange), Alluria (lending protocol), Artivya (hybrid trading), Iridescia (developer infrastructure), and OECsplorer (blockchain explorer).",
        },
      },
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// BreadcrumbList schema
export function BreadcrumbSchema({ items }: { items: { name: string; path: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
