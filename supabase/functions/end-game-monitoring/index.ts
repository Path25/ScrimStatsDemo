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
      desktop_session_id,
      game_result,
      game_duration_seconds,
      final_stats,
      match_history_url,
      replay_url,
      game_timeline,
      objectives_data,
      team_stats,
      post_game_data
    } = await req.json()

    if (!desktop_session_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: desktop_session_id' }),
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

    // Find the active monitoring session
    const { data: session, error: sessionError } = await supabaseClient
      .from('scrim_monitoring_sessions')
      .select('id, scrim_id')
      .eq('desktop_session_id', desktop_session_id)
      .eq('session_status', 'active')
      .maybeSingle()

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Active monitoring session not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Find the current game
    const { data: currentGame, error: gameError } = await supabaseClient
      .from('scrim_games')
      .select('id, scrim_id')
      .eq('scrim_id', session.scrim_id)
      .eq('desktop_session_id', desktop_session_id)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (gameError || !currentGame) {
      return new Response(
        JSON.stringify({ error: 'Active game not found for this session' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Build comprehensive game update data
    const updateData: any = {
      status: 'completed',
      game_end_time: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      result: game_result || null,
      duration_seconds: game_duration_seconds || null,
      match_history_url: match_history_url || null,
      replay_url: replay_url || null
    }

    // Add team statistics if provided
    if (team_stats) {
      if (team_stats.our_team_kills !== undefined) updateData.our_team_kills = team_stats.our_team_kills
      if (team_stats.enemy_team_kills !== undefined) updateData.enemy_team_kills = team_stats.enemy_team_kills
      if (team_stats.our_team_gold !== undefined) updateData.our_team_gold = team_stats.our_team_gold
      if (team_stats.enemy_team_gold !== undefined) updateData.enemy_team_gold = team_stats.enemy_team_gold
    }

    // Add objectives data if provided
    if (objectives_data) {
      updateData.objectives = objectives_data
    }

    // Store additional post-game data in external_game_data field
    if (post_game_data || game_timeline) {
      const { data: existingGame } = await supabaseClient
        .from('scrim_games')
        .select('external_game_data')
        .eq('id', currentGame.id)
        .single()

      const existingData = existingGame?.external_game_data || {}
      
      updateData.external_game_data = {
        ...existingData,
        post_game_data: post_game_data || {},
        game_timeline: game_timeline || {},
        final_submission_time: new Date().toISOString()
      }
    }

    // Update the game with all final data
    const { error: updateError } = await supabaseClient
      .from('scrim_games')
      .update(updateData)
      .eq('id', currentGame.id)

    if (updateError) {
      console.error('Error updating game:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update game', details: updateError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Bulk update participant final stats if provided
    let participantsUpdated = 0;
    if (final_stats && Array.isArray(final_stats)) {
      console.log(`Processing final stats for ${final_stats.length} participants`)
      
      for (const stat of final_stats) {
        if (stat.summoner_name) {
          const participantUpdate: any = {
            updated_at: new Date().toISOString()
          }

          // Add all available stats
          if (stat.kills !== undefined) participantUpdate.kills = stat.kills
          if (stat.deaths !== undefined) participantUpdate.deaths = stat.deaths
          if (stat.assists !== undefined) participantUpdate.assists = stat.assists
          if (stat.cs !== undefined) participantUpdate.cs = stat.cs
          if (stat.gold !== undefined) participantUpdate.gold = stat.gold
          if (stat.damage_dealt !== undefined) participantUpdate.damage_dealt = stat.damage_dealt
          if (stat.damage_taken !== undefined) participantUpdate.damage_taken = stat.damage_taken
          if (stat.vision_score !== undefined) participantUpdate.vision_score = stat.vision_score
          if (stat.level !== undefined) participantUpdate.level = stat.level
          if (stat.champion_name) participantUpdate.champion_name = stat.champion_name
          if (stat.role) participantUpdate.role = stat.role

          // Handle complex data as JSON
          if (stat.items && Array.isArray(stat.items)) participantUpdate.items = stat.items
          if (stat.runes) participantUpdate.runes = stat.runes
          if (stat.summoner_spells) participantUpdate.summoner_spells = stat.summoner_spells

          const { error: participantError } = await supabaseClient
            .from('scrim_participants')
            .update(participantUpdate)
            .eq('scrim_game_id', currentGame.id)
            .eq('summoner_name', stat.summoner_name)

          if (participantError) {
            console.error(`Error updating participant ${stat.summoner_name}:`, participantError)
          } else {
            participantsUpdated++
          }
        }
      }
      
      console.log(`Successfully updated ${participantsUpdated} participants`)
    }

    // Update the monitoring session last activity but keep it active for potential next game
    await supabaseClient
      .from('scrim_monitoring_sessions')
      .update({
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', session.id)

    // The logic to automatically mark a scrim as 'completed' has been removed
    // to prevent premature completion when more games are part of the series.
    // Scrims should now be manually completed via the UI.
    const scrimStatusUpdate = null;
    
    console.log(`Game monitoring ended for game ${currentGame.id}, updated ${participantsUpdated} participants`)

    return new Response(
      JSON.stringify({
        success: true,
        game_id: currentGame.id,
        participants_updated: participantsUpdated,
        scrim_completed: !!scrimStatusUpdate, // This will now always be false
        session_id: session.id,
        message: 'Game monitoring ended successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in end-game-monitoring function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
