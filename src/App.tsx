import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "@/lib/router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { WorkspaceGate } from "@/components/auth/WorkspaceGate";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RoleProvider } from "@/contexts/RoleContext";
import { TenantProvider } from "@/contexts/TenantContext";
import NotFound from "@/pages/NotFound";

const Landing = lazy(() => import("@/pages/Landing"));
const RequestAccess = lazy(() => import("@/pages/RequestAccess"));
const SignIn = lazy(() => import("@/pages/SignIn"));
const Workspaces = lazy(() => import("@/pages/Workspaces"));
const AcceptInvite = lazy(() => import("@/pages/AcceptInvite"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const TrustPage = lazy(() => import("@/pages/TrustPage"));
const PilotOperations = lazy(() => import("@/pages/PilotOperations"));

const Analytics = lazy(() => import("@/pages/Analytics"));
const Calendar = lazy(() => import("@/pages/Calendar"));
const CoachingActions = lazy(() => import("@/pages/CoachingActions"));
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

const workspacePaths = ["/overview/*?", "/players/*?", "/scrims/*?", "/calendar/*?", "/actions/*?", "/collector/*?", "/analytics/*?", "/soloq/*?", "/scouting/*?", "/draft/*?", "/preparation/*?", "/integrations/*?", "/settings/*?"];

function AuthAwareNotFound() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="public-page grid min-h-screen place-items-center text-sm">Checking route…</div>;
  return <NotFound authenticated={Boolean(user)} />;
}

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
            <Route path="/actions" element={<CoachingActions />} />
            <Route path="/collector" element={<CollectorWorkspace />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/soloq" element={<SoloQTracker />} />
            <Route path="/scouting" element={<Scouting />} />
            <Route path="/scouting/:opponentId" element={<ScoutingTeamReport />} />
            <Route path="/draft" element={<Draft />} />
            <Route path="/preparation" element={<LegacyPreparationRedirect />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound authenticated />} />
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
                <ErrorBoundary>
                <Suspense fallback={<div className="public-page grid min-h-screen place-items-center text-sm">Loading ScrimStats…</div>}>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/sign-in" element={<SignIn />} />
                  <Route path="/accept-invite" element={<AcceptInvite />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/workspaces" element={<Workspaces />} />
                  <Route path="/request-access" element={<RequestAccess />} />
                  <Route path="/privacy" element={<TrustPage />} />
                  <Route path="/terms" element={<TrustPage />} />
                  <Route path="/support" element={<TrustPage />} />
                  <Route path="/status" element={<TrustPage />} />
                  <Route path="/ops" element={<PilotOperations />} />
                  {workspacePaths.map((path) => <Route key={path} path={path} element={<AppWorkspace />} />)}
                  <Route path="*" element={<AuthAwareNotFound />} />
                </Routes>
                </Suspense>
                </ErrorBoundary>
              </RoleProvider>
            </TenantProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
