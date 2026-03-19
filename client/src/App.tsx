import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { DisclaimerModal } from "@/components/disclaimer-modal";
import { SEO } from "@/components/seo";
import { OrganizationSchema, WebAppSchema } from "@/components/structured-data";
import { liveCoinWatchSyncService } from "@/services/live-coin-watch-sync";

const Dashboard = lazy(() => import("@/pages/dashboard"));
const Portfolio = lazy(() => import("@/pages/portfolio").then(m => ({ default: m.Portfolio })));
const Analytics = lazy(() => import("@/pages/analytics"));
const Governance = lazy(() => import("@/pages/governance"));
const Ecosystem = lazy(() => import("@/pages/ecosystem"));
const Presale = lazy(() => import("@/pages/presale"));
const Roadmap = lazy(() => import("@/pages/roadmap"));
const NotFound = lazy(() => import("@/pages/not-found"));

function PageSEO() {
  const [location] = useLocation();
  // Normalize path (strip trailing slash, handle ecosystem sub-routes)
  const path = location === "/" ? "/" : location.replace(/\/$/, "").replace(/\/ecosystem\/.*/, "/ecosystem");
  return <SEO path={path} />;
}

function Router() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/governance" component={Governance} />
      <Route path="/ecosystem/:protocol?" component={Ecosystem} />
      <Route path="/presale" component={Presale} />
      <Route path="/roadmap" component={Roadmap} />
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

function App() {
  useEffect(() => {
    // Initialize Live Coin Watch sync for production environment
    liveCoinWatchSyncService.initializeProductionSync().catch(error => {
      console.warn('Could not initialize production sync:', error);
    });

    // Cleanup on unmount
    return () => {
      liveCoinWatchSyncService.stopSync();
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <OrganizationSchema />
            <WebAppSchema />
            <PageSEO />
            <Toaster />
            <DisclaimerModal />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
