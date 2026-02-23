
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
      game_id,
      raw_champion_select_data,
      source = 'client',
      timestamp
    } = await req.json()

    if (!game_id || !raw_champion_select_data) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: game_id, raw_champion_select_data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate that we have the expected champion select structure
    if (!raw_champion_select_data.timer || !raw_champion_select_data.myTeam) {
      return new Response(
        JSON.stringify({ error: 'Invalid champion select data structure' }),
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

    // Determine our team side based on team numbers in the data
    // In custom games, team 1 is typically blue, team 2 is red
    const ourTeamSide = raw_champion_select_data.myTeam?.[0]?.team === 1 ? 'blue' : 
                        raw_champion_select_data.myTeam?.[0]?.team === 2 ? 'red' : 'blue'

    // Check if draft already exists for this game
    const { data: existingDraft, error: fetchError } = await supabaseClient
      .from('game_drafts')
      .select('id, draft_data')
      .eq('scrim_game_id', game_id)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching existing draft:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to check existing draft' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare the draft data object with raw champion select data
    const draftData = {
      raw_champion_select: raw_champion_select_data,
      captured_at: timestamp || new Date().toISOString(),
      phase: raw_champion_select_data.timer?.phase || 'unknown',
      source: source,
      game_id: raw_champion_select_data.gameId || 0,
      is_custom_game: raw_champion_select_data.isCustomGame || false,
      is_completed: raw_champion_select_data.timer?.phase === 'FINALIZATION' || false
    }

    let result
    if (existingDraft) {
      // Update existing draft with new data
      const { data, error } = await supabaseClient
        .from('game_drafts')
        .update({
          draft_data: draftData,
          our_team_side: ourTeamSide,
          updated_at: new Date().toISOString(),
          completed_at: draftData.is_completed ? new Date().toISOString() : null
        })
        .eq('id', existingDraft.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating draft:', error)
        throw error
      }
      result = data
    } else {
      // Create new draft
      const { data, error } = await supabaseClient
        .from('game_drafts')
        .insert([{
          scrim_game_id: game_id,
          draft_mode: source === 'client' ? 'client' : 'external',
          draft_data: draftData,
          our_team_side: ourTeamSide,
          completed_at: draftData.is_completed ? new Date().toISOString() : null
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating draft:', error)
        throw error
      }
      result = data
    }

    console.log(`Draft ${existingDraft ? 'updated' : 'created'} for game ${game_id} - Phase: ${draftData.phase}`)

    return new Response(
      JSON.stringify({
        success: true,
        draft_id: result.id,
        action: existingDraft ? 'updated' : 'created',
        phase: draftData.phase,
        our_team_side: ourTeamSide,
        is_completed: draftData.is_completed
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in auto-draft-detection function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
