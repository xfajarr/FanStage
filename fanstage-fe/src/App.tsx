import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Campaigns from "./pages/Campaigns";
import CampaignDetail from "./pages/CampaignDetail";
import Artists from "./pages/Artists";
import Dashboard from "./pages/Dashboard";
import Portfolio from "./pages/Portfolio";
import RegisterArtist from "./pages/RegisterArtist";
import CreateCampaign from "./pages/CreateCampaign";
import Staking from "./pages/Staking";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { PrivyContextProvider } from "./providers/PrivyProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PrivyContextProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/campaigns/:id" element={<CampaignDetail />} />
            <Route path="/artists" element={<Artists />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/register-artist" element={<RegisterArtist />} />
            <Route path="/create-campaign" element={<CreateCampaign />} />
            <Route path="/staking" element={<Staking />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </PrivyContextProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
