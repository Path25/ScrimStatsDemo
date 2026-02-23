
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
      game_time_seconds,
      blue_team_kills,
      red_team_kills,
      blue_team_gold,
      red_team_gold,
      participants_data,
      objectives_state,
      game_events
    } = await req.json()

    if (!desktop_session_id || game_time_seconds === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: desktop_session_id, game_time_seconds' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Ensure game_time_seconds is an integer
    const gameTimeInt = Math.floor(Number(game_time_seconds));
    if (isNaN(gameTimeInt)) {
      return new Response(
        JSON.stringify({ error: 'game_time_seconds must be a valid number' }),
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

    // Find the active monitoring session with better error handling
    const { data: session, error: sessionError } = await supabaseClient
      .from('scrim_monitoring_sessions')
      .select('id, scrim_id')
      .eq('desktop_session_id', desktop_session_id)
      .eq('session_status', 'active')
      .maybeSingle()

    if (sessionError) {
      console.error('Error finding monitoring session:', sessionError)
      return new Response(
        JSON.stringify({ error: 'Database error finding monitoring session' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!session) {
      console.log(`No active monitoring session found for desktop_session_id: ${desktop_session_id}`)
      return new Response(
        JSON.stringify({ 
          error: 'Active monitoring session not found',
          desktop_session_id: desktop_session_id,
          help: 'Make sure start-game-monitoring was called first'
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Find the current game for this session
    const { data: currentGame, error: gameError } = await supabaseClient
      .from('scrim_games')
      .select('id')
      .eq('scrim_id', session.scrim_id)
      .eq('desktop_session_id', desktop_session_id)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (gameError) {
      console.error('Error finding current game:', gameError)
      return new Response(
        JSON.stringify({ error: 'Database error finding current game' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!currentGame) {
      console.log(`No active game found for scrim_id: ${session.scrim_id}, desktop_session_id: ${desktop_session_id}`)
      return new Response(
        JSON.stringify({ 
          error: 'Active game not found for this session',
          scrim_id: session.scrim_id,
          desktop_session_id: desktop_session_id
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Updating live data for game ${currentGame.id}, game time: ${gameTimeInt}s`)

    // Insert live game data with integer game time
    const { error: liveDataError } = await supabaseClient
      .from('live_game_data')
      .insert({
        scrim_game_id: currentGame.id,
        game_time_seconds: gameTimeInt,
        blue_team_kills: blue_team_kills || 0,
        red_team_kills: red_team_kills || 0,
        blue_team_gold: blue_team_gold || 0,
        red_team_gold: red_team_gold || 0,
        participants_state: participants_data || [],
        objectives_state: objectives_state || {},
        game_events: game_events || [],
        data_source: 'desktop_app'
      })

    if (liveDataError) {
      console.error('Error inserting live game data:', liveDataError)
      return new Response(
        JSON.stringify({ error: 'Failed to save live game data', details: liveDataError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get existing participants for this game to update them
    const { data: existingParticipants, error: participantsError } = await supabaseClient
      .from('scrim_participants')
      .select('id, summoner_name')
      .eq('scrim_game_id', currentGame.id)

    if (participantsError) {
      console.error('Error fetching existing participants:', participantsError)
    }

    // Update participant stats if provided and participants exist
    let participantUpdates = 0;
    if (participants_data && Array.isArray(participants_data) && existingParticipants) {
      for (const participant of participants_data) {
        if (participant.summoner_name) {
          // Find matching existing participant
          const existingParticipant = existingParticipants.find(p => 
            p.summoner_name?.toLowerCase().trim() === participant.summoner_name?.toLowerCase().trim()
          );

          if (existingParticipant) {
            const { error: participantError } = await supabaseClient
              .from('scrim_participants')
              .update({
                kills: participant.kills || 0,
                deaths: participant.deaths || 0,
                assists: participant.assists || 0,
                cs: participant.cs || 0,
                gold: participant.gold || 0,
                level: participant.level || 1,
                items: participant.items || [],
                damage_dealt: participant.damage_dealt || 0,
                damage_taken: participant.damage_taken || 0,
                vision_score: participant.vision_score || 0,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingParticipant.id)

            if (participantError) {
              console.error(`Error updating participant ${participant.summoner_name}:`, participantError)
            } else {
              participantUpdates++;
            }
          } else {
            console.log(`No existing participant found for ${participant.summoner_name}`)
          }
        }
      }
      console.log(`Updated ${participantUpdates} participants out of ${participants_data.length} provided`)
    }

    // Update session last activity
    await supabaseClient
      .from('scrim_monitoring_sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', session.id)

    return new Response(
      JSON.stringify({
        success: true,
        game_id: currentGame.id,
        game_time: gameTimeInt,
        participant_updates: participantUpdates,
        message: 'Live game data updated successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in update-live-game function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
