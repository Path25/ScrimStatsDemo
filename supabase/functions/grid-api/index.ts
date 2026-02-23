import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request type and data
    let requestType = 'mergedData' // default
    let seriesId: string | null = null
    let teamTag: string | null = null
    let teamId: string | null = null
    
    const url = new URL(req.url)
    seriesId = url.searchParams.get('seriesId')
    teamTag = url.searchParams.get('teamTag')
    teamId = url.searchParams.get('teamId')
    
    if (!seriesId && !teamTag && !teamId) {
      try {
        const body = await req.json()
        seriesId = body.seriesId
        teamTag = body.teamTag
        teamId = body.teamId
        
        // Determine request type based on what's provided
        if (teamTag) {
          requestType = 'verifyTeam'
        } else if (teamId !== undefined || (teamId === undefined && !seriesId)) {
          requestType = 'getTeamSeries'
        } else if (seriesId) {
          requestType = 'mergedData'
        }
      } catch (e) {
        seriesId = "2823108" // Fallback for testing
        requestType = 'mergedData'
      }
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No authorization header' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid authentication' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get tenant and API key
    const { data: tenantData } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!tenantData) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No tenant found' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: tenant } = await supabase
      .from('tenants')
      .select('grid_api_key, grid_team_id')
      .eq('id', tenantData.tenant_id)
      .maybeSingle()

    if (!tenant || !tenant.grid_api_key) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'GRID API key not configured' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Handle different request types
    if (requestType === 'verifyTeam' && teamTag) {
      
      const teamsUrl = `https://api.grid.gg/central-data/riot/teams`
      
      const teamsResponse = await fetch(teamsUrl, {
        headers: { 'X-API-Key': tenant.grid_api_key }
      })
      
      if (!teamsResponse.ok) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Failed to fetch teams data: ${teamsResponse.status}` 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      const teamsData = await teamsResponse.json()
      const team = teamsData.find((t: any) => 
        t.tag?.toLowerCase() === teamTag.toLowerCase() || 
        t.nameShortened?.toLowerCase() === teamTag.toLowerCase()
      )
      
      return new Response(JSON.stringify({ 
        success: true, 
        team: team || null 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (requestType === 'getTeamSeries') {
      
      const finalTeamId = teamId || tenant.grid_team_id
      if (!finalTeamId) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'No team ID available' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      const seriesUrl = `https://api.grid.gg/central-data/riot/series?teamIds=${finalTeamId}&limit=10`
      
      const seriesResponse = await fetch(seriesUrl, {
        headers: { 'X-API-Key': tenant.grid_api_key }
      })
      
      if (!seriesResponse.ok) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Failed to fetch series data: ${seriesResponse.status}` 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      const seriesData = await seriesResponse.json()
      
      return new Response(JSON.stringify({ 
        success: true, 
        series: seriesData || [] 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Default: merged data for a specific series
    if (!seriesId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Series ID required for merged data' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fetch data from GRID API
    const summaryUrl = `https://api.grid.gg/file-download/end-state/riot/series/${seriesId}/games/1/summary`
    const detailsUrl = `https://api.grid.gg/file-download/end-state/riot/series/${seriesId}/games/1/details`
    
    const [summaryResponse, detailsResponse] = await Promise.all([
      fetch(summaryUrl, {
        headers: { 'X-API-Key': tenant.grid_api_key }
      }),
      fetch(detailsUrl, {
        headers: { 'X-API-Key': tenant.grid_api_key }
      })
    ])

    if (!summaryResponse.ok || !detailsResponse.ok) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Failed to fetch GRID data. Summary: ${summaryResponse.status}, Details: ${detailsResponse.status}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const summaryData = await summaryResponse.json()
    const detailsData = await detailsResponse.json()

    // Get team roster to identify our players
    const { data: teamRoster } = await supabase
      .from('players')
      .select('summoner_name, riot_id')
      .eq('tenant_id', tenantData.tenant_id)
      .eq('is_active', true)

    

    // Helper function to detect our team side by matching roster players
    const detectOurTeamSide = (participants: any[]): 'blue' | 'red' => {
      if (!teamRoster || teamRoster.length === 0) {
        return 'blue'
      }

      // Create normalized name sets for our roster
      const rosterNames = new Set<string>()
      teamRoster.forEach(player => {
        if (player.summoner_name) {
          rosterNames.add(player.summoner_name.toLowerCase().trim())
        }
        if (player.riot_id) {
          rosterNames.add(player.riot_id.toLowerCase().trim())
          // Also add just the name part before # if it exists
          const nameOnly = player.riot_id.split('#')[0].toLowerCase().trim()
          rosterNames.add(nameOnly)
        }
      })

      

      // Count matches per team
      const teamMatches = { 100: 0, 200: 0 }
      
      participants.forEach(participant => {
        const riotIdGameName = (participant.riotIdGameName || '').toLowerCase().trim()
        const summonerName = (participant.summonerName || '').toLowerCase().trim()
        
        // Check if this participant matches any of our roster
        const isOurPlayer = rosterNames.has(riotIdGameName) || 
                           rosterNames.has(summonerName) ||
                           rosterNames.has(riotIdGameName.split('#')[0])
        
        if (isOurPlayer) {
          teamMatches[participant.teamId]++
        }
      })
      
      // Determine our team based on most matches
      if (teamMatches[200] > teamMatches[100]) {
        return 'red'
      } else if (teamMatches[100] > 0) {
        return 'blue'
      } else {
        return 'blue'
      }
    }

    // Detect our team side
    const ourTeamSide = detectOurTeamSide(summaryData.participants || [])
    const ourTeamId = ourTeamSide === 'blue' ? 100 : 200
    
    // Determine if we won
    let didWeWin = false
    if (summaryData.teams && Array.isArray(summaryData.teams)) {
      const ourTeam = summaryData.teams.find((team: any) => team.teamId === ourTeamId)
      if (ourTeam) {
        didWeWin = ourTeam.win || false
      }
    }
    
    // Create the exact format matching your example
    const result = {
      draft_data: {
        bans: { red: [], blue: [] },
        picks: { red: [], blue: [] }
      },
      grid_metadata: {
        didWeWin: didWeWin,
        seriesId: seriesId,
        gameState: "completed",
        gameNumber: 1,
        hasDetails: !!detailsData,
        hasSummary: !!summaryData,
        isCompleted: true,
        ourTeamSide: ourTeamSide,
        seriesTitle: `Series ${seriesId}`,
        last_updated: new Date().toISOString()
      },
      post_game_data: {
        teams: (summaryData.teams || []).map((team: any) => ({
          win: team.win || false,
          teamId: team.teamId,
          participants: []
        })),
        gameLength: summaryData.gameDuration || 0,
        participants: summaryData.participants || []
      }
    }

    // Extract picks from participants - group by team and assign order
    if (summaryData.participants && Array.isArray(summaryData.participants)) {
      const blueTeamParticipants = summaryData.participants.filter((p: any) => p.teamId === 100)
      const redTeamParticipants = summaryData.participants.filter((p: any) => p.teamId === 200)
      
      // Sort by participantId to maintain consistent order
      blueTeamParticipants.sort((a: any, b: any) => (a.participantId || 0) - (b.participantId || 0))
      redTeamParticipants.sort((a: any, b: any) => (a.participantId || 0) - (b.participantId || 0))
      
      result.draft_data.picks.blue = blueTeamParticipants.map((participant: any, index: number) => ({
        order: index + 1,
        championName: participant.championName || 'Unknown Champion',
        participantId: participant.participantId || participant.id
      }))
      
      result.draft_data.picks.red = redTeamParticipants.map((participant: any, index: number) => ({
        order: index + 1,
        championName: participant.championName || 'Unknown Champion',
        participantId: participant.participantId || participant.id
      }))
    }


    return new Response(JSON.stringify({ 
      success: true, 
      data: result 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})