import { useState, ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BarChart3,
  Wallet,
  TrendingUp,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Globe,
  AlertTriangle,
  Heart,
  Vote
} from "lucide-react";
import { SiX, SiMedium, SiYoutube, SiDiscord, SiGithub, SiTelegram } from "react-icons/si";
import { WalletConnect } from "@/components/wallet-connect";
import { EcosystemSidebar } from "@/components/ecosystem-sidebar";
import { useTheme } from "@/components/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [linksOpen, setLinksOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed');
      return saved === 'true';
    }
    return false;
  });
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [donationStep, setDonationStep] = useState<'addresses' | 'thankyou'>('addresses');
  const [selectedDonationType, setSelectedDonationType] = useState<string>('');
  const [donorName, setDonorName] = useState('');
  const [location, navigate] = useLocation();

  const socialLinks = [
    { name: 'Twitter/X', icon: SiX, url: 'https://x.com/Oeconomia2025', enabled: true },
    { name: 'Medium', icon: SiMedium, url: 'https://medium.com/@oeconomia2025', enabled: true },
    { name: 'YouTube', icon: SiYoutube, url: 'https://www.youtube.com/@Oeconomia2025', enabled: true },
    { name: 'Discord', icon: SiDiscord, url: 'https://discord.com/invite/XSgZgeVD', enabled: true },
    { name: 'GitHub', icon: SiGithub, url: 'https://github.com/Oeconomia2025', enabled: true },
    { name: 'Telegram', icon: SiTelegram, url: 'https://t.me/OeconomiaDAO', enabled: true }
  ];

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  const handleNavigation = (path: string) => {
    if (window.innerWidth < 1024) {
      navigate(path);
      setSidebarOpen(false);
      return;
    }
    navigate(path);
  };

  const toggleCollapsed = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  };

  const sidebarItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/', active: location === '/' || location === '/dashboard' },
    { icon: TrendingUp, label: 'Analytics', path: '/analytics', active: location === '/analytics' },
    { icon: Wallet, label: 'Portfolio', path: '/portfolio', active: location === '/portfolio' },
    { icon: Vote, label: 'Governance', path: '/governance', active: location === '/governance' },
  ];

  // Token price pills data
  const tokenPills = [
    {
      symbol: 'OEC',
      logo: 'https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/With%20Border/OEC%20Border.png',
      price: '$7.37',
    },
    {
      symbol: 'ELOQ',
      logo: 'https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/With%20Border/ELOQ%20Border.png',
      price: '$0.42',
    },
    {
      symbol: 'ALUR',
      logo: '/ecosystem/alur.png',
      price: '$1.85',
    },
    {
      symbol: 'ALUD',
      logo: 'https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/With%20Border/ALUD%20Dollar.png',
      price: '$1.00',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Collapse/Expand button - outside all containers for true fixed positioning */}
      <button
        onClick={toggleCollapsed}
        className={`hidden lg:flex fixed top-[29px] z-[60] w-6 h-6 rounded-full items-center justify-center transition-all duration-300 bg-gray-800 border border-gray-700 ${
          sidebarCollapsed ? "left-[52px]" : "left-[180px]"
        }`}
        title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {sidebarCollapsed ? <ChevronRight className="w-3 h-3 text-cyan-400" /> : <ChevronLeft className="w-3 h-3 text-cyan-400" />}
      </button>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 ${sidebarCollapsed ? 'w-16' : 'w-48'} bg-gray-950 border-r border-gray-700 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col shadow-xl shadow-black/70`}
      >
        <div className="sticky top-0 z-10 bg-gray-950 flex items-center justify-between h-20 px-4">
          <div
            className={`flex items-center cursor-pointer hover:opacity-80 transition-opacity ${sidebarCollapsed ? 'justify-center w-full' : 'space-x-3'}`}
            onClick={() => navigate('/')}
            title="Go to Home"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
              <img src="/oec-logo.png" alt="Oeconomia Logo" className="w-full h-full object-cover" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h2 className="text-lg font-bold whitespace-nowrap">Oeconomia</h2>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="sticky top-20 z-10 bg-gray-950">
          <nav className="p-2">
            <ul className="space-y-2">
              {sidebarItems.map((item, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center ${
                      sidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-3'
                    } py-2 rounded-lg text-left transition-colors group relative ${
                      item.active
                        ? 'text-white font-medium shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                    style={item.active ? { background: 'linear-gradient(45deg, #00d4ff, #ff00ff)' } : {}}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${item.active ? 'text-white' : 'text-cyan-400'}`} />
                    {!sidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                    {sidebarCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        {item.label}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex-1" />

        {/* Bottom section */}
        <div className="sticky bottom-0 bg-gray-950 p-2 flex flex-col space-y-2">
          {/* Under Development Notice */}
          <button
            onClick={() => setDisclaimerOpen(true)}
            className={`w-full flex items-center ${
              sidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-3'
            } py-2 rounded-lg text-left transition-colors group relative text-yellow-400 hover:bg-yellow-500/10`}
            title={sidebarCollapsed ? "Under Development" : undefined}
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-xs font-medium whitespace-nowrap">Under Development</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Under Development
              </div>
            )}
          </button>

          {/* Social Media Dropdown */}
          <DropdownMenu onOpenChange={setLinksOpen}>
            <DropdownMenuTrigger asChild>
              <button
                className={`w-full flex items-center ${
                  sidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-3'
                } py-2 rounded-lg text-left transition-all duration-200 group relative text-white focus:outline-none focus:ring-0 ${
                  linksOpen ? 'shadow-lg' : 'bg-gray-800 hover:bg-cyan-500/30'
                }`}
                style={linksOpen ? { background: 'linear-gradient(45deg, #00d4ff, #ff00ff)' } : {}}
                title={sidebarCollapsed ? "Links" : undefined}
              >
                <Globe className="w-5 h-5 flex-shrink-0 text-white" />
                {!sidebarCollapsed && <span className="whitespace-nowrap">Links</span>}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    Links
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={sidebarCollapsed ? "center" : "start"}
              side={sidebarCollapsed ? "right" : "top"}
              sideOffset={sidebarCollapsed ? 8 : 4}
              className={sidebarCollapsed ? "w-36" : "w-full"}
              style={!sidebarCollapsed ? { width: 'var(--radix-dropdown-menu-trigger-width)' } : undefined}
            >
              <DropdownMenuItem
                onClick={() => window.open('https://oeconomia.tech/', '_blank')}
                className="cursor-pointer hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-purple-600/20 transition-all duration-200"
              >
                <Globe className="w-4 h-4 mr-2" />
                Website
              </DropdownMenuItem>
              {socialLinks.map((link) => (
                <DropdownMenuItem
                  key={link.name}
                  onClick={() => link.enabled && window.open(link.url, '_blank')}
                  className="cursor-pointer hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-purple-600/20 transition-all duration-200"
                  disabled={!link.enabled}
                >
                  <link.icon className="w-4 h-4 mr-2" />
                  {link.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Oeconomia Button */}
          <button
            onClick={() => window.open('https://oeconomia.io/', '_blank')}
            className={`w-full flex items-center ${
              sidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-3'
            } py-2 rounded-lg text-left transition-colors group relative text-white hover:bg-white/5`}
            style={{
              background: 'linear-gradient(#0a0a0a, #0a0a0a) padding-box, linear-gradient(45deg, #00d4ff, #ff00ff) border-box',
              border: '2px solid transparent'
            }}
            title={sidebarCollapsed ? "Oeconomia" : undefined}
          >
            <img
              src="https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/images/OEC%20Logo%20Square.png"
              alt="OEC Logo"
              className="w-5 h-5 flex-shrink-0"
            />
            {!sidebarCollapsed && <span className="whitespace-nowrap">Oeconomia</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Oeconomia
              </div>
            )}
          </button>

          {/* Connect Wallet */}
          <WalletConnect />
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 mr-9 relative">
        {/* Top Bar with Price Pills */}
        <header className="sticky top-0 z-30 bg-gray-950/90 backdrop-blur-sm border-b border-gray-700 px-4 h-14 flex items-center">
          <div className="flex items-center justify-between w-full">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden mr-2"
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Price Pills */}
            <div className="flex items-center space-x-3 overflow-x-auto">
              {tokenPills.map((token) => (
                <div
                  key={token.symbol}
                  className="flex items-center space-x-1.5 bg-gray-800/60 border border-gray-700 rounded-full pr-3 h-8 flex-shrink-0"
                >
                  <img
                    src={token.logo}
                    alt={token.symbol}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-xs text-gray-400">{token.symbol}</span>
                  <span className="text-xs font-medium text-white">{token.price}</span>
                </div>
              ))}
            </div>

            {/* Support button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSupportOpen(true)}
              className="w-8 h-8 p-0 rounded-full bg-gray-800 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-purple-600 transition-all duration-200 focus:outline-none focus:ring-0 group ml-3 flex-shrink-0"
              title="Support Development"
            >
              <Heart className="w-4 h-4 text-cyan-400 group-hover:text-white transition-colors fill-current" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          {children}

          <footer className="mt-8 py-6 px-6 text-center">
            <p className="text-sm text-muted-foreground">
              &copy; 2025 Oeconomia. All rights reserved.
            </p>
          </footer>
        </main>
      </div>

      {/* Ecosystem Sidebar */}
      <EcosystemSidebar />

      {/* Disclaimer Modal */}
      {disclaimerOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-[var(--crypto-card)] border-gray-700 p-6 relative">
            <button
              onClick={() => setDisclaimerOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Under Development Notice</h2>
                <p className="text-sm text-gray-400">Oeconomia DAO Hub</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-gray-300">
                Please note that this DApp is currently in active development and is not yet ready for production use.
              </p>
              <p className="text-gray-300">
                This dashboard serves as a preview and testing environment. All data, transactions, and features are for demonstration purposes only.
              </p>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-sm text-yellow-400">
                  <strong>Important:</strong> Do not use real funds or make actual transactions through this interface.
                </p>
              </div>
            </div>

            <Button
              onClick={() => setDisclaimerOpen(false)}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white"
            >
              I Understand
            </Button>
          </Card>
        </div>
      )}

      {/* Support Modal */}
      {supportOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSupportOpen(false)}
        >
          <Card
            className="max-w-4xl w-full bg-[var(--crypto-card)] border-gray-700 p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setSupportOpen(false);
                setTimeout(() => {
                  setDonationStep('addresses');
                  setSelectedDonationType('');
                  setDonorName('');
                }, 300);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {donationStep === 'addresses' ? (
              <div className="animate-in fade-in duration-500">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500/20 to-red-500/20 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-pink-400 fill-current animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Support Development</h2>
                    <p className="text-sm text-gray-400">Help Oeconomia Grow</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <p className="text-gray-300">
                    Your support helps fund essential infrastructure including servers, databases, APIs, and blockchain node operations.
                  </p>

                  <div className="bg-gradient-to-r from-cyan-500/10 to-purple-600/10 border border-cyan-500/30 rounded-lg p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-cyan-400 mb-2">Donation Addresses (Click to Copy):</h3>
                    <div className="space-y-3 text-sm">
                      {[
                        { label: 'EVM Networks', key: 'evm', value: '0xD02dbe54454F6FE3c2F9F1F096C5460284E418Ed' },
                        { label: 'Solana', key: 'sol', value: 'HkJhW2X9xYw9n4sp3e9BBh33Np6iNghpU7gtDJ5ATqYx' },
                        { label: 'Bitcoin', key: 'btc', value: 'bc1qwtzdtx6ghfzy065wmv3xfk8tyqqr2w87tnrx9r' },
                        { label: 'CashApp', key: 'cashapp', value: '$oooJASONooo' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center gap-4">
                          <span className="text-gray-400 font-medium min-w-[120px]">{item.label}:</span>
                          <div
                            className={`font-mono text-xs p-2 rounded break-all cursor-pointer transition-all duration-300 flex-1 ${
                              copiedAddress === item.key
                                ? 'bg-green-500/30 border border-green-500/50 text-green-300'
                                : 'bg-black/30 hover:bg-black/50'
                            }`}
                            onClick={() => {
                              navigator.clipboard.writeText(item.value);
                              setCopiedAddress(item.key);
                              setSelectedDonationType(item.label);
                              setTimeout(() => setCopiedAddress(null), 2000);
                              setTimeout(() => setDonationStep('thankyou'), 2500);
                            }}
                            title="Click to copy"
                          >
                            {copiedAddress === item.key ? 'Copied!' : item.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <p className="text-sm text-green-400">
                      <strong>Thank you for your support!</strong> Every contribution is deeply appreciated.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => setSupportOpen(false)}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white"
                >
                  Close
                </Button>
              </div>
            ) : (
              <div className="animate-in slide-in-from-right duration-700 ease-out">
                <div className="text-center space-y-6">
                  <div className="relative">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-pink-500/20 to-red-500/20 flex items-center justify-center animate-pulse">
                      <Heart className="w-10 h-10 text-pink-400 fill-current animate-bounce" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                      Thank You!
                    </h2>
                    <p className="text-lg text-gray-300">
                      Your {selectedDonationType} donation address has been copied
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => { setDonationStep('addresses'); setSelectedDonationType(''); }}
                      variant="outline"
                      className="flex-1 border-gray-600 hover:bg-gray-700"
                    >
                      Back to Addresses
                    </Button>
                    <Button
                      onClick={() => {
                        setSupportOpen(false);
                        setTimeout(() => { setDonationStep('addresses'); setSelectedDonationType(''); setDonorName(''); }, 300);
                      }}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      Complete
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
