
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

    // Get user's tenant/team information
    const { data: tenantUser, error: tenantError } = await supabaseClient
      .from('tenant_users')
      .select(`
        tenant_id,
        role,
        tenants (
          id,
          name,
          slug
        )
      `)
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

    // Get team roster (active players)
    const { data: players, error: playersError } = await supabaseClient
      .from('players')
      .select('id, summoner_name, riot_id, role, rank, lp')
      .eq('tenant_id', tenantUser.tenant_id)
      .eq('is_active', true)
      .order('summoner_name', { ascending: true })

    if (playersError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch team roster' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Return team and roster information
    const response = {
      user: {
        id: user.id,
        email: user.email,
        role: tenantUser.role
      },
      team: {
        id: tenantUser.tenants.id,
        name: tenantUser.tenants.name,
        slug: tenantUser.tenants.slug
      },
      roster: players.map(player => ({
        id: player.id,
        summoner_name: player.summoner_name,
        riot_id: player.riot_id,
        role: player.role,
        rank: player.rank,
        lp: player.lp
      }))
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in team-roster function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
