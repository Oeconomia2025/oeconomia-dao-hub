import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { DisclaimerModal } from "@/components/disclaimer-modal";
import { SEO } from "@/components/seo";
import { OrganizationSchema, WebAppSchema } from "@/components/structured-data";
import { liveCoinWatchSyncService } from "@/services/live-coin-watch-sync";
import Dashboard from "@/pages/dashboard";
import { Portfolio } from "@/pages/portfolio";
import Analytics from "@/pages/analytics";
import Governance from "@/pages/governance";
import Ecosystem from "@/pages/ecosystem";
import Presale from "@/pages/presale";
import Roadmap from "@/pages/roadmap";
import NotFound from "@/pages/not-found";

function PageSEO() {
  const [location] = useLocation();
  // Normalize path (strip trailing slash, handle ecosystem sub-routes)
  const path = location === "/" ? "/" : location.replace(/\/$/, "").replace(/\/ecosystem\/.*/, "/ecosystem");
  return <SEO path={path} />;
}

function Router() {
  return (
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
