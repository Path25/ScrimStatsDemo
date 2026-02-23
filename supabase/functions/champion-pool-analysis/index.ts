
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
    const url = new URL(req.url)
    const playerId = url.searchParams.get('player_id')
    const teamId = url.searchParams.get('team_id')
    const analysisType = url.searchParams.get('type') || 'individual'

    if (!playerId && !teamId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: player_id or team_id' }),
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

    let analysis = {}

    if (analysisType === 'individual' && playerId) {
      analysis = await generateIndividualAnalysis(supabaseClient, playerId)
    } else if (analysisType === 'team' && teamId) {
      analysis = await generateTeamAnalysis(supabaseClient, teamId)
    } else if (analysisType === 'meta') {
      analysis = await generateMetaAnalysis(supabaseClient)
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid analysis type or missing parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({
        analysis_type: analysisType,
        player_id: playerId,
        team_id: teamId,
        analysis,
        generated_at: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in champion-pool-analysis function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function generateIndividualAnalysis(supabaseClient: any, playerId: string) {
  // Fetch player's champion pool
  const { data: championPools, error: poolError } = await supabaseClient
    .from('champion_pools')
    .select('*')
    .eq('player_id', playerId)
    .order('comfort_level', { ascending: false })

  if (poolError) {
    throw poolError
  }

  // Fetch player's recent performance
  const { data: recentGames, error: gamesError } = await supabaseClient
    .from('scrim_participants')
    .select(`
      *,
      scrim_game:scrim_games(*)
    `)
    .eq('player_id', playerId)
    .limit(20)
    .order('created_at', { ascending: false })

  if (gamesError) {
    console.error('Error fetching recent games:', gamesError)
  }

  return {
    champion_mastery: analyzeChampionMastery(championPools || []),
    role_flexibility: analyzeRoleFlexibility(championPools || []),
    performance_trends: analyzePerformanceTrends(recentGames || []),
    recommendations: generatePlayerRecommendations(championPools || [], recentGames || []),
    champion_diversity: calculateChampionDiversity(championPools || []),
    meta_alignment: analyzeMetaAlignment(championPools || [])
  }
}

async function generateTeamAnalysis(supabaseClient: any, teamId: string) {
  // Fetch all players in the team
  const { data: players, error: playersError } = await supabaseClient
    .from('players')
    .select(`
      *,
      champion_pools(*)
    `)
    .eq('tenant_id', teamId)

  if (playersError) {
    throw playersError
  }

  return {
    team_champion_coverage: analyzeTeamChampionCoverage(players || []),
    role_coverage: analyzeTeamRoleCoverage(players || []),
    flex_pick_potential: analyzeFlexPickPotential(players || []),
    team_synergies: analyzeTeamSynergies(players || []),
    draft_flexibility: calculateDraftFlexibility(players || []),
    meta_readiness: analyzeTeamMetaReadiness(players || [])
  }
}

async function generateMetaAnalysis(supabaseClient: any) {
  // Fetch recent champion usage across all games
  const { data: recentParticipants, error: participantsError } = await supabaseClient
    .from('scrim_participants')
    .select('champion_name, role, kills, deaths, assists, created_at')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })

  if (participantsError) {
    throw participantsError
  }

  return {
    meta_champions: analyzeMetaChampions(recentParticipants || []),
    role_meta: analyzeRoleMeta(recentParticipants || []),
    emerging_picks: identifyEmergingPicks(recentParticipants || []),
    power_picks: identifyPowerPicks(recentParticipants || []),
    ban_worthy_champions: identifyBanWorthyChampions(recentParticipants || [])
  }
}

// Analysis helper functions
function analyzeChampionMastery(championPools: any[]) {
  const masteryLevels = {
    expert: championPools.filter(p => p.comfort_level >= 9),
    proficient: championPools.filter(p => p.comfort_level >= 7 && p.comfort_level < 9),
    comfortable: championPools.filter(p => p.comfort_level >= 5 && p.comfort_level < 7),
    learning: championPools.filter(p => p.comfort_level < 5)
  }

  return {
    total_champions: championPools.length,
    mastery_distribution: {
      expert: masteryLevels.expert.length,
      proficient: masteryLevels.proficient.length,
      comfortable: masteryLevels.comfortable.length,
      learning: masteryLevels.learning.length
    },
    top_champions: masteryLevels.expert.slice(0, 5).map(p => ({
      champion: p.champion_name,
      comfort_level: p.comfort_level,
      win_rate: p.win_rate,
      games_played: p.games_played
    }))
  }
}

function analyzeRoleFlexibility(championPools: any[]) {
  const roleDistribution: { [key: string]: number } = {}
  championPools.forEach(pool => {
    if (pool.role) {
      roleDistribution[pool.role] = (roleDistribution[pool.role] || 0) + 1
    }
  })

  return {
    primary_role: Object.entries(roleDistribution).sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown',
    role_distribution: roleDistribution,
    flexibility_score: Object.keys(roleDistribution).length,
    can_flex: Object.keys(roleDistribution).length > 1
  }
}

function analyzePerformanceTrends(recentGames: any[]) {
  if (recentGames.length === 0) return { message: 'No recent game data available' }

  const recentPerformance = recentGames.slice(0, 10).map(game => ({
    kda: ((game.kills || 0) + (game.assists || 0)) / Math.max(game.deaths || 1, 1),
    champion: game.champion_name,
    date: game.created_at
  }))

  const averageKDA = recentPerformance.reduce((sum, game) => sum + game.kda, 0) / recentPerformance.length

  return {
    recent_average_kda: averageKDA.toFixed(2),
    recent_champions: recentPerformance.map(g => g.champion),
    performance_trend: averageKDA > 2 ? 'positive' : averageKDA > 1.5 ? 'stable' : 'concerning',
    games_analyzed: recentPerformance.length
  }
}

function generatePlayerRecommendations(championPools: any[], recentGames: any[]) {
  const lowComfortChampions = championPools.filter(p => p.comfort_level < 6)
  const underplayedChampions = championPools.filter(p => p.games_played < 5)

  return {
    champions_to_practice: lowComfortChampions.slice(0, 3).map(p => p.champion_name),
    underutilized_champions: underplayedChampions.slice(0, 3).map(p => p.champion_name),
    role_expansion_suggestion: championPools.length < 15 ? 'Consider expanding champion pool' : 'Focus on mastering current champions'
  }
}

function calculateChampionDiversity(championPools: any[]) {
  const roles = [...new Set(championPools.map(p => p.role).filter(Boolean))]
  return {
    unique_champions: championPools.length,
    role_coverage: roles.length,
    diversity_score: championPools.length > 0 ? roles.length / Math.max(championPools.length, 1) : 0
  }
}

function analyzeMetaAlignment(championPools: any[]) {
  // Simplified meta analysis
  const metaChampions = ['azir', 'jinx', 'thresh', 'graves', 'gnar'] // Example meta champions
  const metaChampionsInPool = championPools.filter(p => 
    metaChampions.includes(p.champion_name.toLowerCase())
  )

  return {
    meta_champions_owned: metaChampionsInPool.length,
    meta_alignment_percentage: (metaChampionsInPool.length / metaChampions.length) * 100,
    missing_meta_champions: metaChampions.filter(champion => 
      !championPools.some(p => p.champion_name.toLowerCase() === champion)
    )
  }
}

function analyzeTeamChampionCoverage(players: any[]) {
  const allChampions = new Set()
  players.forEach(player => {
    player.champion_pools?.forEach((pool: any) => {
      allChampions.add(pool.champion_name)
    })
  })

  return {
    total_unique_champions: allChampions.size,
    champions_per_player: players.map(player => ({
      player_name: player.summoner_name,
      champion_count: player.champion_pools?.length || 0
    }))
  }
}

function analyzeTeamRoleCoverage(players: any[]) {
  const roleCoverage: { [key: string]: string[] } = {}
  
  players.forEach(player => {
    const primaryRole = player.role
    if (primaryRole) {
      if (!roleCoverage[primaryRole]) roleCoverage[primaryRole] = []
      roleCoverage[primaryRole].push(player.summoner_name)
    }
  })

  return {
    role_assignments: roleCoverage,
    coverage_gaps: ['top', 'jungle', 'mid', 'adc', 'support'].filter(role => 
      !roleCoverage[role] || roleCoverage[role].length === 0
    )
  }
}

function analyzeFlexPickPotential(players: any[]) {
  const flexChampions: { [key: string]: string[] } = {}
  
  players.forEach(player => {
    player.champion_pools?.forEach((pool: any) => {
      if (!flexChampions[pool.champion_name]) flexChampions[pool.champion_name] = []
      flexChampions[pool.champion_name].push(player.summoner_name)
    })
  })

  const trueFlexPicks = Object.entries(flexChampions).filter(([_, players]) => players.length > 1)

  return {
    flex_champions: trueFlexPicks.map(([champion, players]) => ({ champion, players })),
    flex_potential_score: trueFlexPicks.length
  }
}

function analyzeTeamSynergies(players: any[]) {
  return {
    synergy_analysis: 'Team synergy analysis would require more complex champion interaction data',
    recommended_combinations: []
  }
}

function calculateDraftFlexibility(players: any[]) {
  const totalChampions = players.reduce((sum, player) => sum + (player.champion_pools?.length || 0), 0)
  const averagePoolSize = totalChampions / Math.max(players.length, 1)

  return {
    team_flexibility_score: averagePoolSize,
    flexibility_rating: averagePoolSize > 15 ? 'high' : averagePoolSize > 10 ? 'medium' : 'low'
  }
}

function analyzeTeamMetaReadiness(players: any[]) {
  return {
    meta_readiness: 'Team meta readiness analysis requires current meta data',
    recommendations: ['Keep champion pools updated', 'Practice meta champions']
  }
}

function analyzeMetaChampions(participants: any[]) {
  const championStats: { [key: string]: { picks: number, wins: number } } = {}
  
  participants.forEach(participant => {
    if (participant.champion_name) {
      const champion = participant.champion_name
      if (!championStats[champion]) {
        championStats[champion] = { picks: 0, wins: 0 }
      }
      championStats[champion].picks++
      // Assuming win if KDA > 1
      if (((participant.kills || 0) + (participant.assists || 0)) > (participant.deaths || 1)) {
        championStats[champion].wins++
      }
    }
  })

  return Object.entries(championStats)
    .map(([champion, stats]) => ({
      champion,
      pick_rate: stats.picks,
      win_rate: stats.picks > 0 ? (stats.wins / stats.picks * 100).toFixed(1) + '%' : '0%'
    }))
    .sort((a, b) => b.pick_rate - a.pick_rate)
    .slice(0, 10)
}

function analyzeRoleMeta(participants: any[]) {
  const roleStats: { [key: string]: any } = {}
  
  participants.forEach(participant => {
    if (participant.role) {
      if (!roleStats[participant.role]) {
        roleStats[participant.role] = { champions: {}, total_games: 0 }
      }
      roleStats[participant.role].total_games++
      
      if (participant.champion_name) {
        const champion = participant.champion_name
        if (!roleStats[participant.role].champions[champion]) {
          roleStats[participant.role].champions[champion] = 0
        }
        roleStats[participant.role].champions[champion]++
      }
    }
  })

  return Object.entries(roleStats).map(([role, stats]: [string, any]) => ({
    role,
    total_games: stats.total_games,
    popular_champions: Object.entries(stats.champions)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([champion, picks]) => ({ champion, picks }))
  }))
}

function identifyEmergingPicks(participants: any[]) {
  // Simplified emerging picks identification
  const recentChampions = participants.slice(0, 50).map(p => p.champion_name).filter(Boolean)
  const championCounts: { [key: string]: number } = {}
  
  recentChampions.forEach(champion => {
    championCounts[champion] = (championCounts[champion] || 0) + 1
  })

  return Object.entries(championCounts)
    .filter(([_, count]) => count >= 2)
    .map(([champion, count]) => ({ champion, recent_picks: count }))
    .slice(0, 5)
}

function identifyPowerPicks(participants: any[]) {
  return analyzeMetaChampions(participants).slice(0, 5)
}

function identifyBanWorthyChampions(participants: any[]) {
  return analyzeMetaChampions(participants)
    .filter(champion => parseInt(champion.win_rate) > 60)
    .slice(0, 5)
}
