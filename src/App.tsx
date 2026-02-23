import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Overview from "@/pages/Overview";
import Players from "@/pages/Players";
import Scrims from "@/pages/Scrims";
import Analytics from "@/pages/Analytics";
import Calendar from "@/pages/Calendar";
import SoloQTracker from "@/pages/SoloQTracker";
import Settings from "@/pages/Settings";
import Scouting from "@/pages/Scouting";
import ScoutingTeamReport from "@/pages/ScoutingTeamReport";
import DraftAnalysis from "@/pages/DraftAnalysis";
import Resources from "@/pages/Resources";
import AIAssistant from "@/pages/AIAssistant";
import ProData from "@/pages/ProData";
import NotFound from "@/pages/NotFound";
import { ScrimBlockView } from "@/components/scrims/ScrimBlockView";
import { useParams, useNavigate } from "react-router-dom";

import { RoleProvider } from "@/contexts/RoleContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

// Wrapper component for Scrim Block route
const ScrimBlockPage = () => {
  const { scrimId } = useParams();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);

  return (
    <ScrimBlockView
      scrimId={scrimId || ""}
      opponentName={searchParams.get('opponent') || undefined}
      matchDate={searchParams.get('date') || undefined}
      format={searchParams.get('format') || undefined}
      result={searchParams.get('result') || undefined}
      onClose={() => navigate("/scrims")}
    />
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <AuthProvider>
        <TenantProvider>
          <RoleProvider>
            <BrowserRouter>
              <DashboardLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/overview" replace />} />
                  <Route path="/overview" element={<Overview />} />
                  <Route path="/players" element={<Players />} />
                  <Route path="/scrims" element={<Scrims />} />
                  <Route path="/scrims/:scrimId" element={<ScrimBlockPage />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/soloq" element={<SoloQTracker />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/scouting" element={<Scouting />} />
                  <Route path="/scouting/teams/:id" element={<ScoutingTeamReport />} />
                  <Route path="/draft-analysis" element={<DraftAnalysis />} />
                  <Route path="/resources" element={<Resources />} />
                  <Route path="/ai-assistant" element={<AIAssistant />} />
                  <Route path="/pro-data" element={<ProData />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </DashboardLayout>
            </BrowserRouter>
          </RoleProvider>
        </TenantProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
