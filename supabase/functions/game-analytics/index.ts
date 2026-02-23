
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse the request body to get parameters
    const { game_id, analysis_type } = await req.json()

    console.log('Received request with:', { game_id, analysis_type })

    if (!game_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: game_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    console.log('Fetching game data for game_id:', game_id)

    // Fetch game data with participants and live data
    const { data: game, error: gameError } = await supabaseClient
      .from('scrim_games')
      .select(`
        *,
        participants:scrim_participants(*),
        live_data:live_game_data(*),
        draft:game_drafts(*),
        feedback:coach_feedback(*)
      `)
      .eq('id', game_id)
      .single()

    if (gameError) {
      console.error('Database error:', gameError)
      return new Response(
        JSON.stringify({ error: 'Database error', details: gameError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!game) {
      console.log('Game not found for id:', game_id)
      return new Response(
        JSON.stringify({ error: 'Game not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Game found:', { 
      id: game.id, 
      participants: game.participants?.length || 0,
      draft: game.draft?.length || 0,
      liveData: game.live_data?.length || 0,
      hasExternalData: !!game.external_game_data?.post_game_data,
      hasGridMetadata: !!game.external_game_data?.grid_metadata,
      status: game.status,
      dataSource: game.external_game_data?.grid_metadata ? 'GRID' : 'LIVE_CLIENT'
    })

    // Extract participants from external data if database participants are insufficient
    let effectiveParticipants = game.participants || []
    
    // Check if we need to extract from external data
    const needsExternalExtraction = effectiveParticipants.length === 0 || 
      effectiveParticipants.some((p: any) => p.summoner_name === 'Unknown Player' || 
        (p.kills === 0 && p.deaths === 0 && p.assists === 0 && p.gold === 0))

    if (needsExternalExtraction && game.external_game_data?.post_game_data) {
      console.log('Database participants insufficient, extracting from external data')
      console.log('External data type:', game.external_game_data?.grid_metadata ? 'GRID' : 'LIVE_CLIENT')
      
      effectiveParticipants = extractParticipantsFromExternalData(game)
      console.log('Extracted participants:', effectiveParticipants.length)
    }

    console.log('Effective participants:', {
      total: effectiveParticipants.length,
      ourTeam: effectiveParticipants.filter((p: any) => p.is_our_team).length,
      enemyTeam: effectiveParticipants.filter((p: any) => !p.is_our_team).length,
      ourTeamPlayers: effectiveParticipants.filter((p: any) => p.is_our_team).map((p: any) => p.summoner_name),
      enemyTeamPlayers: effectiveParticipants.filter((p: any) => !p.is_our_team).map((p: any) => p.summoner_name)
    })

    let analytics = {}

    switch (analysis_type) {
      case 'summary':
        analytics = generateGameSummary({ ...game, participants: effectiveParticipants })
        break
      case 'draft':
        analytics = generateDraftAnalysis(game)
        break
      case 'performance':
        analytics = generatePerformanceAnalysis({ ...game, participants: effectiveParticipants })
        break
      case 'timeline':
        analytics = generateTimelineAnalysis(game)
        break
      default:
        analytics = generateGameSummary({ ...game, participants: effectiveParticipants })
    }

    console.log('Generated analytics:', { analysis_type, hasData: !!analytics })

    return new Response(
      JSON.stringify({
        game_id: game_id,
        analysis_type: analysis_type || 'summary',
        analytics,
        participants_info: {
          total: effectiveParticipants.length,
          our_team: effectiveParticipants.filter((p: any) => p.is_our_team).length,
          enemy_team: effectiveParticipants.filter((p: any) => !p.is_our_team).length,
        },
        data_source: game.external_game_data?.grid_metadata ? 'GRID' : 'LIVE_CLIENT',
        generated_at: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in game-analytics function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        stack: error.stack 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Enhanced helper function to extract participants from external data
function extractParticipantsFromExternalData(game: any): any[] {
  const postGameData = game.external_game_data?.post_game_data;
  const gridMetadata = game.external_game_data?.grid_metadata;
  
  console.log('=== EXTRACTING PARTICIPANTS FROM EXTERNAL DATA ===')
  console.log('Data source:', gridMetadata ? 'GRID' : 'LIVE_CLIENT')
  console.log('Grid metadata:', gridMetadata)
  console.log('Post game data structure:', {
    hasParticipants: !!postGameData?.participants,
    hasLocalPlayer: !!postGameData?.localPlayer,
    hasStats: !!postGameData?.stats,
    hasChampionName: !!postGameData?.championName,
    participantsCount: postGameData?.participants?.length || 0
  })
  
  if (!postGameData) {
    console.log('No post_game_data available')
    return [];
  }

  // Handle Live Client single player scenario (practice tool, etc.)
  if (postGameData.stats && postGameData.championName && !postGameData.participants) {
    console.log('🎮 LIVE CLIENT SINGLE PLAYER: Detected practice tool or single player game')
    
    const participant = {
      id: `external-${game.id}-single-player`,
      scrim_game_id: game.id,
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
      level: postGameData.stats.LEVEL || 1
    };
    
    console.log('✅ Created single player participant:', participant.summoner_name)
    return [participant];
  }

  const participants: any[] = [];
  let ourTeamId: number | undefined;

  // GRID GAMES: Use grid_metadata.ourTeamSide
  if (gridMetadata?.ourTeamSide) {
    ourTeamId = gridMetadata.ourTeamSide === 'blue' ? 100 : 200;
    console.log('GRID: Our team side:', gridMetadata.ourTeamSide, '-> Team ID:', ourTeamId);
    
    // For GRID games, process participants array directly
    if (postGameData.participants && Array.isArray(postGameData.participants)) {
      postGameData.participants.forEach((participant: any) => {
        const isOurTeam = participant.teamId === ourTeamId;
        participants.push(transformExternalPlayerToParticipant(participant, game.id, isOurTeam));
      });
    }
  } 
  // LIVE CLIENT GAMES: Use localPlayer approach
  else if (postGameData.localPlayer) {
    ourTeamId = postGameData.localPlayer.teamId;
    console.log('LIVE CLIENT: Our team ID from localPlayer:', ourTeamId);
    
    // Add local player first
    participants.push(transformExternalPlayerToParticipant(
      postGameData.localPlayer,
      game.id,
      true // localPlayer is always our team
    ));

    // Process team players from teams array
    if (postGameData.teams && Array.isArray(postGameData.teams)) {
      postGameData.teams.forEach((team: any) => {
        const teamPlayers = team.participants || team.players || [];
        
        if (Array.isArray(teamPlayers)) {
          teamPlayers.forEach((player: any) => {
            // Skip if this is the same player as localPlayer
            const isLocalPlayer = player.summonerName === postGameData.localPlayer.summonerName ||
              player.riotIdGameName === postGameData.localPlayer.riotIdGameName;
            
            if (!isLocalPlayer) {
              const isOurTeam = team.teamId === ourTeamId;
              participants.push(transformExternalPlayerToParticipant(player, game.id, isOurTeam));
            }
          });
        }
      });
    }
  }
  // FALLBACK: Process participants array if available
  else if (postGameData.participants && Array.isArray(postGameData.participants)) {
    ourTeamId = 100; // Default fallback
    console.log('FALLBACK: Using default team ID 100');
    
    postGameData.participants.forEach((participant: any) => {
      const isOurTeam = participant.teamId === ourTeamId;
      participants.push(transformExternalPlayerToParticipant(participant, game.id, isOurTeam));
    });
  }

  console.log('Extracted participants summary:', {
    total: participants.length,
    ourTeam: participants.filter(p => p.is_our_team).length,
    enemyTeam: participants.filter(p => !p.is_our_team).length,
    ourTeamNames: participants.filter(p => p.is_our_team).map(p => p.summoner_name),
    enemyTeamNames: participants.filter(p => !p.is_our_team).map(p => p.summoner_name)
  });

  return participants;
}

function transformExternalPlayerToParticipant(player: any, gameId: string, isOurTeam: boolean): any {
  // Handle both GRID and Live Client data formats
  const kills = player.kills ?? player.stats?.CHAMPIONS_KILLED ?? player.stats?.kills ?? 0;
  const deaths = player.deaths ?? player.stats?.NUM_DEATHS ?? player.stats?.deaths ?? 0;
  const assists = player.assists ?? player.stats?.ASSISTS ?? player.stats?.assists ?? 0;
  const gold = player.goldEarned ?? player.stats?.GOLD_EARNED ?? player.stats?.goldEarned ?? 0;
  const totalMinions = player.totalMinionsKilled ?? player.stats?.MINIONS_KILLED ?? player.stats?.totalMinionsKilled ?? 0;
  const neutralMinions = player.neutralMinionsKilled ?? player.stats?.NEUTRAL_MINIONS_KILLED ?? player.stats?.neutralMinionsKilled ?? 0;
  const cs = totalMinions + neutralMinions;
  const visionScore = player.visionScore ?? player.stats?.VISION_SCORE ?? player.stats?.visionScore ?? 0;
  const damageToChampions = player.totalDamageDealtToChampions ?? player.stats?.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS ?? player.stats?.totalDamageDealtToChampions ?? 0;
  const damageTaken = player.totalDamageTaken ?? player.stats?.TOTAL_DAMAGE_TAKEN ?? player.stats?.totalDamageTaken ?? 0;

  const summonerName = player.riotIdGameName || player.summonerName || player.playerName || 'Unknown Player';
  const championName = player.championName || 'Unknown Champion';

  console.log(`Transforming player: ${summonerName} (${championName}) - Our team: ${isOurTeam}, K/D/A: ${kills}/${deaths}/${assists}`);

  return {
    id: `external-${gameId}-${player.participantId || player.summonerName || 'unknown'}`,
    scrim_game_id: gameId,
    summoner_name: summonerName,
    champion_name: championName,
    role: player.teamPosition?.toLowerCase() || player.position?.toLowerCase() || undefined,
    kills,
    deaths,
    assists,
    cs,
    gold,
    damage_dealt: damageToChampions,
    damage_taken: damageTaken,
    vision_score: visionScore,
    is_our_team: isOurTeam,
    level: player.champLevel ?? player.stats?.CHAMPION_LEVEL ?? player.stats?.champLevel ?? 1
  };
}

function generateGameSummary(game: any) {
  console.log('Generating game summary for game:', game.id)
  
  const ourTeam = game.participants?.filter((p: any) => p.is_our_team) || []
  const enemyTeam = game.participants?.filter((p: any) => !p.is_our_team) || []
  
  console.log('Team composition:', { 
    ourTeam: ourTeam.length, 
    enemyTeam: enemyTeam.length,
    ourTeamStats: ourTeam.map((p: any) => ({ name: p.summoner_name, kills: p.kills, deaths: p.deaths, assists: p.assists }))
  })
  
  const ourTeamStats = {
    kills: ourTeam.reduce((sum: number, p: any) => sum + (p.kills || 0), 0),
    deaths: ourTeam.reduce((sum: number, p: any) => sum + (p.deaths || 0), 0),
    assists: ourTeam.reduce((sum: number, p: any) => sum + (p.assists || 0), 0),
    gold: ourTeam.reduce((sum: number, p: any) => sum + (p.gold || 0), 0),
    cs: ourTeam.reduce((sum: number, p: any) => sum + (p.cs || 0), 0),
  }

  const enemyTeamStats = {
    kills: enemyTeam.reduce((sum: number, p: any) => sum + (p.kills || 0), 0),
    deaths: enemyTeam.reduce((sum: number, p: any) => sum + (p.deaths || 0), 0),
    assists: enemyTeam.reduce((sum: number, p: any) => sum + (p.assists || 0), 0),
    gold: enemyTeam.reduce((sum: number, p: any) => sum + (p.gold || 0), 0),
    cs: enemyTeam.reduce((sum: number, p: any) => sum + (p.cs || 0), 0),
  }

  // Calculate kill participation
  const killParticipation = ourTeam.map((p: any) => ({
    summoner_name: p.summoner_name,
    kp: ourTeamStats.kills > 0 ? 
      (((p.kills || 0) + (p.assists || 0)) / ourTeamStats.kills * 100).toFixed(1) + '%' : 
      '0%'
  }))

  console.log('Generated summary stats:', {
    ourTeamStats,
    enemyTeamStats,
    killParticipation
  })

  return {
    game_result: game.result,
    duration_minutes: game.duration_seconds ? Math.round(game.duration_seconds / 60) : null,
    our_team: {
      ...ourTeamStats,
      kda: ourTeamStats.deaths > 0 ? 
        ((ourTeamStats.kills + ourTeamStats.assists) / ourTeamStats.deaths).toFixed(2) : 
        'Perfect',
      avg_cs_per_min: game.duration_seconds ? 
        (ourTeamStats.cs / (game.duration_seconds / 60)).toFixed(1) : null
    },
    enemy_team: {
      ...enemyTeamStats,
      kda: enemyTeamStats.deaths > 0 ? 
        ((enemyTeamStats.kills + enemyTeamStats.assists) / enemyTeamStats.deaths).toFixed(2) : 
        'Perfect'
    },
    gold_difference: ourTeamStats.gold - enemyTeamStats.gold,
    kill_participation: killParticipation
  }
}

function generateDraftAnalysis(game: any) {
  console.log('Generating draft analysis for game:', game.id)
  
  const draft = game.draft?.[0]
  if (!draft || !draft.draft_data) {
    console.log('No draft data available')
    return { message: 'No draft data available' }
  }

  console.log('Draft data found:', { 
    our_team_side: draft.our_team_side,
    picks_count: draft.draft_data.picks?.length || 0,
    bans_count: draft.draft_data.bans?.length || 0
  })

  const draftData = draft.draft_data
  const ourSide = draft.our_team_side || 'blue'
  const enemySide = ourSide === 'blue' ? 'red' : 'blue'

  const ourPicks = draftData.picks?.filter((p: any) => p.team === ourSide) || []
  const enemyPicks = draftData.picks?.filter((p: any) => p.team === enemySide) || []
  const ourBans = draftData.bans?.filter((b: any) => b.team === ourSide) || []
  const enemyBans = draftData.bans?.filter((b: any) => b.team === enemySide) || []

  return {
    draft_summary: {
      our_picks: ourPicks.map((p: any) => ({ champion: p.champion, role: p.role })),
      enemy_picks: enemyPicks.map((p: any) => ({ champion: p.champion, role: p.role })),
      our_bans: ourBans.map((b: any) => b.champion),
      enemy_bans: enemyBans.map((b: any) => b.champion)
    },
    team_composition: {
      our_comp_type: analyzeTeamComposition(ourPicks),
      enemy_comp_type: analyzeTeamComposition(enemyPicks)
    },
    power_spikes: {
      our_early_game: calculateEarlyGameStrength(ourPicks),
      our_late_game: calculateLateGameStrength(ourPicks),
      enemy_early_game: calculateEarlyGameStrength(enemyPicks),
      enemy_late_game: calculateLateGameStrength(enemyPicks)
    }
  }
}

function generatePerformanceAnalysis(game: any) {
  console.log('Generating performance analysis for game:', game.id)
  
  const participants = game.participants || []
  const ourTeam = participants.filter((p: any) => p.is_our_team)
  const enemyTeam = participants.filter((p: any) => !p.is_our_team)

  console.log('Performance analysis teams:', { ourTeam: ourTeam.length, enemyTeam: enemyTeam.length })

  return {
    mvp_candidate: findMVP(ourTeam),
    underperformer: findUnderperformer(ourTeam),
    role_performance: analyzeRolePerformance(ourTeam),
    damage_distribution: analyzeDamageDistribution(ourTeam),
    vision_control: analyzeVisionControl(ourTeam, enemyTeam)
  }
}

function generateTimelineAnalysis(game: any) {
  console.log('Generating timeline analysis for game:', game.id)
  
  const liveData = game.live_data || []
  if (liveData.length === 0) {
    console.log('No timeline data available')
    return { message: 'No timeline data available' }
  }

  const sortedData = liveData.sort((a: any, b: any) => a.game_time_seconds - b.game_time_seconds)
  
  console.log('Timeline data found:', { dataPoints: sortedData.length })
  
  return {
    game_phases: analyzeGamePhases(sortedData),
    gold_timeline: extractGoldTimeline(sortedData),
    kill_timeline: extractKillTimeline(sortedData),
    objective_control: analyzeObjectiveControl(sortedData)
  }
}

// Helper functions for analysis
function analyzeTeamComposition(picks: any[]) {
  // Simple composition analysis based on champion picks
  if (picks.length < 3) return 'Unknown'
  
  const roles = picks.map(p => p.role).filter(Boolean)
  if (roles.includes('adc') && roles.includes('support')) {
    return 'Standard'
  }
  return 'Non-standard'
}

function calculateEarlyGameStrength(picks: any[]) {
  // Simplified early game strength calculation
  return Math.floor(Math.random() * 10) + 1 // Placeholder
}

function calculateLateGameStrength(picks: any[]) {
  // Simplified late game strength calculation
  return Math.floor(Math.random() * 10) + 1 // Placeholder
}

function findMVP(team: any[]) {
  if (team.length === 0) return null
  
  return team.reduce((mvp, player) => {
    const mvpScore = (mvp.kills || 0) + (mvp.assists || 0) - (mvp.deaths || 0)
    const playerScore = (player.kills || 0) + (player.assists || 0) - (player.deaths || 0)
    return playerScore > mvpScore ? player : mvp
  })
}

function findUnderperformer(team: any[]) {
  if (team.length === 0) return null
  
  return team.reduce((worst, player) => {
    const worstScore = (worst.kills || 0) + (worst.assists || 0) - (worst.deaths || 0)
    const playerScore = (player.kills || 0) + (player.assists || 0) - (player.deaths || 0)
    return playerScore < worstScore ? player : worst
  })
}

function analyzeRolePerformance(team: any[]) {
  return team.map(player => ({
    role: player.role,
    summoner_name: player.summoner_name,
    performance_score: (player.kills || 0) + (player.assists || 0) - (player.deaths || 0)
  }))
}

function analyzeDamageDistribution(team: any[]) {
  const totalDamage = team.reduce((sum, p) => sum + (p.damage_dealt || 0), 0)
  return team.map(player => ({
    summoner_name: player.summoner_name,
    damage_dealt: player.damage_dealt || 0,
    damage_percentage: totalDamage > 0 ? 
      ((player.damage_dealt || 0) / totalDamage * 100).toFixed(1) + '%' : '0%'
  }))
}

function analyzeVisionControl(ourTeam: any[], enemyTeam: any[]) {
  const ourVision = ourTeam.reduce((sum, p) => sum + (p.vision_score || 0), 0)
  const enemyVision = enemyTeam.reduce((sum, p) => sum + (p.vision_score || 0), 0)
  
  return {
    our_vision_score: ourVision,
    enemy_vision_score: enemyVision,
    vision_advantage: ourVision - enemyVision
  }
}

function analyzeGamePhases(liveData: any[]) {
  return {
    early_game: liveData.filter(d => d.game_time_seconds <= 900), // 0-15 min
    mid_game: liveData.filter(d => d.game_time_seconds > 900 && d.game_time_seconds <= 1800), // 15-30 min
    late_game: liveData.filter(d => d.game_time_seconds > 1800) // 30+ min
  }
}

function extractGoldTimeline(liveData: any[]) {
  return liveData.map(d => ({
    time_seconds: d.game_time_seconds,
    blue_gold: d.blue_team_gold || 0,
    red_gold: d.red_team_gold || 0,
    gold_difference: (d.blue_team_gold || 0) - (d.red_team_gold || 0)
  }))
}

function extractKillTimeline(liveData: any[]) {
  return liveData.map(d => ({
    time_seconds: d.game_time_seconds,
    blue_kills: d.blue_team_kills || 0,
    red_kills: d.red_team_kills || 0,
    kill_difference: (d.blue_team_kills || 0) - (d.red_team_kills || 0)
  }))
}

function analyzeObjectiveControl(liveData: any[]) {
  // Simplified objective analysis from objectives_state
  return {
    message: 'Objective analysis available in objectives_state field'
  }
}
