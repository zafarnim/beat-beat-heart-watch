import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { getSettings } from "@/lib/storage";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Scan from "./pages/Scan";
import ScanDetail from "./pages/ScanDetail";
import Settings from "./pages/Settings";
import History from "./pages/History";
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [navVisible, setNavVisible] = useState(() => getSettings().onboarded);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Poll for onboarded state changes (set by Onboarding page)
  useEffect(() => {
    const interval = setInterval(() => {
      const onboarded = getSettings().onboarded;
      if (onboarded && !navVisible) {
        setNavVisible(true);
      }
    }, 300);
    return () => clearInterval(interval);
  }, [navVisible]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="glass-bg" />
            <div className="relative mx-auto max-w-md min-h-screen">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/scan" element={<Scan />} />
                <Route path="/scan/:id" element={<ScanDetail />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/history" element={<History />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <BottomNav visible={navVisible} />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
