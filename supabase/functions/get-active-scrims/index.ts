
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

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user's tenant
    const { data: tenantUser, error: tenantError } = await supabaseClient
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single()

    if (tenantError || !tenantUser) {
      return new Response(
        JSON.stringify({ error: 'User not associated with any team' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const now = new Date()
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000)
    
    // Find scrims that are:
    // 1. Starting within 30 minutes
    // 2. Started up to 6 hours ago (extended window for hybrid monitoring)
    // 3. Currently in progress
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000)

    const { data: scrims, error: scrimsError } = await supabaseClient
      .from('scrims')
      .select(`
        id,
        opponent_name,
        scheduled_time,
        match_date,
        status,
        format,
        auto_monitoring_enabled,
        data_source,
        scrim_games(
          id,
          game_number,
          status,
          created_at,
          external_game_data
        )
      `)
      .eq('tenant_id', tenantUser.tenant_id)
      .gte('scheduled_time', sixHoursAgo.toISOString())
      .lte('scheduled_time', thirtyMinutesFromNow.toISOString())
      .in('status', ['scheduled', 'in_progress'])
      .order('scheduled_time', { ascending: true })

    if (scrimsError) {
      console.error('Error fetching scrims:', scrimsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch active scrims' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Calculate extended time windows based on format and games added
    const activeScrimsWithExtensions = scrims.map(scrim => {
      const scrimTime = new Date(scrim.scheduled_time)
      const gameCount = scrim.scrim_games?.length || 0
      
      // Get expected games from format
      const expectedGames = getExpectedGamesFromFormat(scrim.format)
      
      // Base window: 15 minutes before + 1 hour per expected game (or actual games if more)
      const monitoringStart = new Date(scrimTime.getTime() - 15 * 60 * 1000)
      const hoursToMonitor = Math.max(expectedGames, gameCount)
      const extendedEndTime = new Date(scrimTime.getTime() + hoursToMonitor * 60 * 60 * 1000)
      
      const isWithinWindow = now >= monitoringStart && now <= extendedEndTime
      const minutesToStart = Math.round((scrimTime.getTime() - now.getTime()) / (1000 * 60))
      const hoursActive = Math.round((now.getTime() - scrimTime.getTime()) / (1000 * 60 * 60) * 10) / 10

      // Check for incomplete GRID games
      const incompleteGridGames = scrim.scrim_games?.filter(game => {
        const gridMetadata = game.external_game_data?.grid_metadata
        return gridMetadata?.seriesId && (
          game.status !== 'completed' || 
          !game.external_game_data?.post_game_data?.participants?.length ||
          gridMetadata.didWeWin === undefined
        )
      }) || []

      return {
        ...scrim,
        is_within_monitoring_window: isWithinWindow,
        minutes_to_start: minutesToStart,
        hours_active: hoursActive > 0 ? hoursActive : null,
        game_count: gameCount,
        expected_games: expectedGames,
        incomplete_grid_games: incompleteGridGames.length,
        extended_end_time: extendedEndTime.toISOString(),
        monitoring_priority: isWithinWindow ? (minutesToStart <= 0 ? 1 : 2) : 3,
        needs_monitoring: isWithinWindow || incompleteGridGames.length > 0
      }
    })

    // Filter to only scrims that need monitoring
    const monitorableScrims = activeScrimsWithExtensions
      .filter(scrim => scrim.needs_monitoring && scrim.status !== 'completed')
      .sort((a, b) => a.monitoring_priority - b.monitoring_priority)

    // Get the primary scrim (highest priority)
    const primaryScrim = monitorableScrims.length > 0 ? monitorableScrims[0] : null

    // Check for existing monitoring sessions for the primary scrim
    let activeSession = null
    if (primaryScrim) {
      const { data: sessions } = await supabaseClient
        .from('scrim_monitoring_sessions')
        .select('*')
        .eq('scrim_id', primaryScrim.id)
        .eq('session_status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)

      activeSession = sessions && sessions.length > 0 ? sessions[0] : null
    }

    // Trigger server-side monitoring if we have GRID scrims with auto-monitoring enabled
    const gridScrimsNeedingMonitoring = monitorableScrims.filter(scrim => 
      scrim.data_source === 'grid' && 
      scrim.auto_monitoring_enabled &&
      (scrim.incomplete_grid_games > 0 || scrim.is_within_monitoring_window)
    )

    if (gridScrimsNeedingMonitoring.length > 0) {
      // Trigger server-side monitoring (fire and forget)
      supabaseClient.functions.invoke('grid-auto-monitoring', {
        body: { background_check: true }
      }).catch(error => {
        console.error('Background GRID monitoring failed:', error)
      })
    }

    console.log(`Found ${monitorableScrims.length} monitorable scrims for team ${tenantUser.tenant_id}`)
    if (primaryScrim) {
      console.log(`Primary scrim: ${primaryScrim.opponent_name} (${primaryScrim.id})`)
    }

    return new Response(
      JSON.stringify({
        active_scrims: monitorableScrims,
        primary_scrim: primaryScrim,
        active_session: activeSession,
        current_time: now.toISOString(),
        monitoring_summary: {
          total_scrims: monitorableScrims.length,
          grid_scrims_monitoring: gridScrimsNeedingMonitoring.length,
          has_primary_target: !!primaryScrim,
          session_active: !!activeSession,
          hybrid_monitoring_active: gridScrimsNeedingMonitoring.length > 0
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in get-active-scrims function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function getExpectedGamesFromFormat(format: string): number {
  if (!format) return 3
  const match = format.match(/(\d+)/)
  return match ? parseInt(match[1]) : 3
}
