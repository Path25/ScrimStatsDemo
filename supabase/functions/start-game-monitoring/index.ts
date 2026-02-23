
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
      scrim_id, 
      desktop_session_id, 
      detected_players, 
      game_start_time,
      game_mode,
      auto_detected = true,
      league_client_data,
      raw_game_data
    } = await req.json()

    console.log('Received start-game-monitoring request:', {
      scrim_id,
      desktop_session_id,
      detected_players: detected_players?.length || 0,
      game_start_time,
      game_mode,
      auto_detected,
      has_league_client_data: !!league_client_data,
      has_raw_game_data: !!raw_game_data
    })

    if (!scrim_id || !desktop_session_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: scrim_id, desktop_session_id' }),
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

    // Verify scrim exists and user has access
    const { data: scrim, error: scrimError } = await supabaseClient
      .from('scrims')
      .select('id, tenant_id, scheduled_time')
      .eq('id', scrim_id)
      .single()

    if (scrimError || !scrim) {
      console.error('Scrim not found:', scrimError)
      return new Response(
        JSON.stringify({ error: 'Scrim not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user belongs to the tenant
    const { data: tenantUser } = await supabaseClient
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .eq('tenant_id', scrim.tenant_id)
      .single()

    if (!tenantUser) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get team roster for player matching
    const { data: roster, error: rosterError } = await supabaseClient
      .from('players')
      .select('summoner_name, riot_id')
      .eq('tenant_id', scrim.tenant_id)
      .eq('is_active', true)

    if (rosterError) {
      console.error('Error fetching roster:', rosterError)
    }

    console.log('Team roster found:', roster?.length || 0, 'players')

    // Enhanced player matching function
    const isOurTeamPlayer = (playerName: string) => {
      if (!roster || !playerName) return false;
      
      const normalizedPlayerName = playerName.toLowerCase().trim();
      
      return roster.some(rosterPlayer => {
        const normalizedSummonerName = rosterPlayer.summoner_name?.toLowerCase().trim();
        const normalizedRiotId = rosterPlayer.riot_id?.toLowerCase().trim();
        
        return normalizedSummonerName === normalizedPlayerName || 
               normalizedRiotId === normalizedPlayerName ||
               normalizedSummonerName?.includes(normalizedPlayerName) ||
               normalizedPlayerName?.includes(normalizedSummonerName);
      });
    };

    // Determine which side we're on based on our team players
    let ourTeamSide = 'blue'; // default
    if (detected_players && Array.isArray(detected_players)) {
      const blueTeamPlayers = detected_players.filter(p => p.team === 'blue' || p.team === 100);
      const redTeamPlayers = detected_players.filter(p => p.team === 'red' || p.team === 200);
      
      const ourPlayersInBlue = blueTeamPlayers.filter(p => isOurTeamPlayer(p.summoner_name)).length;
      const ourPlayersInRed = redTeamPlayers.filter(p => isOurTeamPlayer(p.summoner_name)).length;
      
      if (ourPlayersInRed > ourPlayersInBlue) {
        ourTeamSide = 'red';
      }
      
      console.log(`Detected team sides - Blue: ${blueTeamPlayers.length}, Red: ${redTeamPlayers.length}`);
      console.log(`Our players in Blue: ${ourPlayersInBlue}, Red: ${ourPlayersInRed} -> We are ${ourTeamSide} team`);
    }

    // SMART GAME REUSE LOGIC: Check for existing draft-only games
    const { data: existingGames } = await supabaseClient
      .from('scrim_games')
      .select('id, game_number, status, created_at')
      .eq('scrim_id', scrim_id)
      .order('game_number', { ascending: false })

    let gameToUse = null;
    let nextGameNumber = 1;

    if (existingGames && existingGames.length > 0) {
      // Check if the most recent game is in draft status and created recently (within 2 hours)
      const mostRecentGame = existingGames[0];
      const gameCreatedAt = new Date(mostRecentGame.created_at);
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

      if (mostRecentGame.status === 'draft' && gameCreatedAt > twoHoursAgo) {
        console.log(`Reusing existing draft game ${mostRecentGame.id} (game ${mostRecentGame.game_number})`);
        gameToUse = mostRecentGame;
      } else {
        nextGameNumber = mostRecentGame.game_number + 1;
      }
    }

    // Create new game or update existing one
    if (!gameToUse) {
      console.log(`Creating new game ${nextGameNumber} for scrim ${scrim_id}`);
      
      const { data: newGame, error: gameError } = await supabaseClient
        .from('scrim_games')
        .insert({
          scrim_id: scrim_id,
          game_number: nextGameNumber,
          status: 'in_progress',
          side: ourTeamSide,
          game_start_time: game_start_time || new Date().toISOString(),
          desktop_session_id: desktop_session_id,
          auto_created: auto_detected,
          external_game_data: {
            league_client_data: league_client_data || {},
            raw_game_data: raw_game_data || {},
            detected_players: detected_players || [],
            game_mode: game_mode || 'CLASSIC'
          }
        })
        .select()
        .single()

      if (gameError) {
        console.error('Error creating scrim game:', gameError)
        return new Response(
          JSON.stringify({ error: 'Failed to create game record', details: gameError.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      gameToUse = newGame;
    } else {
      // Update existing draft game to in_progress
      const { data: updatedGame, error: updateError } = await supabaseClient
        .from('scrim_games')
        .update({
          status: 'in_progress',
          side: ourTeamSide,
          game_start_time: game_start_time || new Date().toISOString(),
          desktop_session_id: desktop_session_id,
          external_game_data: {
            league_client_data: league_client_data || {},
            raw_game_data: raw_game_data || {},
            detected_players: detected_players || [],
            game_mode: game_mode || 'CLASSIC'
          }
        })
        .eq('id', gameToUse.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating existing game:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update game record', details: updateError.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      gameToUse = updatedGame;
    }

    console.log('Using game:', gameToUse.id, 'game number:', gameToUse.game_number, 'side:', ourTeamSide)

    // Create or extend monitoring session
    let session = null;
    const { data: existingSession } = await supabaseClient
      .from('scrim_monitoring_sessions')
      .select('*')
      .eq('scrim_id', scrim_id)
      .eq('session_status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)

    if (existingSession && existingSession.length > 0) {
      // Extend existing session by 1 hour for this new game
      const currentSession = existingSession[0];
      const newExpectedEnd = new Date(new Date(currentSession.expected_end_at || currentSession.started_at).getTime() + 60 * 60 * 1000);
      
      const { data: extendedSession, error: extendError } = await supabaseClient
        .from('scrim_monitoring_sessions')
        .update({
          last_activity_at: new Date().toISOString(),
          expected_end_at: newExpectedEnd.toISOString(),
          desktop_session_id: desktop_session_id
        })
        .eq('id', currentSession.id)
        .select()
        .single()

      if (extendError) {
        console.error('Error extending monitoring session:', extendError)
      } else {
        session = extendedSession;
        console.log('Extended existing monitoring session:', session.id, 'new end time:', newExpectedEnd.toISOString())
      }
    }

    if (!session) {
      // Create new monitoring session
      const scrimTime = new Date(scrim.scheduled_time);
      const sessionEndTime = new Date(scrimTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours default

      const { data: newSession, error: sessionError } = await supabaseClient
        .from('scrim_monitoring_sessions')
        .insert({
          scrim_id: scrim_id,
          desktop_session_id: desktop_session_id,
          data_source: 'desktop_app',
          session_status: 'active',
          started_at: new Date().toISOString(),
          expected_end_at: sessionEndTime.toISOString(),
          last_activity_at: new Date().toISOString()
        })
        .select()
        .single()

      if (sessionError) {
        console.error('Error creating monitoring session:', sessionError)
        return new Response(
          JSON.stringify({ error: 'Failed to create monitoring session', details: sessionError.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      session = newSession;
      console.log('Created new monitoring session:', session.id)
    }

    // Create participant records for detected players
    let participantsCreated = 0;
    if (detected_players && Array.isArray(detected_players) && detected_players.length > 0) {
      console.log('Processing', detected_players.length, 'detected players')
      
      const participantInserts = detected_players.map((player: any) => {
        const isOurTeam = isOurTeamPlayer(player.summoner_name);
        console.log(`Player ${player.summoner_name} (${player.team}) -> ${isOurTeam ? 'Our Team' : 'Enemy Team'}`);
        
        return {
          scrim_game_id: gameToUse.id,
          summoner_name: player.summoner_name || 'Unknown',
          is_our_team: isOurTeam,
          champion_name: player.champion_name || player.champion || null,
          role: player.role || player.position || null,
          level: player.level || 1,
          kills: player.kills || 0,
          deaths: player.deaths || 0,
          assists: player.assists || 0,
          cs: player.cs || player.minions_killed || 0,
          gold: player.gold || player.current_gold || 0
        };
      });

      const { data: participantsData, error: participantError } = await supabaseClient
        .from('scrim_participants')
        .insert(participantInserts)
        .select()

      if (participantError) {
        console.error('Error creating participants:', participantError)
      } else {
        participantsCreated = participantsData?.length || 0;
        console.log('Successfully created', participantsCreated, 'participants')
      }
    }

    // Update scrim status to in_progress if it's still scheduled
    if (scrim.status === 'scheduled') {
      await supabaseClient
        .from('scrims')
        .update({ status: 'in_progress' })
        .eq('id', scrim_id)
    }

    console.log(`Started monitoring for scrim ${scrim_id}, game ${gameToUse.game_number}`)

    return new Response(
      JSON.stringify({
        success: true,
        game_id: gameToUse.id,
        game_number: gameToUse.game_number,
        our_team_side: ourTeamSide,
        session_id: session?.id,
        participants_created: participantsCreated,
        session_extended: !!existingSession,
        reused_existing_game: gameToUse.id !== gameToUse.game_number, // Approximate check
        message: 'Game monitoring started successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in start-game-monitoring function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
