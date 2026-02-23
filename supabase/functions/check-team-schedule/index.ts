
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
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000)
    
    // Find scrims that are starting within 15 minutes or have started and could still be ongoing
    // Assuming max 5 games per scrim, 1 hour per game + 1 hour buffer = 6 hours total
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000)

    const { data: scrims, error: scrimsError } = await supabaseClient
      .from('scrims')
      .select(`
        id,
        opponent_name,
        scheduled_time,
        match_date,
        status,
        format
      `)
      .eq('tenant_id', tenantUser.tenant_id)
      .gte('scheduled_time', sixHoursAgo.toISOString())
      .lte('scheduled_time', fifteenMinutesFromNow.toISOString())
      .in('status', ['scheduled', 'in_progress'])
      .order('scheduled_time', { ascending: true })

    if (scrimsError) {
      console.error('Error fetching scrims:', scrimsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch team schedule' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Determine which scrims are relevant
    const relevantScrims = scrims.map(scrim => {
      const scrimTime = new Date(scrim.scheduled_time)
      const timeDiff = now.getTime() - scrimTime.getTime()
      const minutesToStart = (scrimTime.getTime() - now.getTime()) / (1000 * 60)
      
      let status = 'scheduled'
      if (timeDiff > 0) {
        status = 'ongoing'
      } else if (minutesToStart <= 15) {
        status = 'starting_soon'
      }

      return {
        ...scrim,
        status: status,
        minutes_to_start: Math.round(minutesToStart),
        hours_since_start: timeDiff > 0 ? Math.round(timeDiff / (1000 * 60 * 60) * 10) / 10 : null
      }
    })

    console.log(`Found ${relevantScrims.length} relevant scrims for team ${tenantUser.tenant_id}`)

    return new Response(
      JSON.stringify({
        scrims: relevantScrims,
        current_time: now.toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in check-team-schedule function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
