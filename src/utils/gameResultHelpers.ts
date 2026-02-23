
import type { ScrimGame } from '@/types/scrimGame';
import { getTeamKillsFromExternalData } from './gameDataTransform';

export function determineGameResult(game: ScrimGame): 'win' | 'loss' | null {
  console.log('🎯 === GAME RESULT DETERMINATION START ===');
  console.log('Game ID:', game.id);
  console.log('Game status:', game.status);
  console.log('Game result field:', game.result);
  
  // Debug the external game data structure
  console.log('📊 EXTERNAL GAME DATA STRUCTURE:');
  console.log('- Has external_game_data:', !!game.external_game_data);
  console.log('- Has post_game_data:', !!game.external_game_data?.post_game_data);
  console.log('- Has grid_metadata:', !!game.external_game_data?.grid_metadata);
  console.log('- Full external_game_data:', JSON.stringify(game.external_game_data, null, 2));
  
  const dataSource = game.external_game_data?.grid_metadata ? 'GRID' : 'LIVE_CLIENT';
  console.log('Data source:', dataSource);
  
  // First check if result is already set in the database
  if (game.result === 'win' || game.result === 'loss') {
    console.log('✅ Result already set in database:', game.result);
    return game.result;
  }

  // If game is not completed, return null
  if (game.status !== 'completed') {
    console.log('❌ Game not completed, status:', game.status);
    return null;
  }

  const postGameData = game.external_game_data?.post_game_data;
  const gridMetadata = game.external_game_data?.grid_metadata;

  // GRID GAMES: Check grid_metadata first (our calculated result) - HIGHEST PRIORITY
  if (gridMetadata) {
    console.log('🎮 === GRID GAME PROCESSING ===');
    console.log('- Grid metadata:', JSON.stringify(gridMetadata, null, 2));
    console.log('- Has didWeWin:', 'didWeWin' in gridMetadata);
    console.log('- didWeWin value:', gridMetadata.didWeWin);
    console.log('- didWeWin type:', typeof gridMetadata.didWeWin);
    console.log('- Our team side:', gridMetadata.ourTeamSide);
    console.log('- Series ID:', gridMetadata.seriesId);
    
    // CRITICAL: For GRID games, ONLY use grid_metadata.didWeWin
    if (gridMetadata.didWeWin !== undefined && gridMetadata.didWeWin !== null) {
      const result = gridMetadata.didWeWin ? 'win' : 'loss';
      console.log('✅ GRID RESULT DETERMINED from didWeWin:', result);
      console.log('🚫 SKIPPING all other result determination methods for GRID game');
      console.log('=== GAME RESULT DETERMINATION END (GRID) ===');
      return result;
    } else {
      console.log('⚠️ GRID metadata exists but didWeWin is undefined/null');
      console.log('⚠️ This suggests the GRID transform function failed to calculate didWeWin properly');
      console.log('⚠️ Will NOT fall back to other methods for GRID games to avoid incorrect results');
      console.log('=== GAME RESULT DETERMINATION END (GRID - NO RESULT) ===');
      return null; // Don't fall back to live client logic for GRID games
    }
  }

  // LIVE CLIENT GAMES ONLY: Check for localPlayer (only exists for live client)
  if (postGameData?.localPlayer?.win !== undefined) {
    console.log('🖥️ === LIVE CLIENT GAME PROCESSING ===');
    console.log('- LocalPlayer data:', JSON.stringify(postGameData.localPlayer, null, 2));
    console.log('- LocalPlayer win:', postGameData.localPlayer.win);
    const result = postGameData.localPlayer.win ? 'win' : 'loss';
    console.log('✅ LIVE CLIENT RESULT DETERMINED:', result);
    console.log('=== GAME RESULT DETERMINATION END (LIVE CLIENT) ===');
    return result;
  }

  // FALLBACK: Check team results for live client games only
  if (postGameData?.teams && Array.isArray(postGameData.teams) && !gridMetadata) {
    console.log('🏆 === FALLBACK TEAM RESULTS PROCESSING (LIVE CLIENT ONLY) ===');
    console.log('- Teams data:', JSON.stringify(postGameData.teams, null, 2));
    
    // For live client games, find our team (the one marked as isPlayerTeam)
    const ourTeam = postGameData.teams.find((team: any) => team.isPlayerTeam === true);
    if (ourTeam) {
      console.log('- LIVE CLIENT: Found our team with isPlayerTeam:', JSON.stringify(ourTeam, null, 2));
      
      if (ourTeam.isWinningTeam !== undefined) {
        const result = ourTeam.isWinningTeam ? 'win' : 'loss';
        console.log('✅ LIVE CLIENT FALLBACK RESULT DETERMINED:', result);
        console.log('=== GAME RESULT DETERMINATION END (LIVE CLIENT FALLBACK) ===');
        return result;
      }

      // Legacy check for team.win field
      if (ourTeam.win !== undefined) {
        const result = ourTeam.win ? 'win' : 'loss';
        console.log('✅ LIVE CLIENT LEGACY RESULT DETERMINED:', result);
        console.log('=== GAME RESULT DETERMINATION END (LIVE CLIENT LEGACY) ===');
        return result;
      }
    }

    // If no team detection worked, try using localPlayer teamId (live client only)
    if (postGameData.localPlayer?.teamId) {
      const ourTeamId = postGameData.localPlayer.teamId;
      const teamById = postGameData.teams.find((team: any) => team.teamId === ourTeamId);
      console.log('- LIVE CLIENT: Using localPlayer teamId fallback:', ourTeamId);
      console.log('- LIVE CLIENT: Found team by ID:', JSON.stringify(teamById, null, 2));
      
      if (teamById?.win !== undefined) {
        const result = teamById.win ? 'win' : 'loss';
        console.log('✅ LIVE CLIENT TEAMID FALLBACK RESULT DETERMINED:', result);
        console.log('=== GAME RESULT DETERMINATION END (LIVE CLIENT TEAMID FALLBACK) ===');
        return result;
      }
    }
  }

  // SKIP kill comparison and manual data fallbacks for GRID games
  if (gridMetadata) {
    console.log('🚫 SKIPPING kill comparison and manual data fallbacks for GRID game');
    console.log('❌ Could not determine GRID game result - didWeWin was not properly calculated');
    console.log('=== GAME RESULT DETERMINATION END (GRID - FAILED) ===');
    return null;
  }

  // Last resort for LIVE CLIENT games only: Try to determine from team performance
  const { ourKills, enemyKills } = getTeamKillsFromExternalData(game);
  console.log('🗡️ === LAST RESORT KILL COMPARISON (LIVE CLIENT ONLY) ===');
  console.log('- Our kills:', ourKills, 'Enemy kills:', enemyKills);
  
  if (ourKills > 0 || enemyKills > 0) {
    // Simple heuristic: if we have significantly more kills, likely a win
    if (ourKills > enemyKills * 1.5 && ourKills > 10) {
      console.log('✅ KILL COMPARISON RESULT: WIN (based on kill advantage)');
      console.log('=== GAME RESULT DETERMINATION END (KILL COMPARISON WIN) ===');
      return 'win';
    } else if (enemyKills > ourKills * 1.5 && enemyKills > 10) {
      console.log('✅ KILL COMPARISON RESULT: LOSS (based on kill disadvantage)');
      console.log('=== GAME RESULT DETERMINATION END (KILL COMPARISON LOSS) ===');
      return 'loss';
    }
  }

  // Check manual kill data for LIVE CLIENT games only
  if (game.our_team_kills !== undefined && game.enemy_team_kills !== undefined) {
    console.log('📊 === MANUAL DATA FALLBACK (LIVE CLIENT ONLY) ===');
    console.log('- Our kills:', game.our_team_kills, 'Enemy kills:', game.enemy_team_kills);
    
    if (game.our_team_kills > game.enemy_team_kills && game.our_team_kills > 0) {
      console.log('✅ MANUAL DATA RESULT: WIN');
      console.log('=== GAME RESULT DETERMINATION END (MANUAL WIN) ===');
      return 'win';
    } else if (game.enemy_team_kills > game.our_team_kills && game.enemy_team_kills > 0) {
      console.log('✅ MANUAL DATA RESULT: LOSS');
      console.log('=== GAME RESULT DETERMINATION END (MANUAL LOSS) ===');
      return 'loss';
    }
  }

  console.log('❌ Could not determine game result for game:', game.id);
  console.log('=== GAME RESULT DETERMINATION END (NO RESULT) ===');
  return null;
}

export function getGameResultDisplay(game: ScrimGame): string {
  const result = determineGameResult(game);
  if (result === 'win') return 'WIN';
  if (result === 'loss') return 'LOSS';
  return 'TBD';
}

export function getGameResultColor(game: ScrimGame): string {
  const result = determineGameResult(game);
  if (result === 'win') return 'text-green-400 font-medium';
  if (result === 'loss') return 'text-red-400 font-medium';
  return 'text-muted-foreground';
}
