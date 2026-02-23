import type { ScrimGame, ScrimParticipant, GameSide } from '@/types/scrimGame';

export function getGameDurationFromExternalData(game: ScrimGame): number | null {
  console.log('📊 Getting game duration from external data for game:', game.id);
  
  if (!game.external_game_data?.post_game_data) {
    console.log('No post_game_data found for duration');
    return null;
  }

  const postGameData = game.external_game_data.post_game_data;
  
  // Check for game duration in seconds (Grid format)
  if (postGameData.gameDuration) {
    console.log('Found gameDuration in post_game_data:', postGameData.gameDuration);
    return postGameData.gameDuration;
  }
  
  // Check for game length in milliseconds and convert to seconds (Live Client format)
  if (postGameData.gameLength) {
    const durationSeconds = Math.floor(postGameData.gameLength / 1000);
    console.log('Found gameLength in post_game_data, converted to seconds:', durationSeconds);
    return durationSeconds;
  }
  
  // Check for stats-based duration (Live Client format)
  if (postGameData.stats && postGameData.stats.gameLength) {
    const durationSeconds = Math.floor(postGameData.stats.gameLength / 1000);
    console.log('Found gameLength in stats, converted to seconds:', durationSeconds);
    return durationSeconds;
  }
  
  console.log('No duration found in external data');
  return null;
}

export function getTeamKillsFromExternalData(game: ScrimGame): { ourKills: number; enemyKills: number } {
  console.log('📊 Getting team kills from external data for game:', game.id);
  
  if (!game.external_game_data?.post_game_data) {
    console.log('No post_game_data found, using manual data');
    return {
      ourKills: game.our_team_kills || 0,
      enemyKills: game.enemy_team_kills || 0
    };
  }

  const postGameData = game.external_game_data.post_game_data;
  const gridMetadata = game.external_game_data.grid_metadata;
  
  // For GRID games, use the detected team side
  if (gridMetadata?.ourTeamSide) {
    const ourTeamId = gridMetadata.ourTeamSide === 'blue' ? 100 : 200;
    const enemyTeamId = gridMetadata.ourTeamSide === 'blue' ? 200 : 100;
    
    console.log('GRID game - our team side:', gridMetadata.ourTeamSide, 'our team ID:', ourTeamId);
    
    if (postGameData.participants) {
      const ourKills = postGameData.participants
        ?.filter((p: any) => p.teamId === ourTeamId)
        ?.reduce((sum: number, p: any) => sum + (p.kills || 0), 0) || 0;
      
      const enemyKills = postGameData.participants
        ?.filter((p: any) => p.teamId === enemyTeamId)
        ?.reduce((sum: number, p: any) => sum + (p.kills || 0), 0) || 0;
      
      console.log('GRID team kills - Our:', ourKills, 'Enemy:', enemyKills);
      return { ourKills, enemyKills };
    }
  }

  // For Live Client games, handle single player scenario
  if (postGameData.stats && postGameData.championName) {
    const ourKills = postGameData.stats.CHAMPIONS_KILLED || 0;
    console.log('Live client single player kills:', ourKills);
    
    // For practice tool or single player games, enemy kills are 0
    return { ourKills, enemyKills: 0 };
  }

  // Try to use localPlayer or isPlayerTeam for multi-player live client games
  if (postGameData.localPlayer?.teamId) {
    const ourTeamId = postGameData.localPlayer.teamId;
    const enemyTeamId = ourTeamId === 100 ? 200 : 100;
    
    console.log('Live client game - our team ID from localPlayer:', ourTeamId);
    
    const ourKills = postGameData.participants
      ?.filter((p: any) => p.teamId === ourTeamId)
      ?.reduce((sum: number, p: any) => sum + (p.kills || 0), 0) || 0;
    
    const enemyKills = postGameData.participants
      ?.filter((p: any) => p.teamId === enemyTeamId)
      ?.reduce((sum: number, p: any) => sum + (p.kills || 0), 0) || 0;
    
    console.log('Live client team kills - Our:', ourKills, 'Enemy:', enemyKills);
    return { ourKills, enemyKills };
  }

  // Fallback to manual data
  console.log('Falling back to manual team kills data');
  return {
    ourKills: game.our_team_kills || 0,
    enemyKills: game.enemy_team_kills || 0
  };
}

export function extractParticipantsFromExternalData(game: ScrimGame): ScrimParticipant[] {
  console.log('🔄 === EXTRACTING PARTICIPANTS FROM EXTERNAL DATA ===');
  console.log('Game ID:', game.id);
  
  if (!game.external_game_data?.post_game_data) {
    console.log('No external post_game_data found');
    return [];
  }

  const postGameData = game.external_game_data.post_game_data;
  const gridMetadata = game.external_game_data.grid_metadata;
  
  console.log('Post game data structure:', {
    hasParticipants: !!postGameData.participants,
    hasTeams: !!postGameData.teams,
    hasLocalPlayer: !!postGameData.localPlayer,
    hasStats: !!postGameData.stats,
    hasChampionName: !!postGameData.championName,
    gameMode: postGameData.gameMode,
    participantsCount: postGameData.participants?.length || 0,
    teamsCount: postGameData.teams?.length || 0,
    dataSource: gridMetadata ? 'GRID' : 'LIVE_CLIENT'
  });

  // Handle Live Client single player scenario with teams array (practice tool, etc.)
  if (postGameData.teams && Array.isArray(postGameData.teams) && postGameData.localPlayer) {
    console.log('🎮 LIVE CLIENT with teams array structure detected');
    
    const participants: ScrimParticipant[] = [];
    
    // Process each team
    postGameData.teams.forEach((team: any, teamIndex: number) => {
      console.log(`Processing team ${teamIndex}:`, {
        teamId: team.teamId,
        isPlayerTeam: team.isPlayerTeam,
        playersCount: team.players?.length || 0
      });
      
      if (team.players && Array.isArray(team.players)) {
        team.players.forEach((player: any, playerIndex: number) => {
          console.log(`Processing player ${playerIndex} in team ${teamIndex}:`, {
            summonerName: player.riotIdGameName || player.summonerName,
            championName: player.championName,
            isLocalPlayer: player.isLocalPlayer,
            teamId: player.teamId || team.teamId
          });
          
          const participant: ScrimParticipant = {
            id: `external-${game.id}-${player.teamId || team.teamId}-${playerIndex}`,
            scrim_game_id: game.id,
            player_id: null,
            summoner_name: player.riotIdGameName || player.summonerName || 'Unknown Player',
            champion_name: player.championName || 'Unknown Champion',
            role: player.detectedTeamPosition?.toLowerCase() || player.selectedPosition?.toLowerCase() || null,
            is_our_team: team.isPlayerTeam || player.isLocalPlayer || false,
            kills: player.stats?.CHAMPIONS_KILLED || 0,
            deaths: player.stats?.NUM_DEATHS || 0,
            assists: player.stats?.ASSISTS || 0,
            cs: (player.stats?.MINIONS_KILLED || 0) + (player.stats?.NEUTRAL_MINIONS_KILLED || 0),
            gold: player.stats?.GOLD_EARNED || 0,
            damage_dealt: player.stats?.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS || 0,
            damage_taken: player.stats?.TOTAL_DAMAGE_TAKEN || 0,
            vision_score: player.stats?.VISION_SCORE || 0,
            level: player.stats?.LEVEL || player.level || 1,
            items: player.items ? player.items.filter(Boolean).map((itemId: number) => ({
              id: itemId,
              name: `Item ${itemId}`,
              slot: 0
            })) : [],
            summoner_spells: [
              player.spell1Id ? { id: player.spell1Id, name: `Spell ${player.spell1Id}`, slot: 1 as const } : null,
              player.spell2Id ? { id: player.spell2Id, name: `Spell ${player.spell2Id}`, slot: 2 as const } : null
            ].filter(Boolean) as any[],
            runes: {
              primary_tree: player.stats?.PERK_PRIMARY_STYLE?.toString() || '',
              secondary_tree: player.stats?.PERK_SUB_STYLE?.toString() || '',
              runes: [
                player.stats?.PERK0,
                player.stats?.PERK1,
                player.stats?.PERK2,
                player.stats?.PERK3,
                player.stats?.PERK4,
                player.stats?.PERK5
              ].filter(Boolean),
              stat_mods: []
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          participants.push(participant);
        });
      }
    });
    
    console.log('✅ Extracted participants from Live Client teams structure:', participants.length);
    return participants;
  }

  // Handle Live Client single player scenario (practice tool, etc.) - legacy format
  if (postGameData.stats && postGameData.championName && !postGameData.participants && !postGameData.teams) {
    console.log('🎮 LIVE CLIENT SINGLE PLAYER: Detected practice tool or single player game (legacy format)');
    
    const participant: ScrimParticipant = {
      id: `external-${game.id}-single-player`,
      scrim_game_id: game.id,
      player_id: null,
      summoner_name: postGameData.riotIdGameName || postGameData.summonerName || 'Local Player',
      champion_name: postGameData.championName,
      role: null,
      is_our_team: true, // Single player is always "our team"
      kills: postGameData.stats.CHAMPIONS_KILLED || 0,
      deaths: postGameData.stats.NUM_DEATHS || 0,
      assists: postGameData.stats.ASSISTS || 0,
      cs: (postGameData.stats.MINIONS_KILLED || 0) + (postGameData.stats.NEUTRAL_MINIONS_KILLED || 0),
      gold: postGameData.stats.GOLD_EARNED || 0,
      damage_dealt: postGameData.stats.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS || 0,
      damage_taken: postGameData.stats.TOTAL_DAMAGE_TAKEN || 0,
      vision_score: postGameData.stats.VISION_SCORE || 0,
      level: postGameData.stats.LEVEL || 1,
      items: [],
      summoner_spells: [],
      runes: {
        primary_tree: '',
        secondary_tree: '',
        runes: [],
        stat_mods: []
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('✅ Created single player participant:', participant.summoner_name);
    return [participant];
  }

  // Enhanced Grid format handling - participants array
  if (!postGameData.participants || !Array.isArray(postGameData.participants)) {
    console.log('No participants array found in post_game_data');
    return [];
  }

  console.log('📊 GRID FORMAT: Processing participants array with', postGameData.participants.length, 'participants');
  console.log('Grid metadata:', gridMetadata);

  // Enhanced team determination for Grid games
  let ourTeamId: number;
  
  if (gridMetadata?.ourTeamSide) {
    // For GRID games, use the detected team side
    ourTeamId = gridMetadata.ourTeamSide === 'blue' ? 100 : 200;
    console.log('🎮 GRID GAME: Using detected team side:', gridMetadata.ourTeamSide, '-> Team ID:', ourTeamId);
  } else if (postGameData.localPlayer?.teamId) {
    // For live client games, use localPlayer teamId
    ourTeamId = postGameData.localPlayer.teamId;
    console.log('🖥️ LIVE CLIENT: Using localPlayer team ID:', ourTeamId);
  } else if (postGameData.teams?.find((team: any) => team.isPlayerTeam === true)) {
    // Fallback: find team marked as player team
    const playerTeam = postGameData.teams.find((team: any) => team.isPlayerTeam === true);
    ourTeamId = playerTeam.teamId;
    console.log('🔄 FALLBACK: Using isPlayerTeam flag -> Team ID:', ourTeamId);
  } else {
    // Last resort: default to blue side
    ourTeamId = 100;
    console.log('⚠️ DEFAULT: No team detection method worked, defaulting to blue side (100)');
  }

  console.log('🎯 Final ourTeamId determination:', ourTeamId);

  const participants: ScrimParticipant[] = postGameData.participants.map((participant: any, index: number) => {
    // Determine if this participant is on our team
    const isOurTeam = participant.teamId === ourTeamId;
    
    console.log(`👤 Participant ${index + 1}:`, {
      name: participant.riotIdGameName || participant.summonerName,
      teamId: participant.teamId,
      champion: participant.championName,
      isOurTeam,
      ourTeamId
    });

    // Force role assignment to be null - let GameOverviewTab assign based on participant order
    // This ensures consistent role assignment regardless of external data quality
    let role = null;

    return {
      id: `external-${game.id}-${participant.participantId || index}`,
      scrim_game_id: game.id,
      player_id: null,
      summoner_name: participant.riotIdGameName || participant.summonerName || participant.playerName || 'Unknown Player',
      champion_name: participant.championName || 'Unknown Champion',
      role: role || null,
      is_our_team: isOurTeam,
      kills: participant.kills || 0,
      deaths: participant.deaths || 0,
      assists: participant.assists || 0,
      cs: (participant.totalMinionsKilled || 0) + (participant.neutralMinionsKilled || 0),
      gold: participant.goldEarned || 0,
      damage_dealt: participant.totalDamageDealtToChampions || 0,
      damage_taken: participant.totalDamageTaken || 0,
      vision_score: participant.visionScore || 0,
      level: participant.champLevel || 1,
      items: participant.items ? participant.items.filter(Boolean).map((item: any) => ({
        id: item,
        name: `Item ${item}`,
        slot: 0
      })) : [],
      summoner_spells: [
        participant.summoner1Id ? { id: participant.summoner1Id, name: `Spell ${participant.summoner1Id}`, slot: 1 as const } : null,
        participant.summoner2Id ? { id: participant.summoner2Id, name: `Spell ${participant.summoner2Id}`, slot: 2 as const } : null
      ].filter(Boolean) as any[],
      runes: participant.perks || {
        primary_tree: '',
        secondary_tree: '',
        runes: [],
        stat_mods: []
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  });

  // Log summary of team assignment
  const ourTeamCount = participants.filter(p => p.is_our_team).length;
  const enemyTeamCount = participants.filter(p => !p.is_our_team).length;
  
  console.log('🎯 === PARTICIPANT ASSIGNMENT SUMMARY ===');
  console.log(`Our team (ID ${ourTeamId}): ${ourTeamCount} players`);
  console.log(`Enemy team: ${enemyTeamCount} players`);
  console.log('Our team players:', participants.filter(p => p.is_our_team).map(p => `${p.summoner_name} (${p.champion_name})`));
  console.log('Enemy team players:', participants.filter(p => !p.is_our_team).map(p => `${p.summoner_name} (${p.champion_name})`));
  console.log('=== END PARTICIPANT ASSIGNMENT SUMMARY ===');

  return participants;
}
