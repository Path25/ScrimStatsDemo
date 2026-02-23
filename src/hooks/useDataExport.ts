
import { useState } from 'react';
import { useScrimsData } from './useScrimsData';
import { usePlayersData } from './usePlayersData';
import { toast } from 'sonner';

interface ExportOptions {
  includeScrimData: boolean;
  includePlayerData: boolean;
  includeSoloQData: boolean;
  dateRange: {
    start: Date;
    end: Date;
  };
  format: 'csv' | 'json';
}

export const useDataExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { scrims } = useScrimsData();
  const { players } = usePlayersData();

  const exportData = async (options: ExportOptions) => {
    setIsExporting(true);
    
    try {
      const exportData: any = {
        exportDate: new Date().toISOString(),
        options: options,
        data: {}
      };

      // Filter data by date range
      const filteredScrims = scrims.filter(scrim => {
        const scrimDate = new Date(scrim.match_date);
        return scrimDate >= options.dateRange.start && scrimDate <= options.dateRange.end;
      });

      if (options.includeScrimData) {
        exportData.data.scrims = filteredScrims.map(scrim => ({
          id: scrim.id,
          opponent_name: scrim.opponent_name,
          match_date: scrim.match_date,
          result: scrim.result,
          our_score: scrim.our_score,
          opponent_score: scrim.opponent_score,
          status: scrim.status,
          format: scrim.format,
          duration_minutes: scrim.duration_minutes,
          notes: scrim.notes,
          games: scrim.scrim_games?.map(game => ({
            game_number: game.game_number,
            status: game.status,
            side: game.side,
            result: game.result,
            duration_seconds: game.duration_seconds,
            our_team_kills: game.our_team_kills,
            enemy_team_kills: game.enemy_team_kills,
            our_team_gold: game.our_team_gold,
            enemy_team_gold: game.enemy_team_gold,
            objectives: game.objectives,
            bans: game.bans,
            participants: game.participants?.map(p => ({
              summoner_name: p.summoner_name,
              champion_name: p.champion_name,
              role: p.role,
              is_our_team: p.is_our_team,
              kills: p.kills,
              deaths: p.deaths,
              assists: p.assists,
              cs: p.cs,
              gold: p.gold,
              damage_dealt: p.damage_dealt,
              damage_taken: p.damage_taken,
              vision_score: p.vision_score,
              level: p.level
            }))
          }))
        }));
      }

      if (options.includePlayerData) {
        exportData.data.players = players.map(player => ({
          id: player.id,
          summoner_name: player.summoner_name,
          riot_id: player.riot_id,
          role: player.role,
          rank: player.rank,
          lp: player.lp,
          discord_username: player.discord_username,
          is_active: player.is_active,
          join_date: player.join_date,
          last_soloq_sync: player.last_soloq_sync,
          main_champions: player.main_champions,
          notes: player.notes
        }));
      }

      // Calculate summary statistics
      exportData.summary = {
        totalScrims: filteredScrims.length,
        completedScrims: filteredScrims.filter(s => s.status === 'completed').length,
        totalGames: filteredScrims.reduce((sum, s) => sum + (s.scrim_games?.length || 0), 0),
        winRate: calculateWinRate(filteredScrims),
        averageGameDuration: calculateAverageGameDuration(filteredScrims),
        activePlayers: players.filter(p => p.is_active).length
      };

      // Export based on format
      if (options.format === 'json') {
        downloadJSON(exportData, `scrim-data-export-${new Date().toISOString().split('T')[0]}.json`);
      } else {
        downloadCSV(exportData, `scrim-data-export-${new Date().toISOString().split('T')[0]}.csv`);
      }

      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const calculateWinRate = (scrims: any[]) => {
    const completedScrims = scrims.filter(s => s.status === 'completed');
    if (completedScrims.length === 0) return 0;
    
    const wins = completedScrims.filter(s => s.result === 'win').length;
    return Math.round((wins / completedScrims.length) * 100);
  };

  const calculateAverageGameDuration = (scrims: any[]) => {
    const games = scrims.flatMap(s => s.scrim_games || []);
    const completedGames = games.filter(g => g.status === 'completed' && g.duration_seconds);
    
    if (completedGames.length === 0) return 0;
    
    const totalDuration = completedGames.reduce((sum, g) => sum + g.duration_seconds, 0);
    return Math.round(totalDuration / completedGames.length);
  };

  const downloadJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadCSV = (data: any, filename: string) => {
    let csvContent = '';

    // Add summary data
    csvContent += 'Summary\n';
    csvContent += `Total Scrims,${data.summary.totalScrims}\n`;
    csvContent += `Completed Scrims,${data.summary.completedScrims}\n`;
    csvContent += `Total Games,${data.summary.totalGames}\n`;
    csvContent += `Win Rate,${data.summary.winRate}%\n`;
    csvContent += `Average Game Duration,${data.summary.averageGameDuration}s\n`;
    csvContent += `Active Players,${data.summary.activePlayers}\n\n`;

    // Add scrim data
    if (data.data.scrims) {
      csvContent += 'Scrims\n';
      csvContent += 'Date,Opponent,Result,Our Score,Opponent Score,Status,Format,Duration (min),Notes\n';
      
      data.data.scrims.forEach((scrim: any) => {
        csvContent += `${scrim.match_date},${scrim.opponent_name},${scrim.result || 'N/A'},${scrim.our_score || 0},${scrim.opponent_score || 0},${scrim.status},${scrim.format || 'N/A'},${scrim.duration_minutes || 'N/A'},"${scrim.notes || ''}"\n`;
      });
      csvContent += '\n';
    }

    // Add player data
    if (data.data.players) {
      csvContent += 'Players\n';
      csvContent += 'Summoner Name,Riot ID,Role,Rank,LP,Discord,Active,Join Date,Last SoloQ Sync,Notes\n';
      
      data.data.players.forEach((player: any) => {
        csvContent += `${player.summoner_name},${player.riot_id || 'N/A'},${player.role || 'N/A'},${player.rank || 'N/A'},${player.lp || 0},${player.discord_username || 'N/A'},${player.is_active},${player.join_date || 'N/A'},${player.last_soloq_sync || 'N/A'},"${player.notes || ''}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    exportData,
    isExporting
  };
};
