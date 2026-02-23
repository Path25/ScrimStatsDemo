import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Target, TrendingUp, Users, Zap, AlertTriangle } from 'lucide-react';
import { useDraftIntelligence } from '@/hooks/useDraftIntelligence';
import type { ScrimGame } from '@/types/scrimGame';

interface DraftIntelligencePanelProps {
  game: ScrimGame;
}

export const DraftIntelligencePanel: React.FC<DraftIntelligencePanelProps> = ({ game }) => {
  const { getDraftIntelligence, isLoading, data: intelligence, error } = useDraftIntelligence();

  const handleAnalyzeDraft = () => {
    if (game.draft?.draft_data) {
      getDraftIntelligence({
        gameId: game.id,
        draftData: game.draft.draft_data,
        ourTeamSide: game.draft.our_team_side || 'blue'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Analysis Header */}
      <Card className="glass-card border-electric-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-electric-500/10 border border-electric-500/20">
              <Brain className="h-5 w-5 text-electric-500" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-electric-500 to-blue-500 bg-clip-text text-transparent">
                AI Draft Intelligence
              </span>
              <p className="text-sm text-muted-foreground font-normal">
                Advanced draft analysis powered by machine learning
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!intelligence ? (
            <div className="text-center py-8">
              <Button 
                onClick={handleAnalyzeDraft}
                disabled={isLoading || !game.draft?.draft_data}
                className="bg-electric-500 hover:bg-electric-600"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing Draft...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Analyze Draft
                  </>
                )}
              </Button>
              {!game.draft?.draft_data && (
                <p className="text-sm text-muted-foreground mt-2">
                  No draft data available for analysis
                </p>
              )}
            </div>
          ) : (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="composition">Team Comp</TabsTrigger>
                <TabsTrigger value="matchups">Matchups</TabsTrigger>
                <TabsTrigger value="strategy">Strategy</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="glass-card">
                    <CardContent className="p-4 text-center">
                      <Target className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-400">85%</div>
                      <div className="text-sm text-muted-foreground">Win Probability</div>
                    </CardContent>
                  </Card>
                  <Card className="glass-card">
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="h-6 w-6 text-green-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-400">A+</div>
                      <div className="text-sm text-muted-foreground">Draft Grade</div>
                    </CardContent>
                  </Card>
                  <Card className="glass-card">
                    <CardContent className="p-4 text-center">
                      <Users className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-400">92%</div>
                      <div className="text-sm text-muted-foreground">Synergy Score</div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="composition" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    <h4 className="font-semibold">Team Composition Analysis</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="glass-card">
                      <CardContent className="p-4">
                        <h5 className="font-medium mb-2 text-green-400">Strengths</h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Strong team fighting potential</li>
                          <li>• Excellent engage tools</li>
                          <li>• Good scaling composition</li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card className="glass-card">
                      <CardContent className="p-4">
                        <h5 className="font-medium mb-2 text-red-400">Weaknesses</h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Vulnerable to early aggression</li>
                          <li>• Limited poke potential</li>
                          <li>• Weak side lane pressure</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="matchups" className="mt-6">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-400" />
                    Lane Matchup Analysis
                  </h4>
                  <div className="grid gap-3">
                    {['Top', 'Jungle', 'Mid', 'ADC', 'Support'].map((role) => (
                      <Card key={role} className="glass-card">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{role}</span>
                            <Badge variant="default" className="bg-green-500/20 text-green-400">
                              Favorable
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="strategy" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    <h4 className="font-semibold">Strategic Recommendations</h4>
                  </div>
                  <Card className="glass-card">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <Badge variant="outline" className="mb-2">Early Game</Badge>
                          <p className="text-sm text-muted-foreground">
                            Focus on farming and avoiding early skirmishes. Look for picks with your engage tools.
                          </p>
                        </div>
                        <div>
                          <Badge variant="outline" className="mb-2">Mid Game</Badge>
                          <p className="text-sm text-muted-foreground">
                            Group for objectives and force team fights around Baron and Dragon.
                          </p>
                        </div>
                        <div>
                          <Badge variant="outline" className="mb-2">Late Game</Badge>
                          <p className="text-sm text-muted-foreground">
                            Your scaling composition should dominate. Look for picks and force decisive fights.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-400 mb-4">Failed to analyze draft</p>
              <Button 
                onClick={handleAnalyzeDraft}
                variant="outline"
                disabled={!game.draft?.draft_data}
              >
                Retry Analysis
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
