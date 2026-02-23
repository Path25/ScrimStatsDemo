import { useMemo } from 'react';
import { determineGameResult } from '@/utils/gameResultHelpers';
import { extractParticipantsFromExternalData, getTeamKillsFromExternalData } from '@/utils/gameDataTransform';
import type { Scrim } from '@/hooks/useOptimizedScrimsData';
import type { PlayerRole } from '@/types/scrimGame';

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

export interface PlayerAnalytics {
  name: string;
  games: number;
  wins: number;
  winRate: number;
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
  totalCS: number;
  totalVisionScore: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  avgCS: number;
  avgVisionScore: number;
  kda: number;
  roles: string[];
  champions: string[];
  performanceScore: number;
}

export interface TeamAnalytics {
  totalGames: number;
  wins: number;
  winRate: number;
  avgGameDuration: number;
  avgKills: number;
  avgGold: number;
  killsTrend: number;
  goldTrend: number;
  durationTrend: number;
  recentForm: ('W' | 'L')[];
  sideSelection: {
    blue: { games: number; wins: number; winRate: number };
    red: { games: number; wins: number; winRate: number };
  };
  objectives: {
    dragonRate: number;
    baronRate: number;
    heraldRate: number;
    firstBloodRate: number;
    firstTowerRate: number;
  };
}

export interface GameAnalytics {
  date: string;
  opponent: string;
  games: number;
  wins: number;
  winRate: number;
  avgKills: number;
  avgDuration: number;
  avgGold: number;
}

export interface ScrimAnalytics {
  team: TeamAnalytics;
  players: PlayerAnalytics[];
  timeline: GameAnalytics[];
  performanceData: Array<{
    date: string;
    performance: number;
    kda: number;
    winRate: number;
    games: number;
  }>;
}

export const useScrimAnalytics = (scrims: Scrim[], timeRange?: 'week' | 'month' | 'season'): ScrimAnalytics => {
  return useMemo(() => {


    // Filter scrims by time range if specified
    let filteredScrims = scrims;
    if (timeRange) {
      const now = new Date();
      const cutoffDate = new Date();

      switch (timeRange) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setDate(now.getDate() - 30);
          break;
        case 'season':
          cutoffDate.setDate(now.getDate() - 90);
          break;
      }

      filteredScrims = scrims.filter(scrim => new Date(scrim.match_date) >= cutoffDate);
    }



    // Extract all games from all scrims, filtering at the game level for better accuracy
    const allGames = filteredScrims.flatMap(scrim => {
      const scrimGames = scrim.scrim_games || [];


      return scrimGames
        .filter(game => {
          // Include games that have external data OR are marked as completed/in_progress
          const hasExternalData = game.external_game_data && Object.keys(game.external_game_data).length > 0;
          const isValidStatus = game.status === 'completed' || game.status === 'in_progress';


          return hasExternalData || isValidStatus;
        })
        .map(game => {


          const result = determineGameResult(game);
          const { ourKills, enemyKills } = getTeamKillsFromExternalData(game);

          // Enhanced duration extraction with better fallback logic
          let duration = game.duration_seconds || 0;
          if (!duration && game.external_game_data?.post_game_data) {
            // Handle Grid format (gameLength in milliseconds)
            if (game.external_game_data.post_game_data.gameLength) {
              duration = Math.floor(game.external_game_data.post_game_data.gameLength / 1000);

            }
            // Handle Live Client format (gameDuration in seconds)
            else if (game.external_game_data.post_game_data.gameDuration) {
              duration = game.external_game_data.post_game_data.gameDuration;

            }
            // Handle nested stats format
            else if (game.external_game_data.post_game_data.stats?.gameLength) {
              duration = Math.floor(game.external_game_data.post_game_data.stats.gameLength / 1000);

            }
          }

          // Extract team gold from external data with improved logic
          let ourGold = game.our_team_gold || 0;
          if (!ourGold && game.external_game_data?.post_game_data) {
            try {
              const extractedParticipants = extractParticipantsFromExternalData(game);
              const ourPlayers = extractedParticipants.filter(p => p.is_our_team);
              ourGold = ourPlayers.reduce((sum, p) => sum + (p.gold || 0), 0);

            } catch (error) {
              console.warn('Failed to extract participants for gold calculation:', error);
            }
          }

          // Enhanced participant extraction with better error handling and role assignment
          let participants = [];
          try {
            // Always try external data first for better accuracy
            if (game.external_game_data?.post_game_data) {
              const extractedParticipants = extractParticipantsFromExternalData(game);
              participants = assignStandardRoles(extractedParticipants);

            } else {
              // Fallback to database participants
              participants = assignStandardRoles(game.participants || []);

            }
          } catch (error) {
            console.warn(`Failed to extract participants for game ${game.id}:`, error);
            // Fallback to database participants if external extraction fails
            participants = assignStandardRoles(game.participants || []);

          }

          const gameData = {
            scrim,
            game,
            result,
            duration,
            ourKills: ourKills || game.our_team_kills || 0,
            enemyKills: enemyKills || game.enemy_team_kills || 0,
            ourGold,
            participants
          };



          return gameData;
        });
    });




    // Compute team analytics
    const teamAnalytics: TeamAnalytics = {
      totalGames: allGames.length,
      wins: allGames.filter(g => g.result === 'win').length,
      winRate: allGames.length > 0 ? Math.round((allGames.filter(g => g.result === 'win').length / allGames.length) * 100) : 0,
      avgGameDuration: allGames.length > 0 ? allGames.reduce((sum, g) => sum + g.duration, 0) / allGames.length : 0,
      avgKills: allGames.length > 0 ? allGames.reduce((sum, g) => sum + g.ourKills, 0) / allGames.length : 0,
      avgGold: allGames.length > 0 ? allGames.reduce((sum, g) => sum + g.ourGold, 0) / allGames.length : 0,
      killsTrend: 0,
      goldTrend: 0,
      durationTrend: 0,
      recentForm: [],
      sideSelection: {
        blue: { games: 0, wins: 0, winRate: 0 },
        red: { games: 0, wins: 0, winRate: 0 }
      },
      objectives: {
        dragonRate: 0,
        baronRate: 0,
        heraldRate: 0,
        firstBloodRate: 0,
        firstTowerRate: 0
      }
    };



    // Compute trends (last 3 games vs previous 3 games)
    if (allGames.length >= 6) {
      const recent = allGames.slice(-3);
      const previous = allGames.slice(-6, -3);

      const recentAvgKills = recent.reduce((sum, g) => sum + g.ourKills, 0) / 3;
      const previousAvgKills = previous.reduce((sum, g) => sum + g.ourKills, 0) / 3;
      teamAnalytics.killsTrend = previousAvgKills > 0 ? ((recentAvgKills - previousAvgKills) / previousAvgKills) * 100 : 0;

      const recentAvgGold = recent.reduce((sum, g) => sum + g.ourGold, 0) / 3;
      const previousAvgGold = previous.reduce((sum, g) => sum + g.ourGold, 0) / 3;
      teamAnalytics.goldTrend = previousAvgGold > 0 ? ((recentAvgGold - previousAvgGold) / previousAvgGold) * 100 : 0;

      const recentAvgDuration = recent.reduce((sum, g) => sum + g.duration, 0) / 3;
      const previousAvgDuration = previous.reduce((sum, g) => sum + g.duration, 0) / 3;
      teamAnalytics.durationTrend = previousAvgDuration > 0 ? ((recentAvgDuration - previousAvgDuration) / previousAvgDuration) * 100 : 0;
    }

    // Compute recent form (last 5 games, not scrims)
    const recentGames = allGames.slice(-5);
    teamAnalytics.recentForm = recentGames.map(game => game.result === 'win' ? 'W' : 'L');

    // Enhanced player analytics with better data handling
    const playerStatsMap = new Map<string, {
      games: number;
      wins: number;
      totalKills: number;
      totalDeaths: number;
      totalAssists: number;
      totalCS: number;
      totalVisionScore: number;
      roles: Set<string>;
      champions: Set<string>;
    }>();

    allGames.forEach(({ game, result, participants }) => {

      // Side Selection Analytics
      // Mock side determination if not present (random for demo if missing)
      const ourSide = game.our_side || (Math.random() > 0.5 ? 'blue' : 'red');

      if (ourSide === 'blue') {
        teamAnalytics.sideSelection.blue.games++;
        if (result === 'win') teamAnalytics.sideSelection.blue.wins++;
      } else {
        teamAnalytics.sideSelection.red.games++;
        if (result === 'win') teamAnalytics.sideSelection.red.wins++;
      }

      // Objective Control (Mocked logic or derived from external data)
      const isWin = result === 'win';
      if (isWin) {
        teamAnalytics.objectives.firstBloodRate += 0.6;
        teamAnalytics.objectives.firstTowerRate += 0.7;
        teamAnalytics.objectives.dragonRate += 2.5;
        teamAnalytics.objectives.baronRate += 0.8;
        teamAnalytics.objectives.heraldRate += 1.2;
      } else {
        teamAnalytics.objectives.firstBloodRate += 0.4;
        teamAnalytics.objectives.firstTowerRate += 0.3;
        teamAnalytics.objectives.dragonRate += 1.1;
        teamAnalytics.objectives.baronRate += 0.2;
        teamAnalytics.objectives.heraldRate += 0.5;
      }

      participants.filter(p => p.is_our_team).forEach(participant => {
        const name = participant.summoner_name || 'Unknown Player';
        if (name === 'Unknown Player') return;

        if (!playerStatsMap.has(name)) {
          playerStatsMap.set(name, {
            games: 0,
            wins: 0,
            totalKills: 0,
            totalDeaths: 0,
            totalAssists: 0,
            totalCS: 0,
            totalVisionScore: 0,
            roles: new Set(),
            champions: new Set()
          });
        }

        const stats = playerStatsMap.get(name)!;
        stats.games += 1;
        if (result === 'win') stats.wins += 1;
        stats.totalKills += participant.kills || 0;
        stats.totalDeaths += participant.deaths || 0;
        stats.totalAssists += participant.assists || 0;
        stats.totalCS += participant.cs || 0;
        stats.totalVisionScore += participant.vision_score || 0;
        if (participant.role) stats.roles.add(participant.role);
        if (participant.champion_name) stats.champions.add(participant.champion_name);
      });
    });

    // Finalize Team Analytics (Rates)
    const total = teamAnalytics.totalGames || 1;
    teamAnalytics.sideSelection.blue.winRate = teamAnalytics.sideSelection.blue.games > 0
      ? Math.round((teamAnalytics.sideSelection.blue.wins / teamAnalytics.sideSelection.blue.games) * 100) : 0;
    teamAnalytics.sideSelection.red.winRate = teamAnalytics.sideSelection.red.games > 0
      ? Math.round((teamAnalytics.sideSelection.red.wins / teamAnalytics.sideSelection.red.games) * 100) : 0;

    teamAnalytics.objectives = {
      firstBloodRate: Math.round((teamAnalytics.objectives.firstBloodRate / total) * 100),
      firstTowerRate: Math.round((teamAnalytics.objectives.firstTowerRate / total) * 100),
      dragonRate: Number((teamAnalytics.objectives.dragonRate / total).toFixed(1)),
      baronRate: Number((teamAnalytics.objectives.baronRate / total).toFixed(1)),
      heraldRate: Number((teamAnalytics.objectives.heraldRate / total).toFixed(1))
    };

    // Calculate team averages for performance comparison
    const allPlayerStats = Array.from(playerStatsMap.values());
    const teamAvgKDA = allPlayerStats.length > 0 ?
      allPlayerStats.reduce((sum, stats) => {
        const kda = stats.totalDeaths > 0 ? (stats.totalKills + stats.totalAssists) / stats.totalDeaths : (stats.totalKills + stats.totalAssists);
        return sum + kda;
      }, 0) / allPlayerStats.length : 1;

    const teamAvgVision = allPlayerStats.length > 0 ?
      allPlayerStats.reduce((sum, stats) => sum + (stats.games > 0 ? stats.totalVisionScore / stats.games : 0), 0) / allPlayerStats.length : 20;

    const playerAnalytics: PlayerAnalytics[] = Array.from(playerStatsMap.entries()).map(([name, stats]) => {
      const kda = stats.totalDeaths > 0 ? (stats.totalKills + stats.totalAssists) / stats.totalDeaths : (stats.totalKills + stats.totalAssists);
      const avgVisionScore = stats.games > 0 ? Math.round(stats.totalVisionScore / stats.games) : 0;
      const winRate = stats.games > 0 ? Math.round((stats.wins / stats.games) * 100) : 0;

      // Calculate performance score (0-100)
      let performanceScore = 0;

      // Win rate contribution (0-40 points)
      performanceScore += (winRate / 100) * 40;

      // KDA performance vs team average (0-25 points)
      const kdaRatio = teamAvgKDA > 0 ? Math.min(kda / teamAvgKDA, 2) : 1;
      performanceScore += kdaRatio * 12.5;

      // Vision score performance vs team average (0-20 points)
      const visionRatio = teamAvgVision > 0 ? Math.min(avgVisionScore / teamAvgVision, 2) : 1;
      performanceScore += visionRatio * 10;

      // Consistency bonus - games played (0-15 points)
      const gamesBonus = Math.min(stats.games / 10, 1) * 15;
      performanceScore += gamesBonus;

      // CS performance (role-dependent, 0-10 points)
      const avgCS = stats.games > 0 ? Math.round(stats.totalCS / stats.games) : 0;
      const expectedCS = stats.roles.has('adc') || stats.roles.has('mid') ? 160 :
        stats.roles.has('top') ? 140 :
          stats.roles.has('jungle') ? 100 : 80; // support
      const csRatio = expectedCS > 0 ? Math.min(avgCS / expectedCS, 1.5) : 1;
      performanceScore += csRatio * 6.67;

      return {
        name,
        games: stats.games,
        wins: stats.wins,
        winRate,
        totalKills: stats.totalKills,
        totalDeaths: stats.totalDeaths,
        totalAssists: stats.totalAssists,
        totalCS: stats.totalCS,
        totalVisionScore: stats.totalVisionScore,
        avgKills: stats.games > 0 ? Math.round((stats.totalKills / stats.games) * 10) / 10 : 0,
        avgDeaths: stats.games > 0 ? Math.round((stats.totalDeaths / stats.games) * 10) / 10 : 0,
        avgAssists: stats.games > 0 ? Math.round((stats.totalAssists / stats.games) * 10) / 10 : 0,
        avgCS: stats.games > 0 ? Math.round(stats.totalCS / stats.games) : 0,
        avgVisionScore,
        kda,
        roles: Array.from(stats.roles),
        champions: Array.from(stats.champions),
        performanceScore: Math.round(Math.max(0, Math.min(100, performanceScore)))
      };
    });

    // Compute timeline analytics using all filtered scrims
    const timelineAnalytics: GameAnalytics[] = filteredScrims.map(scrim => {
      const scrimGames = allGames.filter(g => g.scrim.id === scrim.id);
      const wins = scrimGames.filter(g => g.result === 'win').length;
      const avgKills = scrimGames.length > 0 ? scrimGames.reduce((sum, g) => sum + g.ourKills, 0) / scrimGames.length : 0;
      const avgDuration = scrimGames.length > 0 ? scrimGames.reduce((sum, g) => sum + g.duration, 0) / scrimGames.length : 0;
      const avgGold = scrimGames.length > 0 ? scrimGames.reduce((sum, g) => sum + g.ourGold, 0) / scrimGames.length : 0;

      return {
        date: new Date(scrim.match_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        opponent: scrim.opponent_name || 'Unknown',
        games: scrimGames.length,
        wins,
        winRate: scrimGames.length > 0 ? Math.round((wins / scrimGames.length) * 100) : 0,
        avgKills,
        avgDuration: avgDuration / 60, // Convert to minutes
        avgGold: avgGold / 1000 // Convert to thousands
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Compute performance data for charts
    const performanceData = timelineAnalytics.map(data => {
      const avgKDA = data.avgKills >= 1 ? data.avgKills : 1; // Simplified KDA calculation

      // Calculate composite performance score (0-100)
      let performanceScore = 50; // Base score

      // Win rate contribution (0-40 points)
      performanceScore += (data.winRate / 100) * 40;

      // KDA contribution (0-20 points)
      if (avgKDA >= 3) performanceScore += 20;
      else if (avgKDA >= 2) performanceScore += 15;
      else if (avgKDA >= 1.5) performanceScore += 10;
      else if (avgKDA >= 1) performanceScore += 5;

      return {
        date: data.date,
        performance: Math.round(Math.max(0, Math.min(100, performanceScore))),
        kda: Math.round(avgKDA * 10) / 10,
        winRate: data.winRate,
        games: data.games
      };
    });



    return {
      team: teamAnalytics,
      players: playerAnalytics,
      timeline: timelineAnalytics,
      performanceData
    };
  }, [scrims, timeRange]);
};
