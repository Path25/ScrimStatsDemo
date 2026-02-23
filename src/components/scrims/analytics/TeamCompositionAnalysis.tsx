
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Sword, Zap, Clock, Target } from 'lucide-react';
import { extractParticipantsFromExternalData } from '@/utils/gameDataTransform';
import { cn } from '@/lib/utils';
import type { ScrimGame, ScrimParticipant } from '@/types/scrimGame';
import type { PlayerRole } from '@/types/scrimGame';

interface TeamCompositionAnalysisProps {
  game: ScrimGame;
  participants: ScrimParticipant[];
}

// Auto-assign roles in standard order: Top, Jungle, Mid, ADC, Support
const assignStandardRoles = (participants: any[]) => {
  const standardRoles: PlayerRole[] = ['top', 'jungle', 'mid', 'adc', 'support'];

  // Separate teams
  const ourTeam = participants.filter(p => p.is_our_team);
  const enemyTeam = participants.filter(p => !p.is_our_team);

  // Assign roles to our team
  const ourTeamWithRoles = ourTeam.map((participant, index) => ({
    ...participant,
    role: standardRoles[index] || 'top'
  }));

  // Assign roles to enemy team
  const enemyTeamWithRoles = enemyTeam.map((participant, index) => ({
    ...participant,
    role: standardRoles[index] || 'top'
  }));

  return [...ourTeamWithRoles, ...enemyTeamWithRoles];
};

export const TeamCompositionAnalysis: React.FC<TeamCompositionAnalysisProps> = ({ game, participants }) => {
  // Use the same participant selection logic as other analytics components
  let effectiveParticipants = [];

  try {
    if (game.external_game_data?.post_game_data) {
      const extractedParticipants = extractParticipantsFromExternalData(game);
      effectiveParticipants = assignStandardRoles(extractedParticipants);
    } else {
      effectiveParticipants = assignStandardRoles(participants || []);
    }
  } catch (error) {
    console.warn('Failed to extract participants for team composition:', error);
    effectiveParticipants = assignStandardRoles(participants || []);
  }

  if (effectiveParticipants.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="text-center py-12">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Draft Analysis Unavailable</h3>
          <p className="text-muted-foreground">
            Team composition analysis will appear here when draft data is available
          </p>
        </CardContent>
      </Card>
    );
  }

  const ourTeam = effectiveParticipants.filter(p => p.is_our_team);
  const enemyTeam = effectiveParticipants.filter(p => !p.is_our_team);

  const ourPicks = ourTeam.map(p => ({
    champion: p.champion_name || 'Unknown',
    role: p.role || 'Unknown'
  }));

  const enemyPicks = enemyTeam.map(p => ({
    champion: p.champion_name || 'Unknown',
    role: p.role || 'Unknown'
  }));

  // Enhanced composition type analysis
  const getCompType = (teamParticipants: any[]) => {
    const champions = teamParticipants.map(p => p.champion_name?.toLowerCase() || '');

    // Define champion categories
    const teamfightChamps = ['malphite', 'amumu', 'orianna', 'yasuo', 'miss fortune', 'kennen', 'wukong', 'sejuani', 'galio', 'azir'];
    const pickChamps = ['leblanc', 'zed', 'talon', 'rengar', 'kha\'zix', 'evelynn', 'qiyana', 'akali', 'fizz', 'katarina'];
    const splitChamps = ['fiora', 'jax', 'tryndamere', 'yorick', 'nasus', 'camille', 'irelia', 'gwen', 'shen'];
    const siegeChamps = ['ziggs', 'xerath', 'jayce', 'varus', 'caitlyn', 'jinx', 'azir', 'vel\'koz', 'kog\'maw'];
    const protectChamps = ['lulu', 'janna', 'karma', 'thresh', 'braum', 'zilean', 'yuumi', 'enchanter'];
    const earlyChamps = ['pantheon', 'renekton', 'draven', 'lucian', 'graves', 'lee sin', 'elise', 'olaf'];
    const scalingChamps = ['kassadin', 'kayle', 'gangplank', 'twitch', 'vayne', 'corki', 'anivia', 'vladimir'];

    // Count champion types
    const teamfightCount = champions.filter(champ => teamfightChamps.some(tf => champ.includes(tf))).length;
    const pickCount = champions.filter(champ => pickChamps.some(pick => champ.includes(pick))).length;
    const splitCount = champions.filter(champ => splitChamps.some(split => champ.includes(split))).length;
    const siegeCount = champions.filter(champ => siegeChamps.some(siege => champ.includes(siege))).length;
    const protectCount = champions.filter(champ => protectChamps.some(protect => champ.includes(protect))).length;
    const earlyCount = champions.filter(champ => earlyChamps.some(early => champ.includes(early))).length;
    const scalingCount = champions.filter(champ => scalingChamps.some(scaling => champ.includes(scaling))).length;

    const compTypes = [
      { type: 'teamfight', count: teamfightCount },
      { type: 'pick', count: pickCount },
      { type: 'split', count: splitCount },
      { type: 'siege', count: siegeCount },
      { type: 'protect', count: protectCount }
    ];

    const primaryComp = compTypes.sort((a, b) => b.count - a.count)[0];

    if (primaryComp.count < 2) {
      if (scalingCount >= 2) return 'scaling';
      if (earlyCount >= 2) return 'early_game';
    }

    return primaryComp.count >= 2 ? primaryComp.type : 'standard';
  };

  const ourCompType = getCompType(ourTeam);
  const enemyCompType = getCompType(enemyTeam);

  const getCompTypeColor = (compType: string) => {
    switch (compType?.toLowerCase()) {
      case 'teamfight': return 'bg-green-500/20 text-green-400 border-green-400';
      case 'pick': return 'bg-purple-500/20 text-purple-400 border-purple-400';
      case 'split': return 'bg-orange-500/20 text-orange-400 border-orange-400';
      case 'siege': return 'bg-yellow-500/20 text-yellow-400 border-yellow-400';
      case 'protect': return 'bg-pink-500/20 text-pink-400 border-pink-400';
      case 'scaling': return 'bg-indigo-500/20 text-indigo-400 border-indigo-400';
      case 'early_game': return 'bg-red-500/20 text-red-400 border-red-400';
      case 'standard': return 'bg-blue-500/20 text-blue-400 border-blue-400';
      default: return 'bg-muted/20 text-muted-foreground border-border';
    }
  };

  const getPowerSpikes = (compType: string) => {
    switch (compType) {
      case 'early_game': return { early: 9, mid: 6, late: 3 };
      case 'pick': return { early: 7, mid: 8, late: 5 };
      case 'teamfight': return { early: 4, mid: 7, late: 9 };
      case 'scaling': return { early: 3, mid: 6, late: 10 };
      case 'siege': return { early: 5, mid: 9, late: 7 };
      case 'protect': return { early: 4, mid: 6, late: 9 };
      case 'split': return { early: 6, mid: 8, late: 7 };
      default: return { early: 6, mid: 7, late: 6 };
    }
  };

  const ourPowerSpikes = getPowerSpikes(ourCompType);
  const enemyPowerSpikes = getPowerSpikes(enemyCompType);

  const getPowerSpikeColor = (strength: number) => {
    if (strength >= 8) return 'text-green-400';
    if (strength >= 6) return 'text-yellow-400';
    if (strength >= 4) return 'text-orange-400';
    return 'text-red-400';
  };

  const WIN_CONDITIONS: Record<string, string[]> = {
    teamfight: [
      "Force 5v5 contests on dragons and barons where your AOE excellence shines.",
      "Stack ultimates for devastating wombo-combos.",
      "Avoid getting flanked; play front-to-back."
    ],
    pick: [
      "Sweep enemy jungle vision to find isolated targets.",
      "Play around fog of war and bushes to ambush rotating enemies.",
      "Avoid straight 5v5 if the enemy has a better teamfight comp."
    ],
    split: [
      "Pressure side lanes to pull enemies away from main objectives.",
      "Play for 'cross-map' trades (e.g., take Herald if they go for Dragon).",
      "Avoid grouped fights where your split-pusher is less effective."
    ],
    siege: [
      "Establish early mid-lane control to poke enemies under tower.",
      "Prioritize Rift Heralds to accelerate tower destruction.",
      "Keep distance and avoid hard-engage from the enemy."
    ],
    protect: [
      "Funnel resources into your primary carry (hypercarry).",
      "Play defensively and wait for the enemy to overextend.",
      "Neutralize enemy dive threats with peel and utility."
    ],
    scaling: [
      "Minimize risks in early-game and trade objectives for time.",
      "Focus on gold generation and reaching 3-item power spikes.",
      "Avoid lane-dominant matchups and aggressive invades."
    ],
    early_game: [
      "Invade enemy jungle and force early skirmishes.",
      "Dive vulnerable lanes to break towers before 14 minutes.",
      "Must maintain high tempo; if the game stalls, you lose value."
    ],
    standard: [
      "Maintain balanced map pressure and objective focus.",
      "React to enemy rotations and punish mistakes.",
      "Look for picks leading into teamfight objectives."
    ]
  };

  const ourWinConds = WIN_CONDITIONS[ourCompType] || WIN_CONDITIONS.standard;
  const enemyWinConds = WIN_CONDITIONS[enemyCompType] || WIN_CONDITIONS.standard;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-card border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-blue-400 flex items-center gap-2">
              <Sword className="h-5 w-5" />
              Our Team Composition
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Composition Type</span>
              <Badge className={getCompTypeColor(ourCompType)}>
                {ourCompType.replace('_', ' ')}
              </Badge>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Champions</h4>
              <div className="grid grid-cols-1 gap-1.5">
                {ourPicks.map((pick, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-blue-500/5 rounded-lg border border-blue-500/10">
                    <span className="font-medium text-sm">{pick.champion}</span>
                    <Badge variant="outline" className="text-[10px] uppercase h-5">
                      {pick.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-blue-400 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Win Conditions
              </h4>
              <ul className="space-y-1.5">
                {ourWinConds.map((cond, i) => (
                  <li key={i} className="text-xs text-zinc-400 flex items-start gap-2 leading-relaxed">
                    <span className="text-blue-500 mt-1">•</span>
                    {cond}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-red-500/20">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Enemy Team Composition
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Composition Type</span>
              <Badge className={getCompTypeColor(enemyCompType)}>
                {enemyCompType.replace('_', ' ')}
              </Badge>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Champions</h4>
              <div className="grid grid-cols-1 gap-1.5">
                {enemyPicks.map((pick, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-red-500/5 rounded-lg border border-red-500/10">
                    <span className="font-medium text-sm">{pick.champion}</span>
                    <Badge variant="outline" className="text-[10px] uppercase h-5">
                      {pick.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-red-400 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Win Conditions
              </h4>
              <ul className="space-y-1.5">
                {enemyWinConds.map((cond, i) => (
                  <li key={i} className="text-xs text-zinc-400 flex items-start gap-2 leading-relaxed">
                    <span className="text-red-500 mt-1">•</span>
                    {cond}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <Target className="h-5 w-5 text-brand-primary" />
            Strategic Draft Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-bold text-sm uppercase tracking-wider text-zinc-500">Power Spike Comparison</h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                {['Early', 'Mid', 'Late'].map((phase) => {
                  const phaseKey = phase.toLowerCase() as keyof typeof ourPowerSpikes;
                  const ourVal = ourPowerSpikes[phaseKey];
                  const enemyVal = enemyPowerSpikes[phaseKey];
                  const diff = ourVal - enemyVal;
                  return (
                    <div key={phase} className="p-2 rounded bg-white/[0.03] border border-white/5">
                      <div className="text-[10px] text-zinc-500 uppercase font-black">{phase}</div>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <span className={cn("text-lg font-bold", getPowerSpikeColor(ourVal))}>{ourVal}</span>
                        <span className="text-zinc-700 font-black">VS</span>
                        <span className={cn("text-lg font-bold", getPowerSpikeColor(enemyVal))}>{enemyVal}</span>
                      </div>
                      <div className={cn("text-[10px] font-bold", diff > 0 ? "text-green-500" : diff < 0 ? "text-red-500" : "text-zinc-600")}>
                        {diff > 0 ? `+${diff}` : diff}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-sm uppercase tracking-wider text-zinc-500">Draft Source</h4>
              <div className="p-4 rounded-xl bg-brand-primary/5 border border-brand-primary/20 flex items-center justify-between">
                <span className="text-sm text-zinc-400">Captured via</span>
                <Badge className="bg-brand-primary/10 text-brand-primary border-brand-primary/20">
                  {game.external_game_data?.grid_metadata ? 'Data Intelligence (GRID)' : 'Live Capture (Desktop)'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
