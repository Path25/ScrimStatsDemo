
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
      replay_url
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

    // Find the active game for this session
    const { data: currentGame, error: gameError } = await supabaseClient
      .from('scrim_games')
      .select('id, scrim_id')
      .eq('desktop_session_id', desktop_session_id)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (gameError || !currentGame) {
      return new Response(
        JSON.stringify({ error: 'Active game not found for this session' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update the game with final results
    const { error: updateError } = await supabaseClient
      .from('scrim_games')
      .update({
        status: 'completed',
        result: game_result,
        duration_seconds: game_duration_seconds,
        game_end_time: new Date().toISOString(),
        match_history_url: match_history_url,
        replay_url: replay_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentGame.id)

    if (updateError) {
      console.error('Error updating game:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update game' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update participant final stats if provided
    if (final_stats && Array.isArray(final_stats)) {
      for (const stat of final_stats) {
        if (stat.summoner_name) {
          const { error: participantError } = await supabaseClient
            .from('scrim_participants')
            .update({
              kills: stat.kills || 0,
              deaths: stat.deaths || 0,
              assists: stat.assists || 0,
              cs: stat.cs || 0,
              gold: stat.gold || 0,
              damage_dealt: stat.damage_dealt || 0,
              damage_taken: stat.damage_taken || 0,
              vision_score: stat.vision_score || 0,
              items: stat.items || [],
              level: stat.level || 1,
              updated_at: new Date().toISOString()
            })
            .eq('scrim_game_id', currentGame.id)
            .eq('summoner_name', stat.summoner_name)

          if (participantError) {
            console.error(`Error updating participant ${stat.summoner_name}:`, participantError)
          }
        }
      }
    }

    // End monitoring session
    const { error: sessionError } = await supabaseClient
      .from('scrim_monitoring_sessions')
      .update({
        session_status: 'completed',
        last_activity_at: new Date().toISOString()
      })
      .eq('desktop_session_id', desktop_session_id)
      .eq('session_status', 'active')

    if (sessionError) {
      console.error('Error ending monitoring session:', sessionError)
    }

    // Update scrim status if all games are completed
    const { data: scrimGames } = await supabaseClient
      .from('scrim_games')
      .select('status')
      .eq('scrim_id', currentGame.scrim_id)

    const allCompleted = scrimGames?.every(game => game.status === 'completed')
    
    if (allCompleted) {
      await supabaseClient
        .from('scrims')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', currentGame.scrim_id)
    }

    console.log(`Game tracking ended for session ${desktop_session_id}`)

    return new Response(
      JSON.stringify({
        success: true,
        game_id: currentGame.id,
        message: 'Game tracking ended successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in end-game-tracking function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
