import { useState } from "react";
import { useOptimizedScrimsData } from "@/hooks/useOptimizedScrimsData";
import { useScrimAnalytics } from "@/hooks/useScrimAnalytics";
import { AnalyticsFilterBar } from "@/components/analytics/AnalyticsFilterBar";
import { OverviewTab } from "@/components/analytics/OverviewTab";
import { AdvancedStatsTab } from "@/components/analytics/AdvancedStatsTab";
import { PlayerReportsTab } from "@/components/analytics/PlayerReportsTab";
import { DraftAnalysisTab } from "@/components/analytics/DraftAnalysisTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, BarChart2, Users, FileText, ChevronRight } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function Analytics() {
  // State for filters
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'season'>('month');
  const [matchType, setMatchType] = useState<'all' | 'scrim' | 'official'>('all');

  // Fetch data
  const { data, isLoading } = useOptimizedScrimsData();
  const scrims = data?.scrims || [];
  const analyticsData = useScrimAnalytics(scrims, timeRange);

  if (isLoading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1920px] mx-auto pb-10">
      {/* Compact Header & Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 rounded-2xl sticky top-24 z-20">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground pl-2">
          <span className="text-zinc-500">ScrimStats</span>
          <ChevronRight className="w-4 h-4 text-zinc-700" />
          <span className="text-white font-medium glow-text">Analytics</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          <AnalyticsFilterBar
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            matchType={matchType}
            onMatchTypeChange={setMatchType}
          />
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="w-full flex justify-start overflow-x-auto no-scrollbar bg-black/40 border-white/5 p-1 rounded-2xl h-auto">
          <TabsTrigger value="overview" className="flex items-center gap-2 px-4 py-2 text-xs font-bold data-[state=active]:bg-brand-primary/20 data-[state=active]:text-brand-primary rounded-xl transition-all">
            <LayoutDashboard className="w-3.5 h-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2 px-4 py-2 text-xs font-bold data-[state=active]:bg-brand-primary/20 data-[state=active]:text-brand-primary rounded-xl transition-all">
            <BarChart2 className="w-3.5 h-3.5" /> Advanced Stats
          </TabsTrigger>
          <TabsTrigger value="players" className="flex items-center gap-2 px-4 py-2 text-xs font-bold data-[state=active]:bg-brand-primary/20 data-[state=active]:text-brand-primary rounded-xl transition-all">
            <Users className="w-3.5 h-3.5" /> Player Reports
          </TabsTrigger>
          <TabsTrigger value="draft" className="flex items-center gap-2 px-4 py-2 text-xs font-bold data-[state=active]:bg-brand-primary/20 data-[state=active]:text-brand-primary rounded-xl transition-all">
            <FileText className="w-3.5 h-3.5" /> Draft Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab data={analyticsData} />
        </TabsContent>

        <TabsContent value="advanced">
          <AdvancedStatsTab data={analyticsData} />
        </TabsContent>

        <TabsContent value="players">
          <PlayerReportsTab data={analyticsData} />
        </TabsContent>

        <TabsContent value="draft">
          <DraftAnalysisTab data={analyticsData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
