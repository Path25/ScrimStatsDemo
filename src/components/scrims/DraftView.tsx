
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Sword, Crown, Clock } from 'lucide-react';
import { ChampionAvatar } from './ChampionAvatar';
import { useGameDrafts } from '@/hooks/useGameDrafts';
import { parseChampionSelectData } from '@/utils/championUtils';
import { TeamCompositionAnalysis } from './analytics/TeamCompositionAnalysis';
import type { ScrimGame, ScrimParticipant } from '@/types/scrimGame';

interface DraftViewProps {
  game: ScrimGame;
  participants: ScrimParticipant[];
}

export const DraftView: React.FC<DraftViewProps> = ({ game, participants }) => {
  // Fetch draft data from game_drafts table for live/desktop games
  const { draft: gameDraft } = useGameDrafts(game.id);

  console.log('DraftView Debug - Game ID:', game.id);
  console.log('DraftView Debug - Game Draft from hook:', gameDraft);
  console.log('DraftView Debug - External Game Data:', game.external_game_data);

  // Check for Grid draft data first, then fallback to database draft, then post game data
  const gridDraftData = game.external_game_data?.draft_data;
  const postGameData = game.external_game_data?.post_game_data;

  console.log('DraftView Debug - Grid Draft Data:', gridDraftData);
  console.log('DraftView Debug - Post Game Data:', postGameData);

  // Priority: 1. Grid draft data, 2. game_drafts table, 3. extracted from post game data
  let draftData = null;
  let draftSource = '';

  // Check Grid data first
  if (gridDraftData) {
    console.log('Using Grid draft data');
    draftData = gridDraftData;
    draftSource = 'Grid Data';
  }
  // Check game_drafts table for live/desktop games
  else if (gameDraft?.draft_data) {
    console.log('Using draft data from game_drafts table:', gameDraft.draft_data);

    // Type the draft data as any to access raw_champion_select
    const rawDraftData = gameDraft.draft_data as any;

    // Check if this is raw champion select data that needs parsing
    if (rawDraftData.raw_champion_select) {
      console.log('Found raw_champion_select data, parsing...');
      const parsedData = parseChampionSelectData(rawDraftData.raw_champion_select);

      // Convert parsed data to the expected format
      draftData = {
        picks: {
          blue: parsedData.ourTeam.map((player, index) => ({
            championName: player.championName,
            order: index + 1
          })).filter(pick => pick.championName && pick.championName !== 'None'),
          red: parsedData.theirTeam.map((player, index) => ({
            championName: player.championName,
            order: index + 1
          })).filter(pick => pick.championName && pick.championName !== 'None')
        },
        bans: {
          blue: parsedData.ourBans.map((ban, index) => ({
            championName: ban.championName,
            order: ban.order || index + 1
          })).filter(ban => ban.championName && ban.championName !== 'None'),
          red: parsedData.theirBans.map((ban, index) => ({
            championName: ban.championName,
            order: ban.order || index + 1
          })).filter(ban => ban.championName && ban.championName !== 'None')
        }
      };
      draftSource = 'Live Draft Data (Parsed)';
    } else {
      // Use the draft data as-is if it's already in the expected format
      draftData = gameDraft.draft_data;
      draftSource = 'Live Draft Data';
    }
  }
  // Extract from post game data as last resort
  else if (postGameData?.teams) {
    console.log('Extracting draft data from post game data');
    // Extract picks from post game data
    const extractedDraft = {
      picks: { blue: [], red: [] },
      bans: { blue: [], red: [] }
    };

    postGameData.teams.forEach((team: any) => {
      const teamSide = team.teamId === 100 ? 'blue' : 'red';
      const players = team.participants || [];

      players.forEach((player: any, index: number) => {
        if (player.championName) {
          extractedDraft.picks[teamSide].push({
            championName: player.championName,
            order: index + 1
          });
        }
      });
    });

    draftData = extractedDraft;
    draftSource = 'Extracted Data';
  }

  console.log('DraftView Debug - Final Draft Data:', draftData);
  console.log('DraftView Debug - Draft Source:', draftSource);

  // Check if we have valid draft data
  const hasValidDraft = draftData && (
    // Grid/Extracted format: { picks: { blue: [], red: [] } }
    (draftData.picks?.blue?.length > 0 || draftData.picks?.red?.length > 0) ||
    // Alternative format: { picks: [...] } (flat array)
    (Array.isArray(draftData.picks) && draftData.picks.length > 0)
  );

  console.log('DraftView Debug - Has Valid Draft:', hasValidDraft);

  if (!hasValidDraft) {
    const gameType = game.external_game_data?.grid_metadata ? 'Grid Game' :
      game.external_game_data?.post_game_data ? 'Live Client Game' :
        'Manual Game';

    return (
      <Card className="glass-card">
        <CardContent className="text-center py-12">
          <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Draft Data Not Available</h3>
          <p className="text-muted-foreground mb-4">
            No draft information was captured for this {gameType.toLowerCase()}.
          </p>
          <Badge variant="secondary">
            {gameType}
          </Badge>
          {!game.external_game_data && !gameDraft && (
            <p className="text-xs text-muted-foreground mt-2">
              Manual games require draft data to be entered manually.
            </p>
          )}
          {gameDraft && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-400">
                Debug: Found game draft with ID {gameDraft.id} but no valid draft data structure.
              </p>
              <p className="text-xs text-blue-300 mt-1">
                Raw data: {JSON.stringify(gameDraft.draft_data, null, 2)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Determine our side - check game_drafts first, then fallback to game data
  const ourSide = gameDraft?.our_team_side ||
    game.external_game_data?.grid_metadata?.ourTeamSide ||
    game.side ||
    'blue';
  const enemySide = ourSide === 'blue' ? 'red' : 'blue';

  // Extract picks and bans with proper fallbacks
  let ourPicks = [];
  let enemyPicks = [];
  let ourBans = [];
  let enemyBans = [];

  if (draftData.picks) {
    if (typeof draftData.picks === 'object' && !Array.isArray(draftData.picks)) {
      // Grid format: { blue: [], red: [] }
      ourPicks = draftData.picks[ourSide] || [];
      enemyPicks = draftData.picks[enemySide] || [];
    } else if (Array.isArray(draftData.picks)) {
      // Alternative format: flat array
      ourPicks = draftData.picks.filter((pick: any) => pick.team === ourSide) || [];
      enemyPicks = draftData.picks.filter((pick: any) => pick.team === enemySide) || [];
    }
  }

  if (draftData.bans) {
    if (typeof draftData.bans === 'object' && !Array.isArray(draftData.bans)) {
      // Grid format: { blue: [], red: [] }
      ourBans = draftData.bans[ourSide] || [];
      enemyBans = draftData.bans[enemySide] || [];
    } else if (Array.isArray(draftData.bans)) {
      // Alternative format: flat array
      ourBans = draftData.bans.filter((ban: any) => ban.team === ourSide) || [];
      enemyBans = draftData.bans.filter((ban: any) => ban.team === enemySide) || [];
    }
  }

  const TeamDraft: React.FC<{
    title: string,
    picks: any[],
    bans: any[],
    isOurTeam: boolean
  }> = ({ title, picks, bans, isOurTeam }) => (
    <div className={`space-y-4 ${isOurTeam ? 'border-blue-500/20' : 'border-red-500/20'} border rounded-lg p-4`}>
      <h3 className={`text-lg font-semibold ${isOurTeam ? 'text-blue-400' : 'text-red-400'}`}>
        {title}
      </h3>

      {/* Picks */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Sword className="h-4 w-4" />
          Champion Picks
        </h4>
        <div className="grid grid-cols-5 gap-3">
          {[0, 1, 2, 3, 4].map((index) => {
            const pick = picks[index];
            return (
              <div key={index} className={`p-3 rounded border text-center ${isOurTeam ? 'bg-blue-500/10 border-blue-500/20' : 'bg-red-500/10 border-red-500/20'
                }`}>
                {pick?.championName || pick?.champion_name || pick?.champion ? (
                  <div className="space-y-2">
                    <ChampionAvatar
                      championName={pick.championName || pick.champion_name || pick.champion}
                      size="sm"
                    />
                    <div className="text-xs font-medium">
                      {pick.championName || pick.champion_name || pick.champion}
                    </div>
                    {(pick?.order || pick?.pick_order) && (
                      <div className="text-xs text-muted-foreground">
                        Pick {pick.order || pick.pick_order}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-8 h-8 bg-muted rounded mx-auto" />
                    <div className="text-xs">Not picked</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bans */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Champion Bans
        </h4>
        <div className="grid grid-cols-5 gap-2">
          {[0, 1, 2, 3, 4].map((index) => {
            const ban = Array.isArray(bans) ? bans[index] : undefined;
            return (
              <div key={index} className={`p-2 rounded border text-center ${isOurTeam ? 'bg-blue-500/5 border-blue-500/10' : 'bg-red-500/5 border-red-500/10'
                }`}>
                {ban?.championName || ban?.champion_name || ban?.champion ? (
                  <div className="space-y-1">
                    <ChampionAvatar
                      championName={ban.championName || ban.champion_name || ban.champion}
                      size="sm"
                    />
                    <div className="text-xs">
                      {ban.championName || ban.champion_name || ban.champion}
                    </div>
                    {(ban?.order || ban?.ban_order) && (
                      <div className="text-xs text-muted-foreground">
                        Ban {ban.order || ban.ban_order}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs">No ban</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Team Composition Analysis - The Strategic Core */}
      <TeamCompositionAnalysis game={game} participants={participants} />

      {/* Team Drafts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamDraft
          title={`Our Team (${ourSide.charAt(0).toUpperCase() + ourSide.slice(1)} Side)`}
          picks={ourPicks}
          bans={ourBans}
          isOurTeam={true}
        />
        <TeamDraft
          title={`Enemy Team (${enemySide.charAt(0).toUpperCase() + enemySide.slice(1)} Side)`}
          picks={enemyPicks}
          bans={enemyBans}
          isOurTeam={false}
        />
      </div>

      {/* Draft Summary */}
      {(ourPicks.length > 0 || enemyPicks.length > 0) && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Draft Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Champions Picked:</span>
                <span className="font-medium">{ourPicks.length + enemyPicks.length}/10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Champions Banned:</span>
                <span className="font-medium">{ourBans.length + enemyBans.length}/10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Draft Source:</span>
                <Badge variant="outline">
                  {draftSource}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
