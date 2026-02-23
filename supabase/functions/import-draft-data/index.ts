
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
    const { game_id, tool_id, tenant_id } = await req.json()

    if (!game_id || !tool_id || !tenant_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: game_id, tool_id, tenant_id' }),
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

    // Get the external draft tool configuration with decrypted data
    const { data: draftToolArray, error: toolError } = await supabaseClient
      .rpc('get_external_draft_tool_decrypted', {
        p_tool_id: tool_id,
        p_tenant_id: tenant_id
      })

    const draftTool = draftToolArray?.[0]

    if (toolError || !draftTool) {
      return new Response(
        JSON.stringify({ error: 'Draft tool not found or access denied' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the game to check if it exists and belongs to the tenant
    const { data: game, error: gameError } = await supabaseClient
      .from('scrim_games')
      .select('*, scrims!inner(tenant_id)')
      .eq('id', game_id)
      .single()

    if (gameError || !game || game.scrims.tenant_id !== tenant_id) {
      return new Response(
        JSON.stringify({ error: 'Game not found or access denied' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let draftData = null

    // Import draft data based on tool type
    switch (draftTool.tool_type) {
      case 'championselect':
        draftData = await importFromChampionSelect(draftTool, game_id)
        break
      case 'draftlol':
        draftData = await importFromDraftLol(draftTool, game_id)
        break
      case 'custom_webhook':
        draftData = await importFromCustomWebhook(draftTool, game_id)
        break
      default:
        throw new Error(`Unsupported tool type: ${draftTool.tool_type}`)
    }

    if (!draftData) {
      return new Response(
        JSON.stringify({ error: 'No draft data available from the selected tool' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if draft already exists for this game
    const { data: existingDraft } = await supabaseClient
      .from('game_drafts')
      .select('id')
      .eq('scrim_game_id', game_id)
      .single()

    let result

    if (existingDraft) {
      // Update existing draft
      const { data, error } = await supabaseClient
        .from('game_drafts')
        .update({
          draft_data: draftData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingDraft.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Create new draft
      const { data, error } = await supabaseClient
        .from('game_drafts')
        .insert([{
          scrim_game_id: game_id,
          draft_mode: 'external',
          draft_data: draftData,
          our_team_side: 'blue' // Default, can be updated later
        }])
        .select()
        .single()

      if (error) throw error
      result = data
    }

    // Update the tool's last_sync timestamp
    await supabaseClient
      .from('external_draft_tools')
      .update({ last_sync: new Date().toISOString() })
      .eq('id', tool_id)

    return new Response(
      JSON.stringify({
        success: true,
        draft: result,
        imported_at: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in import-draft-data function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function importFromChampionSelect(tool: any, gameId: string) {
  if (!tool.api_endpoint) {
    throw new Error('ChampionSelect API endpoint not configured')
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    if (tool.api_key) {
      headers['Authorization'] = `Bearer ${tool.api_key}`
    }

    const response = await fetch(`${tool.api_endpoint}/draft/${gameId}`, {
      headers
    })

    if (!response.ok) {
      throw new Error(`ChampionSelect API error: ${response.status}`)
    }

    const data = await response.json()
    
    return transformChampionSelectData(data)
  } catch (error) {
    console.error('Error importing from ChampionSelect:', error)
    return null
  }
}

async function importFromDraftLol(tool: any, gameId: string) {
  if (!tool.api_endpoint) {
    throw new Error('DraftLol API endpoint not configured')
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    if (tool.api_key) {
      headers['X-API-Key'] = tool.api_key
    }

    const response = await fetch(`${tool.api_endpoint}/api/draft/${gameId}`, {
      headers
    })

    if (!response.ok) {
      throw new Error(`DraftLol API error: ${response.status}`)
    }

    const data = await response.json()
    
    return transformDraftLolData(data)
  } catch (error) {
    console.error('Error importing from DraftLol:', error)
    return null
  }
}

async function importFromCustomWebhook(tool: any, gameId: string) {
  if (!tool.webhook_url) {
    throw new Error('Custom webhook URL not configured')
  }

  try {
    const response = await fetch(tool.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'get_draft_data',
        game_id: gameId
      })
    })

    if (!response.ok) {
      throw new Error(`Custom webhook error: ${response.status}`)
    }

    const data = await response.json()
    
    return transformCustomWebhookData(data)
  } catch (error) {
    console.error('Error importing from custom webhook:', error)
    return null
  }
}

function transformChampionSelectData(data: any) {
  return {
    picks: [
      ...(data.blue_picks || []).map((pick: any, index: number) => ({
        order: index + 1,
        team: 'blue',
        champion: pick.champion,
        role: pick.role,
        player: pick.player
      })),
      ...(data.red_picks || []).map((pick: any, index: number) => ({
        order: index + 1,
        team: 'red',
        champion: pick.champion,
        role: pick.role,
        player: pick.player
      }))
    ],
    bans: [
      ...(data.blue_bans || []).map((ban: any, index: number) => ({
        order: index + 1,
        team: 'blue',
        champion: ban.champion
      })),
      ...(data.red_bans || []).map((ban: any, index: number) => ({
        order: index + 1,
        team: 'red',
        champion: ban.champion
      }))
    ],
    phase: data.completed ? 'completed' : 'draft',
    completed: data.completed || false
  }
}

function transformDraftLolData(data: any) {
  return {
    picks: [
      ...(data.team1?.picks || []).map((pick: any, index: number) => ({
        order: index + 1,
        team: 'blue',
        champion: pick.championName,
        role: pick.assignedPosition,
        player: pick.summonerName
      })),
      ...(data.team2?.picks || []).map((pick: any, index: number) => ({
        order: index + 1,
        team: 'red',
        champion: pick.championName,
        role: pick.assignedPosition,
        player: pick.summonerName
      }))
    ],
    bans: [
      ...(data.team1?.bans || []).map((ban: any, index: number) => ({
        order: index + 1,
        team: 'blue',
        champion: ban.championName
      })),
      ...(data.team2?.bans || []).map((ban: any, index: number) => ({
        order: index + 1,
        team: 'red',
        champion: ban.championName
      }))
    ],
    phase: data.phaseComplete ? 'completed' : 'draft',
    completed: data.phaseComplete || false
  }
}

function transformCustomWebhookData(data: any) {
  // Assume the custom webhook returns data in our expected format
  return {
    picks: data.picks || [],
    bans: data.bans || [],
    phase: data.phase || 'draft',
    completed: data.completed || false
  }
}
