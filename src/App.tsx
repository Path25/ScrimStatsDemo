import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { WorkspaceGate } from "@/components/auth/WorkspaceGate";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { RoleProvider } from "@/contexts/RoleContext";
import { TenantProvider } from "@/contexts/TenantContext";
import Landing from "@/pages/Landing";
import RequestAccess from "@/pages/RequestAccess";
import SignIn from "@/pages/SignIn";
import Workspaces from "@/pages/Workspaces";

const Analytics = lazy(() => import("@/pages/Analytics"));
const Calendar = lazy(() => import("@/pages/Calendar"));
const CollectorWorkspace = lazy(() => import("@/pages/CollectorWorkspace"));
const Integrations = lazy(() => import("@/pages/Integrations"));
const Overview = lazy(() => import("@/pages/Overview"));
const Players = lazy(() => import("@/pages/Players"));
const Draft = lazy(() => import("@/pages/Draft"));
const Scouting = lazy(() => import("@/pages/Scouting"));
const ScoutingTeamReport = lazy(() => import("@/pages/ScoutingTeamReport"));
const Scrims = lazy(() => import("@/pages/Scrims"));
const Settings = lazy(() => import("@/pages/Settings"));
const SoloQTracker = lazy(() => import("@/pages/SoloQTracker"));
const ScrimBlockView = lazy(() =>
  import("@/components/scrims/ScrimBlockView").then((module) => ({
    default: module.ScrimBlockView,
  })),
);

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function ScrimBlockPage() {
  const { scrimId } = useParams();
  const navigate = useNavigate();
  return (
    <ScrimBlockView
      scrimId={scrimId || ""}
      onClose={() => navigate("/scrims")}
    />
  );
}

function LegacyPreparationRedirect() {
  const { search } = useLocation();
  const legacy = new URLSearchParams(search);
  const current = new URLSearchParams();
  const planId = legacy.get("plan") || legacy.get("brief");
  const scenarioId = legacy.get("scenario");
  if (planId) current.set("plan", planId);
  if (scenarioId) current.set("scenario", scenarioId);
  return <Navigate to={`/draft${current.size ? `?${current}` : ""}`} replace />;
}

function AppWorkspace() {
  return (
    <WorkspaceGate>
      <DashboardLayout>
        <Suspense
          fallback={
            <div className="grid min-h-[50vh] place-items-center text-sm text-muted-foreground">
              Loading workspace…
            </div>
          }
        >
          <Routes>
            <Route path="/overview" element={<Overview />} />
            <Route path="/players" element={<Players />} />
            <Route path="/scrims" element={<Scrims />} />
            <Route path="/scrims/:scrimId" element={<ScrimBlockPage />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/collector" element={<CollectorWorkspace />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/soloq" element={<SoloQTracker />} />
            <Route path="/scouting" element={<Scouting />} />
            <Route path="/scouting/:opponentId" element={<ScoutingTeamReport />} />
            <Route path="/draft" element={<Draft />} />
            <Route path="/preparation" element={<LegacyPreparationRedirect />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        </Suspense>
      </DashboardLayout>
    </WorkspaceGate>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <AuthProvider>
            <TenantProvider>
              <RoleProvider>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/sign-in" element={<SignIn />} />
                  <Route path="/workspaces" element={<Workspaces />} />
                  <Route path="/request-access" element={<RequestAccess />} />
                  <Route path="/*" element={<AppWorkspace />} />
                </Routes>
              </RoleProvider>
            </TenantProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
