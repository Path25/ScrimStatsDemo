
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { EnhancedDashboardLayout } from "@/components/layout/EnhancedDashboardLayout";
import { AuthGuard } from "@/components/access-control/AuthGuard";
import { TenantGuard } from "@/components/access-control/TenantGuard";
import Index from "@/pages/Index";
import Overview from "@/pages/Overview";
import Players from "@/pages/Players";
import Scrims from "@/pages/Scrims";
import Analytics from "@/pages/Analytics";
import Calendar from "@/pages/Calendar";
import SoloQTracker from "@/pages/SoloQTracker";
import Settings from "@/pages/Settings";
import Scouting from "@/pages/Scouting";
import OpponentTeamDetail from "@/pages/OpponentTeamDetail";
import OpponentPlayerDetail from "@/pages/OpponentPlayerDetail";
import DraftAnalysis from "@/pages/DraftAnalysis";
import Resources from "@/pages/Resources";
import AIAssistant from "@/pages/AIAssistant";
import ProData from "@/pages/ProData";
import WaitingForAccess from "@/pages/WaitingForAccess";
import { GameDetailsView } from "@/components/scrims/GameDetailsView";
import { ScrimBlockView } from "@/components/scrims/ScrimBlockView";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";

const GameDetailsPage = () => {
  const { scrimId, gameId } = useParams();
  const navigate = useNavigate();

  return (
    <AuthGuard>
      <TenantGuard>
        <GameDetailsView
          scrimId={scrimId || ""}
          gameId={gameId}
          onClose={() => navigate("/scrims")}
        />
      </TenantGuard>
    </AuthGuard>
  );
};

const ScrimBlockPage = () => {
  const { scrimId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  return (
    <AuthGuard>
      <TenantGuard>
        <ScrimBlockView
          scrimId={scrimId || ""}
          opponentName={searchParams.get('opponent') || undefined}
          matchDate={searchParams.get('date') || undefined}
          format={searchParams.get('format') || undefined}
          result={searchParams.get('result') || undefined}
          onClose={() => navigate("/scrims")}
        />
      </TenantGuard>
    </AuthGuard>
  );
};

const AuthenticatedApp = () => {
  const { user } = useAuth();
  const { tenant, hasNoTenant } = useTenant();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If user is authenticated but has no tenant, show waiting page
  if (hasNoTenant) {
    return <WaitingForAccess />;
  }

  // If no tenant is loaded yet, let TenantGuard handle the loading state
  if (!tenant) {
    return (
      <TenantGuard>
        <div>Loading...</div>
      </TenantGuard>
    );
  }

  return (
    <EnhancedDashboardLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route
          path="/overview"
          element={
            <AuthGuard>
              <TenantGuard>
                <Overview />
              </TenantGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/players"
          element={
            <AuthGuard>
              <TenantGuard>
                <Players />
              </TenantGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/scrims"
          element={
            <AuthGuard>
              <TenantGuard>
                <Scrims />
              </TenantGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/scrims/:scrimId/game/:gameId"
          element={<GameDetailsPage />}
        />
        <Route
          path="/scrims/:scrimId"
          element={<ScrimBlockPage />}
        />
        <Route
          path="/analytics"
          element={
            <AuthGuard>
              <TenantGuard>
                <Analytics />
              </TenantGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/calendar"
          element={
            <AuthGuard>
              <TenantGuard>
                <Calendar />
              </TenantGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/soloq"
          element={
            <AuthGuard>
              <TenantGuard>
                <SoloQTracker />
              </TenantGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/settings"
          element={
            <AuthGuard>
              <TenantGuard>
                <Settings />
              </TenantGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/scouting"
          element={
            <AuthGuard>
              <TenantGuard>
                <Scouting />
              </TenantGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/scouting/teams/:teamId"
          element={
            <AuthGuard>
              <TenantGuard>
                <OpponentTeamDetail />
              </TenantGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/scouting/players/:playerId"
          element={
            <AuthGuard>
              <TenantGuard>
                <OpponentPlayerDetail />
              </TenantGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/draft-analysis"
          element={
            <AuthGuard>
              <TenantGuard>
                <DraftAnalysis />
              </TenantGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/resources"
          element={
            <AuthGuard>
              <TenantGuard>
                <Resources />
              </TenantGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/ai-assistant"
          element={
            <AuthGuard>
              <TenantGuard>
                <AIAssistant />
              </TenantGuard>
            </AuthGuard>
          }
        />
        <Route
          path="/pro-data"
          element={
            <AuthGuard>
              <TenantGuard>
                <ProData />
              </TenantGuard>
            </AuthGuard>
          }
        />
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
    </EnhancedDashboardLayout>
  );
};

export default AuthenticatedApp;
