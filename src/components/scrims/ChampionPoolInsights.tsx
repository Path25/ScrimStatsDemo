
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, User, Users, Globe } from 'lucide-react';
import { useChampionPoolAnalysis } from '@/hooks/useChampionPoolAnalysis';
import { useTenant } from '@/contexts/TenantContext';

interface ChampionPoolInsightsProps {
  playerId?: string;
  teamView?: boolean;
}

export const ChampionPoolInsights: React.FC<ChampionPoolInsightsProps> = ({
  playerId,
  teamView = false
}) => {
  const { tenant } = useTenant();
  
  const individualAnalysis = useChampionPoolAnalysis({
    player_id: playerId,
    analysis_type: 'individual'
  });

  const teamAnalysis = useChampionPoolAnalysis({
    team_id: tenant?.id,
    analysis_type: 'team'
  });

  const metaAnalysis = useChampionPoolAnalysis({
    analysis_type: 'meta'
  });

  const renderIndividualAnalysis = () => {
    const data = individualAnalysis.data?.analysis;
    if (!data) return <div className="text-center py-4 text-muted-foreground">No individual data available</div>;

    return (
      <div className="space-y-6">
        {/* Champion Mastery */}
        <div>
          <h4 className="font-medium mb-3">Champion Mastery</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{data.champion_mastery?.total_champions || 0}</div>
              <div className="text-sm text-muted-foreground">Total Champions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{data.role_flexibility?.flexibility_score || 0}</div>
              <div className="text-sm text-muted-foreground">Role Flexibility</div>
            </div>
          </div>
          
          {data.champion_mastery?.mastery_distribution && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Expert (9-10)</span>
                <Badge variant="default">{data.champion_mastery.mastery_distribution.expert}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Proficient (7-8)</span>
                <Badge variant="secondary">{data.champion_mastery.mastery_distribution.proficient}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Comfortable (5-6)</span>
                <Badge variant="outline">{data.champion_mastery.mastery_distribution.comfortable}</Badge>
              </div>
            </div>
          )}
        </div>

        {/* Top Champions */}
        {data.champion_mastery?.top_champions && (
          <div>
            <h4 className="font-medium mb-3">Top Champions</h4>
            <div className="space-y-2">
              {data.champion_mastery.top_champions.map((champion: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 rounded border">
                  <div>
                    <span className="font-medium">{champion.champion}</span>
                    <span className="text-sm text-muted-foreground ml-2">({champion.games_played} games)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Comfort: {champion.comfort_level}/10
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      WR: {(champion.win_rate * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {data.recommendations && (
          <div>
            <h4 className="font-medium mb-3">Recommendations</h4>
            <div className="space-y-3">
              {data.recommendations.champions_to_practice?.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Champions to Practice:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {data.recommendations.champions_to_practice.map((champion: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">{champion}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {data.recommendations.underutilized_champions?.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Underutilized Champions:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {data.recommendations.underutilized_champions.map((champion: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">{champion}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTeamAnalysis = () => {
    const data = teamAnalysis.data?.analysis;
    if (!data) return <div className="text-center py-4 text-muted-foreground">No team data available</div>;

    return (
      <div className="space-y-6">
        {/* Team Champion Coverage */}
        {data.team_champion_coverage && (
          <div>
            <h4 className="font-medium mb-3">Champion Coverage</h4>
            <div className="text-center mb-4">
              <div className="text-2xl font-bold">{data.team_champion_coverage.total_unique_champions}</div>
              <div className="text-sm text-muted-foreground">Unique Champions</div>
            </div>
            
            {data.team_champion_coverage.champions_per_player && (
              <div className="space-y-2">
                {data.team_champion_coverage.champions_per_player.map((player: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{player.player_name}</span>
                    <Badge variant="outline">{player.champion_count} champions</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Flex Pick Potential */}
        {data.flex_pick_potential && (
          <div>
            <h4 className="font-medium mb-3">Flex Pick Potential</h4>
            <div className="text-center mb-4">
              <div className="text-2xl font-bold">{data.flex_pick_potential.flex_potential_score}</div>
              <div className="text-sm text-muted-foreground">Flex Champions</div>
            </div>
            
            {data.flex_pick_potential.flex_champions?.length > 0 && (
              <div className="space-y-2">
                {data.flex_pick_potential.flex_champions.map((flex: any, index: number) => (
                  <div key={index} className="p-2 rounded border">
                    <div className="font-medium">{flex.champion}</div>
                    <div className="text-sm text-muted-foreground">
                      Can be played by: {flex.players.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Draft Flexibility */}
        {data.draft_flexibility && (
          <div>
            <h4 className="font-medium mb-3">Draft Flexibility</h4>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-lg font-bold">{data.draft_flexibility.team_flexibility_score.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Avg Pool Size</div>
              </div>
              <div className="flex-1">
                <Badge 
                  variant={
                    data.draft_flexibility.flexibility_rating === 'high' ? 'default' :
                    data.draft_flexibility.flexibility_rating === 'medium' ? 'secondary' : 'destructive'
                  }
                >
                  {data.draft_flexibility.flexibility_rating} flexibility
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMetaAnalysis = () => {
    const data = metaAnalysis.data?.analysis;
    if (!data) return <div className="text-center py-4 text-muted-foreground">No meta data available</div>;

    return (
      <div className="space-y-6">
        {/* Meta Champions */}
        {data.meta_champions && (
          <div>
            <h4 className="font-medium mb-3">Meta Champions</h4>
            <div className="space-y-2">
              {data.meta_champions.slice(0, 10).map((champion: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 rounded border">
                  <span className="font-medium">{champion.champion}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Picks: {champion.pick_rate}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      WR: {champion.win_rate}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Emerging Picks */}
        {data.emerging_picks?.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Emerging Picks</h4>
            <div className="flex flex-wrap gap-2">
              {data.emerging_picks.map((pick: any, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {pick.champion} ({pick.recent_picks})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Power Picks */}
        {data.power_picks?.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Power Picks</h4>
            <div className="flex flex-wrap gap-2">
              {data.power_picks.map((pick: any, index: number) => (
                <Badge key={index} variant="default" className="text-xs">
                  {pick.champion}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Ban Worthy */}
        {data.ban_worthy_champions?.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Ban Worthy Champions</h4>
            <div className="flex flex-wrap gap-2">
              {data.ban_worthy_champions.map((champion: any, index: number) => (
                <Badge key={index} variant="destructive" className="text-xs">
                  {champion.champion}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!playerId && !teamView) {
    return null;
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Champion Pool Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={playerId ? "individual" : "team"}>
          <TabsList className="grid w-full grid-cols-3">
            {playerId && (
              <TabsTrigger value="individual" className="flex items-center gap-1">
                <User className="h-3 w-3" />
                Individual
              </TabsTrigger>
            )}
            <TabsTrigger value="team" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Team
            </TabsTrigger>
            <TabsTrigger value="meta" className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              Meta
            </TabsTrigger>
          </TabsList>

          {playerId && (
            <TabsContent value="individual">
              {individualAnalysis.isLoading ? (
                <div className="text-center py-4">Loading individual analysis...</div>
              ) : (
                renderIndividualAnalysis()
              )}
            </TabsContent>
          )}

          <TabsContent value="team">
            {teamAnalysis.isLoading ? (
              <div className="text-center py-4">Loading team analysis...</div>
            ) : (
              renderTeamAnalysis()
            )}
          </TabsContent>

          <TabsContent value="meta">
            {metaAnalysis.isLoading ? (
              <div className="text-center py-4">Loading meta analysis...</div>
            ) : (
              renderMetaAnalysis()
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
