
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
    const { 
      team_id,
      current_draft_state,
      analysis_type = 'recommendations' 
    } = await req.json()

    if (!team_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: team_id' }),
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

    // Fetch team's champion pools and historical data
    const { data: championPools, error: poolError } = await supabaseClient
      .from('champion_pools')
      .select('*')
      .eq('player_id', team_id) // This should be filtered by team's players
    
    if (poolError) {
      console.error('Error fetching champion pools:', poolError)
    }

    // Fetch recent games for analysis
    const { data: recentGames, error: gamesError } = await supabaseClient
      .from('scrim_games')
      .select(`
        *,
        participants:scrim_participants(*),
        drafts:game_drafts(*)
      `)
      .limit(10)
      .order('created_at', { ascending: false })

    if (gamesError) {
      console.error('Error fetching recent games:', gamesError)
    }

    let intelligence = {}

    switch (analysis_type) {
      case 'recommendations':
        intelligence = generatePickRecommendations(current_draft_state, championPools, recentGames)
        break
      case 'counter_picks':
        intelligence = generateCounterPicks(current_draft_state, recentGames)
        break
      case 'ban_suggestions':
        intelligence = generateBanSuggestions(current_draft_state, recentGames)
        break
      case 'team_composition':
        intelligence = analyzeTeamComposition(current_draft_state)
        break
      default:
        intelligence = generatePickRecommendations(current_draft_state, championPools, recentGames)
    }

    return new Response(
      JSON.stringify({
        team_id,
        analysis_type,
        intelligence,
        generated_at: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in draft-intelligence function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function generatePickRecommendations(draftState: any, championPools: any[], recentGames: any[]) {
  const ourPicks = draftState?.picks?.filter((p: any) => p.team === 'blue') || []
  const enemyPicks = draftState?.picks?.filter((p: any) => p.team === 'red') || []
  const pickedChampions = [...ourPicks, ...enemyPicks].map((p: any) => p.champion.toLowerCase())
  
  // Get available champions from champion pools that haven't been picked
  const availableChampions = championPools?.filter(pool => 
    !pickedChampions.includes(pool.champion_name.toLowerCase())
  ) || []

  // Sort by comfort level and win rate
  const recommendations = availableChampions
    .sort((a, b) => {
      const aScore = (a.comfort_level || 0) + (a.win_rate || 0) * 10
      const bScore = (b.comfort_level || 0) + (b.win_rate || 0) * 10
      return bScore - aScore
    })
    .slice(0, 5)
    .map(pool => ({
      champion: pool.champion_name,
      role: pool.role,
      comfort_level: pool.comfort_level,
      win_rate: pool.win_rate,
      recommendation_reason: generateRecommendationReason(pool, ourPicks, enemyPicks)
    }))

  return {
    recommended_picks: recommendations,
    draft_phase: determineDraftPhase(ourPicks, enemyPicks),
    priority_roles: identifyPriorityRoles(ourPicks)
  }
}

function generateCounterPicks(draftState: any, recentGames: any[]) {
  const enemyPicks = draftState?.picks?.filter((p: any) => p.team === 'red') || []
  
  if (enemyPicks.length === 0) {
    return { message: 'No enemy picks to counter yet' }
  }

  // Analyze historical matchups from recent games
  const counterSuggestions = enemyPicks.map((pick: any) => ({
    enemy_champion: pick.champion,
    enemy_role: pick.role,
    counter_suggestions: generateCountersForChampion(pick.champion, recentGames),
    lane_matchup_tips: generateLaneMatchupTips(pick.champion, pick.role)
  }))

  return {
    counter_picks: counterSuggestions,
    overall_strategy: generateOverallCounterStrategy(enemyPicks)
  }
}

function generateBanSuggestions(draftState: any, recentGames: any[]) {
  const existingBans = [
    ...(draftState?.bans?.filter((b: any) => b.team === 'blue') || []),
    ...(draftState?.bans?.filter((b: any) => b.team === 'red') || [])
  ].map((b: any) => b.champion.toLowerCase())

  // Analyze meta champions from recent games
  const championFrequency = analyzeChampionPickRate(recentGames)
  const metaChampions = Object.entries(championFrequency)
    .filter(([champion, _]) => !existingBans.includes(champion.toLowerCase()))
    .sort(([_, a], [__, b]) => (b as number) - (a as number))
    .slice(0, 10)

  return {
    priority_bans: metaChampions.slice(0, 3).map(([champion, pickRate]) => ({
      champion,
      pick_rate: pickRate,
      ban_reason: generateBanReason(champion, pickRate as number)
    })),
    situational_bans: metaChampions.slice(3, 6).map(([champion, pickRate]) => ({
      champion,
      pick_rate: pickRate,
      ban_reason: 'Situational threat'
    })),
    target_bans: generateTargetBans(recentGames)
  }
}

function analyzeTeamComposition(draftState: any) {
  const ourPicks = draftState?.picks?.filter((p: any) => p.team === 'blue') || []
  const enemyPicks = draftState?.picks?.filter((p: any) => p.team === 'red') || []

  return {
    our_composition: {
      picks: ourPicks,
      comp_type: identifyCompositionType(ourPicks),
      strengths: identifyCompositionStrengths(ourPicks),
      weaknesses: identifyCompositionWeaknesses(ourPicks),
      power_spikes: identifyPowerSpikes(ourPicks)
    },
    enemy_composition: {
      picks: enemyPicks,
      comp_type: identifyCompositionType(enemyPicks),
      strengths: identifyCompositionStrengths(enemyPicks),
      weaknesses: identifyCompositionWeaknesses(enemyPicks)
    },
    matchup_analysis: analyzeCompositionMatchup(ourPicks, enemyPicks)
  }
}

// Helper functions
function generateRecommendationReason(pool: any, ourPicks: any[], enemyPicks: any[]) {
  if (pool.comfort_level >= 8) return 'High comfort pick'
  if (pool.win_rate >= 0.7) return 'High win rate champion'
  return 'Good fit for team composition'
}

function determineDraftPhase(ourPicks: any[], enemyPicks: any[]) {
  const totalPicks = ourPicks.length + enemyPicks.length
  if (totalPicks < 6) return 'ban_phase_1'
  if (totalPicks < 8) return 'pick_phase_1'
  if (totalPicks < 10) return 'pick_phase_2'
  return 'final_picks'
}

function identifyPriorityRoles(ourPicks: any[]) {
  const filledRoles = ourPicks.map(p => p.role).filter(Boolean)
  const allRoles = ['top', 'jungle', 'mid', 'adc', 'support']
  return allRoles.filter(role => !filledRoles.includes(role))
}

function generateCountersForChampion(champion: string, recentGames: any[]) {
  // Simplified counter generation
  const commonCounters = {
    'yasuo': ['malzahar', 'annie', 'pantheon'],
    'zed': ['lissandra', 'kayle', 'malzahar'],
    'katarina': ['diana', 'kassadin', 'galio']
  }
  
  return commonCounters[champion.toLowerCase()] || ['flexible pick needed']
}

function generateLaneMatchupTips(champion: string, role: string) {
  return `Focus on early game advantage against ${champion} in ${role} lane`
}

function generateOverallCounterStrategy(enemyPicks: any[]) {
  return 'Focus on team fighting and objective control'
}

function analyzeChampionPickRate(recentGames: any[]) {
  const championsPlayed: { [key: string]: number } = {}
  
  recentGames.forEach(game => {
    game.participants?.forEach((participant: any) => {
      if (participant.champion_name) {
        const champion = participant.champion_name.toLowerCase()
        championsPlayed[champion] = (championsPlayed[champion] || 0) + 1
      }
    })
  })

  return championsPlayed
}

function generateBanReason(champion: string, pickRate: number) {
  if (pickRate > 5) return 'Highly contested meta pick'
  if (pickRate > 3) return 'Popular meta champion'
  return 'Situational threat'
}

function generateTargetBans(recentGames: any[]) {
  return [
    { champion: 'enemy_comfort_pick', reason: 'Target enemy comfort pick' }
  ]
}

function identifyCompositionType(picks: any[]) {
  if (picks.length < 3) return 'incomplete'
  return 'standard' // Simplified
}

function identifyCompositionStrengths(picks: any[]) {
  return ['team_fighting', 'objective_control']
}

function identifyCompositionWeaknesses(picks: any[]) {
  return ['early_game', 'split_push_defense']
}

function identifyPowerSpikes(picks: any[]) {
  return ['mid_game', 'late_game']
}

function analyzeCompositionMatchup(ourPicks: any[], enemyPicks: any[]) {
  return {
    favorable_phases: ['mid_game'],
    unfavorable_phases: ['early_game'],
    key_matchups: ['mid_vs_mid', 'bot_vs_bot']
  }
}
