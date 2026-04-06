import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import MonitoringTargetsPage from "@/pages/MonitoringTargetsPage";
import SessionDetailPage from "@/pages/SessionDetailPage";
import MovieComparisonPage from "@/pages/MovieComparisonPage";
import CinemasPage from "@/pages/CinemasPage";
import CinemaDetailPage from "@/pages/CinemaDetailPage";
import ExportsPage from "@/pages/ExportsPage";
import SettingsPage from "@/pages/SettingsPage";
import NetworkDiscoveryPage from "@/pages/NetworkDiscoveryPage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/discovery" element={<NetworkDiscoveryPage />} />
            <Route path="/targets" element={<MonitoringTargetsPage />} />
            <Route path="/session/:id" element={<SessionDetailPage />} />
            <Route path="/movies" element={<MovieComparisonPage />} />
            <Route path="/cinemas" element={<CinemasPage />} />
            <Route path="/cinemas/:id" element={<CinemaDetailPage />} />
            <Route path="/exports" element={<ExportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
