
import type { ScrimGame, ScrimParticipant } from '@/types/scrimGame';

export interface TeamSummary {
  our_team: {
    kills: number;
    gold: number;
    cs: number;
  };
  enemy_team: {
    kills: number;
    gold: number;
    cs: number;
  };
  kill_participation: Array<{
    summoner_name: string;
    kp: string;
  }>;
}

export interface PerformanceAnalysis {
  mvp_candidate?: {
    summoner_name: string;
    kills: number;
    deaths: number;
    assists: number;
  };
  underperformer?: {
    summoner_name: string;
    kills: number;
    deaths: number;
    assists: number;
  };
  vision_control?: {
    our_vision_score: number;
    enemy_vision_score: number;
    vision_advantage: number;
  };
  damage_distribution: Array<{
    summoner_name: string;
    damage_dealt: number;
    damage_percentage: string;
  }>;
}

export function calculateTeamSummary(participants: ScrimParticipant[]): TeamSummary {
  const ourTeam = participants.filter(p => p.is_our_team);
  const enemyTeam = participants.filter(p => !p.is_our_team);

  const ourTeamKills = ourTeam.reduce((sum, p) => sum + (p.kills || 0), 0);
  const enemyTeamKills = enemyTeam.reduce((sum, p) => sum + (p.kills || 0), 0);

  const ourTeamGold = ourTeam.reduce((sum, p) => sum + (p.gold || 0), 0);
  const enemyTeamGold = enemyTeam.reduce((sum, p) => sum + (p.gold || 0), 0);

  const ourTeamCS = ourTeam.reduce((sum, p) => sum + (p.cs || 0), 0);
  const enemyTeamCS = enemyTeam.reduce((sum, p) => sum + (p.cs || 0), 0);

  // Calculate kill participation for our team
  const killParticipation = ourTeam.map(player => {
    const playerKills = player.kills || 0;
    const playerAssists = player.assists || 0;
    const participation = ourTeamKills > 0 ? ((playerKills + playerAssists) / ourTeamKills) * 100 : 0;
    
    return {
      summoner_name: player.summoner_name,
      kp: `${Math.round(participation)}%`
    };
  });

  return {
    our_team: {
      kills: ourTeamKills,
      gold: ourTeamGold,
      cs: ourTeamCS
    },
    enemy_team: {
      kills: enemyTeamKills,
      gold: enemyTeamGold,
      cs: enemyTeamCS
    },
    kill_participation: killParticipation
  };
}

export function calculatePerformanceAnalysis(participants: ScrimParticipant[]): PerformanceAnalysis {
  const ourTeam = participants.filter(p => p.is_our_team);
  
  // Find MVP candidate (highest KDA among our team)
  let mvpCandidate = ourTeam.reduce((best, current) => {
    const currentKDA = ((current.kills || 0) + (current.assists || 0)) / Math.max(current.deaths || 1, 1);
    const bestKDA = ((best.kills || 0) + (best.assists || 0)) / Math.max(best.deaths || 1, 1);
    return currentKDA > bestKDA ? current : best;
  }, ourTeam[0]);

  // Find underperformer (lowest KDA among our team)
  let underperformer = ourTeam.reduce((worst, current) => {
    const currentKDA = ((current.kills || 0) + (current.assists || 0)) / Math.max(current.deaths || 1, 1);
    const worstKDA = ((worst.kills || 0) + (worst.assists || 0)) / Math.max(worst.deaths || 1, 1);
    return currentKDA < worstKDA ? current : worst;
  }, ourTeam[0]);

  // Calculate vision control
  const ourVisionScore = ourTeam.reduce((sum, p) => sum + (p.vision_score || 0), 0);
  const enemyVisionScore = participants
    .filter(p => !p.is_our_team)
    .reduce((sum, p) => sum + (p.vision_score || 0), 0);

  // Calculate damage distribution
  const totalDamage = participants.reduce((sum, p) => sum + (p.damage_dealt || 0), 0);
  const damageDistribution = participants.map(player => {
    const damage = player.damage_dealt || 0;
    const percentage = totalDamage > 0 ? (damage / totalDamage) * 100 : 0;
    
    return {
      summoner_name: player.summoner_name,
      damage_dealt: damage,
      damage_percentage: `${Math.round(percentage)}%`
    };
  }).filter(p => p.damage_dealt > 0);

  return {
    mvp_candidate: mvpCandidate ? {
      summoner_name: mvpCandidate.summoner_name,
      kills: mvpCandidate.kills || 0,
      deaths: mvpCandidate.deaths || 0,
      assists: mvpCandidate.assists || 0
    } : undefined,
    underperformer: underperformer && underperformer !== mvpCandidate ? {
      summoner_name: underperformer.summoner_name,
      kills: underperformer.kills || 0,
      deaths: underperformer.deaths || 0,
      assists: underperformer.assists || 0
    } : undefined,
    vision_control: {
      our_vision_score: ourVisionScore,
      enemy_vision_score: enemyVisionScore,
      vision_advantage: ourVisionScore - enemyVisionScore
    },
    damage_distribution: damageDistribution
  };
}

export function extractTimelineData(game: ScrimGame) {
  // Try to extract timeline data from external game data or live data
  const postGameData = game.external_game_data?.post_game_data as any;
  
  if (postGameData?.timeline) {
    // Convert timeline data to the expected format
    return {
      gold_timeline: postGameData.timeline.map((frame: any, index: number) => ({
        time_seconds: index * 60, // Assuming frames are per minute
        gold_difference: (frame.our_gold || 0) - (frame.enemy_gold || 0)
      }))
    };
  }
  
  return null;
}
