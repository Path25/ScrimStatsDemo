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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Check if this is a manual scan - first check query params, then body
    const url = new URL(req.url)
    let isManualScan = url.searchParams.get('scan_type') === 'manual'
    
    // If not found in query params, check request body
    if (!isManualScan) {
      try {
        const body = await req.json()
        isManualScan = body?.scan_type === 'manual'
      } catch (error) {
        // If body parsing fails, continue with default behavior
      }
    }
    
    console.log(`🔄 Starting GRID auto-monitoring ${isManualScan ? 'manual scan' : 'automatic scan'}...`)

    // Get all tenants with GRID integration enabled
    const { data: tenants, error: tenantError } = await supabaseClient
      .from('tenants')
      .select('id, grid_api_key, grid_team_id, settings, grid_integration_enabled, name, tenant_capture_settings!inner(profile)')
      .eq('grid_integration_enabled', true)
      .eq('tenant_capture_settings.profile', 'grid_manual')
      .not('grid_api_key', 'is', null)
      .not('grid_team_id', 'is', null)

    if (tenantError) {
      console.error('❌ Error fetching tenants:', tenantError)
      return new Response(JSON.stringify({ error: 'Failed to fetch tenants' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!tenants || tenants.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        scan_type: isManualScan ? 'manual' : 'automatic',
        processed_tenants: 0,
        total_games_processed: 0,
        message: 'No tenants found with GRID integration enabled',
        results: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`📈 Found ${tenants?.length || 0} tenants with GRID integration`)

    const results = []

    for (const tenant of tenants || []) {
      try {
        // STEP 1: Pre-load TENANT-SPECIFIC existing series assignments to prevent duplicates
        console.log(`🔍 Pre-loading existing series assignments for tenant ${tenant.name} (${tenant.id})`)
        const { data: existingAssignments } = await supabaseClient
          .from('scrim_games')
          .select('scrim_id, external_game_data, scrims!inner(tenant_id)')
          .eq('scrims.tenant_id', tenant.id)
          .not('external_game_data->grid_metadata->seriesId', 'is', null)

        const tenantSeriesAssignments = new Map<string, string>()
        if (existingAssignments) {
          existingAssignments.forEach(game => {
            const seriesId = game.external_game_data?.grid_metadata?.seriesId
            if (seriesId) {
              tenantSeriesAssignments.set(seriesId, game.scrim_id)
            }
          })
        }
        console.log(`📋 Found ${tenantSeriesAssignments.size} existing series assignments for tenant ${tenant.name}`)

        // STEP 2: Get scrims that need monitoring - expand the range to include recent scrims
        const now = new Date()
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days lookback
        const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000) // 30 minutes forward

        const { data: scrims, error: scrimsError } = await supabaseClient
          .from('scrims')
          .select(`
            id,
            scheduled_time,
            opponent_name,
            format,
            auto_monitoring_enabled,
            scrim_games(
              id,
              external_game_data,
              status,
              game_number
            )
          `)
          .eq('tenant_id', tenant.id)
          .eq('data_source', 'grid')
          .gte('scheduled_time', sevenDaysAgo.toISOString())
          .lte('scheduled_time', thirtyMinutesFromNow.toISOString())
          .in('status', ['scheduled', 'in_progress'])

        if (scrimsError) {
          console.error(`❌ Error fetching scrims for tenant ${tenant.id}:`, scrimsError)
          continue
        }

        // STEP 3: Sort scrims chronologically to ensure earlier scrims get priority
        const sortedScrims = (scrims || []).sort((a, b) => 
          new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime()
        )

        console.log(`📅 Processing ${sortedScrims.length} scrims in chronological order for tenant ${tenant.name}`)

        // STEP 4: Fetch all series for this team using the correct GraphQL API
        let allSeries = []
        try {
          const graphqlQuery = {
            query: `
              query AllSeries {
                allSeries(
                  filter: {
                    teamId: ${JSON.stringify(String(tenant.grid_team_id))}
                    startTimeScheduled: {
                      gte: ${JSON.stringify(sevenDaysAgo.toISOString())}
                      lte: ${JSON.stringify(thirtyMinutesFromNow.toISOString())}
                    }
                  }
                  last: 50
                ) {
                  edges {
                    node {
                      id
                      type
                      startTimeScheduled
                      teams {
                        scoreAdvantage
                      }
                    }
                  }
                }
              }
            `
          }

          const seriesResponse = await fetch('https://api.grid.gg/central-data/graphql', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': tenant.grid_api_key
            },
            body: JSON.stringify(graphqlQuery)
          })

          if (seriesResponse.ok) {
            const graphqlResult = await seriesResponse.json()
            
            if (graphqlResult.data?.allSeries?.edges) {
              allSeries = graphqlResult.data.allSeries.edges.map((edge: any) => edge.node)
              console.log(`📊 Found ${allSeries.length} total series for tenant ${tenant.name}`)
            }
          } else {
            console.error(`❌ GraphQL API failed for tenant ${tenant.id}: ${seriesResponse.status}`)
            continue
          }
        } catch (error) {
          console.error(`❌ Error fetching series for tenant ${tenant.id}:`, error)
          continue
        }

        let gamesProcessed = 0

        // STEP 5: Process each scrim individually with ULTRA-STRICT date validation
        for (const scrim of sortedScrims) {
          // For manual scans, process all scrims. For automatic scans, check auto_monitoring_enabled
          if (!isManualScan && !scrim.auto_monitoring_enabled) {
            continue
          }

          const scrimTime = new Date(scrim.scheduled_time)
          
          // CRITICAL: Create exact date boundaries for this specific scrim
          const scrimDateStart = new Date(Date.UTC(
            scrimTime.getUTCFullYear(),
            scrimTime.getUTCMonth(),
            scrimTime.getUTCDate(),
            0, 0, 0, 0
          ))
          const scrimDateEnd = new Date(Date.UTC(
            scrimTime.getUTCFullYear(),
            scrimTime.getUTCMonth(),
            scrimTime.getUTCDate(),
            23, 59, 59, 999
          ))
          
          const expectedGames = getExpectedGamesFromFormat(scrim.format)
          
          console.log(`🎯 Processing scrim vs ${scrim.opponent_name} (${scrim.id})`)
          console.log(`   Scrim time: ${scrimTime.toISOString()}`)
          console.log(`   STRICT date boundaries: ${scrimDateStart.toISOString()} to ${scrimDateEnd.toISOString()}`)
          console.log(`   Expected games: ${expectedGames}`)

          // STEP 6: PRIMARY DATE FILTER - This is the most important filter
          const sameDateSeries = allSeries.filter(series => {
            const seriesTime = new Date(series.startTimeScheduled)
            
            // ULTRA-STRICT: Series must be within the exact same UTC date boundaries
            const isWithinDateBoundaries = seriesTime >= scrimDateStart && seriesTime <= scrimDateEnd
            
            console.log(`   📋 Series ${series.id} date check:`)
            console.log(`      Series time: ${seriesTime.toISOString()}`)
            console.log(`      Within date boundaries: ${isWithinDateBoundaries}`)
            
            if (!isWithinDateBoundaries) {
              console.log(`   ❌ Series ${series.id} REJECTED - outside date boundaries`)
              return false
            }
            
            return true
          })

          console.log(`   📊 Found ${sameDateSeries.length} series on the same date`)

          // STEP 7: SECONDARY TIME WINDOW FILTER - Only applied to same-date series
          const timeWindowStart = new Date(scrimTime.getTime() - 15 * 60 * 1000) // 15 minutes before
          const timeWindowEnd = new Date(scrimTime.getTime() + Math.min(expectedGames * 90 * 60 * 1000, 4 * 60 * 60 * 1000)) // Max 4 hours
          
          const candidateSeries = sameDateSeries.filter(series => {
            const seriesTime = new Date(series.startTimeScheduled)
            
            // Check if within time window
            const inTimeWindow = seriesTime >= timeWindowStart && seriesTime <= timeWindowEnd
            
            // Check if already assigned to THIS TENANT
            const assignedScrimId = tenantSeriesAssignments.get(series.id)
            const assignedToAnotherScrim = Boolean(assignedScrimId && assignedScrimId !== scrim.id)
            
            console.log(`   🔍 Series ${series.id} final validation:`)
            console.log(`      Time window (${timeWindowStart.toISOString()} - ${timeWindowEnd.toISOString()}): ${inTimeWindow}`)
            console.log(`      Assigned to another scrim: ${assignedToAnotherScrim}`)
            
            const isValid = inTimeWindow && !assignedToAnotherScrim
            
            if (isValid) {
              console.log(`   ✅ Series ${series.id} is VALID for this scrim`)
            } else {
              if (!inTimeWindow) {
                console.log(`   ❌ Series ${series.id} REJECTED - outside time window`)
              } else if (assignedToAnotherScrim) {
                console.log(`   ❌ Series ${series.id} REJECTED - already assigned to scrim ${assignedScrimId}`)
              }
            }
            
            return isValid
          }).sort((a, b) => {
            const aAssignedHere = tenantSeriesAssignments.get(a.id) === scrim.id ? 1 : 0
            const bAssignedHere = tenantSeriesAssignments.get(b.id) === scrim.id ? 1 : 0
            if (aAssignedHere !== bAssignedHere) return bAssignedHere - aAssignedHere
            return Math.abs(new Date(a.startTimeScheduled).getTime() - scrimTime.getTime())
              - Math.abs(new Date(b.startTimeScheduled).getTime() - scrimTime.getTime())
          }).slice(0, 1)

          console.log(`   ✅ Final candidate series count: ${candidateSeries.length}`)

          // STEP 8: Process each valid candidate series with triple validation
          for (const series of candidateSeries) {
            try {
              // STEP 9: FINAL DATABASE VALIDATION - prevent cross-scrim assignment within the tenant
              console.log(`   🔒 Final database validation for series ${series.id}`)
              const { data: existingGameCheck } = await supabaseClient
                .from('scrim_games')
                .select('id, scrim_id, external_game_data, scrims!inner(tenant_id)')
                .eq('external_game_data->grid_metadata->>seriesId', series.id)
                .eq('scrims.tenant_id', tenant.id)
                .limit(1)
                .maybeSingle()

              if (existingGameCheck && existingGameCheck.scrim_id !== scrim.id) {
                console.log(`   ⚠️ FINAL CHECK: Series ${series.id} belongs to scrim ${existingGameCheck.scrim_id}, skipping`)
                continue
              }

              const synchronizedGames = await synchronizeSeriesGames(supabaseClient, scrim.id, series, tenant)
              gamesProcessed += synchronizedGames
              tenantSeriesAssignments.set(series.id, scrim.id)
              console.log(`   ✅ Synchronized ${synchronizedGames} completed games for series ${series.id}`)
            } catch (error) {
              console.error(`   ❌ Error processing series ${series.id} for scrim ${scrim.id}:`, error)
              // Do NOT add to tenantSeriesAssignments on error - allow retry
            }
          }
        }

        results.push({ 
          tenant_id: tenant.id, 
          tenant_name: tenant.name,
          status: 'completed',
          scrims_processed: sortedScrims?.length || 0,
          games_processed: gamesProcessed,
          series_found: allSeries.length,
          existing_assignments: tenantSeriesAssignments.size
        })

      } catch (error) {
        console.error(`❌ Error processing tenant ${tenant.id}:`, error)
        results.push({ tenant_id: tenant.id, status: 'error', error: error.message })
      }
    }

    const totalGamesProcessed = results.reduce((sum, r) => sum + (r.games_processed || 0), 0)
    console.log(`✅ GRID auto-monitoring ${isManualScan ? 'manual scan' : 'automatic scan'} completed`)

    return new Response(JSON.stringify({
      success: true,
      scan_type: isManualScan ? 'manual' : 'automatic',
      processed_tenants: results.length,
      total_games_processed: totalGamesProcessed,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Error in GRID auto-monitoring:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function getExpectedGamesFromFormat(format: string): number {
  if (!format) return 3
  const match = format.match(/(\d+)/)
  return match ? parseInt(match[1]) : 3
}

type GridSeriesGame = {
  id?: string
  sequenceNumber: number
  teams?: Array<{ id?: string; won?: boolean; side?: string }>
}

function normalizeGridSide(side: unknown): 'blue' | 'red' | undefined {
  const value = String(side || '').toLowerCase()
  if (value === 'blue' || value === '100') return 'blue'
  if (value === 'red' || value === '200') return 'red'
  return undefined
}

async function fetchSeriesStateGames(seriesId: string, apiKey: string): Promise<GridSeriesGame[]> {
  const response = await fetch('https://api.grid.gg/live-data-feed/series-state/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
    body: JSON.stringify({
      query: `query SeriesGames {
        seriesState(id: ${JSON.stringify(seriesId)}) {
          valid
          started
          finished
          games {
            id
            sequenceNumber
            teams { id won side }
          }
        }
      }`,
    }),
  })

  if (!response.ok) {
    throw new Error(`GRID Series State request failed (${response.status})`)
  }

  const payload = await response.json()
  if (payload.errors?.length) {
    throw new Error(`GRID Series State returned GraphQL errors: ${payload.errors.map((error: any) => error.message).join('; ')}`)
  }

  const games = payload.data?.seriesState?.games
  if (!Array.isArray(games)) return []

  const bySequence = new Map<number, GridSeriesGame>()
  for (const game of games) {
    const sequenceNumber = Number(game?.sequenceNumber)
    if (Number.isInteger(sequenceNumber) && sequenceNumber > 0 && !bySequence.has(sequenceNumber)) {
      bySequence.set(sequenceNumber, { ...game, sequenceNumber })
    }
  }
  return [...bySequence.values()].sort((a, b) => a.sequenceNumber - b.sequenceNumber)
}

async function ensureGridGame(
  supabaseClient: any,
  scrimId: string,
  series: any,
  gameNumber: number,
  gridGameId?: string,
) {
  const externalGameId = `grid:${series.id}:${gameNumber}`
  const { data: existingGames, error: lookupError } = await supabaseClient
    .from('scrim_games')
    .select('id, game_number, external_game_id, external_game_data')
    .eq('scrim_id', scrimId)

  if (lookupError) throw lookupError

  const existing = (existingGames || []).find((game: any) =>
    game.external_game_id === externalGameId || (
      game.external_game_data?.grid_metadata?.seriesId === series.id &&
      Number(game.external_game_data?.grid_metadata?.gameNumber || game.game_number) === gameNumber
    ),
  )

  const gridMetadata = {
    ...(existing?.external_game_data?.grid_metadata || {}),
    seriesId: series.id,
    gameNumber,
    gridGameId: gridGameId || existing?.external_game_data?.grid_metadata?.gridGameId || null,
    status: existing?.external_game_data?.grid_metadata?.status || 'placeholder',
    created_as_placeholder: existing?.external_game_data?.grid_metadata?.created_as_placeholder ?? true,
    startTimeScheduled: series.startTimeScheduled,
  }

  if (existing) {
    const { data, error } = await supabaseClient
      .from('scrim_games')
      .update({
        game_number: gameNumber,
        external_game_id: externalGameId,
        external_game_data: { ...(existing.external_game_data || {}), grid_metadata: gridMetadata },
      })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  const { data, error } = await supabaseClient
    .from('scrim_games')
    .insert({
      scrim_id: scrimId,
      game_number: gameNumber,
      external_game_id: externalGameId,
      status: 'draft',
      external_game_data: { grid_metadata: gridMetadata },
      notes: `GRID Series ${series.id}, Game ${gameNumber} - waiting for end-state data`,
      auto_created: true,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

async function synchronizeSeriesGames(supabaseClient: any, scrimId: string, series: any, tenant: any): Promise<number> {
  const games = await fetchSeriesStateGames(series.id, tenant.grid_api_key)
  if (!games.length) {
    await ensureGridGame(supabaseClient, scrimId, series, 1)
    console.log(`   GRID series ${series.id} has no announced games yet; Game 1 remains queued`)
    return 0
  }

  let completed = 0
  for (const game of games) {
    const storedGame = await ensureGridGame(supabaseClient, scrimId, series, game.sequenceNumber, game.id)
    if (await fetchAndUpdateGameData(supabaseClient, storedGame.id, series.id, game.sequenceNumber, tenant, game)) {
      completed++
    }
  }
  return completed
}

async function fetchAndUpdateGameData(
  supabaseClient: any,
  gameId: string,
  seriesId: string,
  gameNumber: number,
  tenant: any,
  seriesGame?: GridSeriesGame,
) {
  try {
    // Fetch merged data from GRID API
    const [summaryResponse, detailsResponse] = await Promise.all([
      fetch(`https://api.grid.gg/file-download/end-state/riot/series/${seriesId}/games/${gameNumber}/summary`, {
        headers: { 'X-API-Key': tenant.grid_api_key }
      }),
      fetch(`https://api.grid.gg/file-download/end-state/riot/series/${seriesId}/games/${gameNumber}/details`, {
        headers: { 'X-API-Key': tenant.grid_api_key }
      })
    ])

    if (!summaryResponse.ok || !detailsResponse.ok) {
      return false
    }

    const summaryData = await summaryResponse.json()
    const detailsData = await detailsResponse.json()

    // Get team roster to detect our team side
    const { data: teamRoster } = await supabaseClient
      .from('players')
      .select('summoner_name, riot_id')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)

    const gridTeamState = seriesGame?.teams?.find((team) => String(team.id) === String(tenant.grid_team_id))
    const ourTeamSide = normalizeGridSide(gridTeamState?.side) || detectOurTeamSide(summaryData.participants || [], teamRoster || [])
    if (!ourTeamSide) {
      console.error(`Unable to identify the team side for GRID series ${seriesId}, game ${gameNumber}; leaving the game queued for retry`)
      return false
    }
    const ourTeamId = ourTeamSide === 'blue' ? 100 : 200
    
    let didWeWin = typeof gridTeamState?.won === 'boolean' ? gridTeamState.won : false
    if (typeof gridTeamState?.won !== 'boolean' && summaryData.teams && Array.isArray(summaryData.teams)) {
      const ourTeam = summaryData.teams.find((team: any) => team.teamId === ourTeamId)
      if (ourTeam) {
        didWeWin = ourTeam.win || false
      }
    }

    const mergedData = {
      draft_data: {
        bans: { red: [], blue: [] },
        picks: { red: [], blue: [] }
      },
      grid_metadata: {
        didWeWin: didWeWin,
        seriesId: seriesId,
        gameState: "completed",
        gameNumber,
        gridGameId: seriesGame?.id || null,
        hasDetails: !!detailsData,
        hasSummary: !!summaryData,
        isCompleted: true,
        ourTeamSide: ourTeamSide,
        seriesTitle: `Series ${seriesId}`,
        last_updated: new Date().toISOString()
      },
      capture_features: {
        summary: true,
        details: !!detailsData,
        position_samples: false
      }
    }

    // Extract picks from participants
    if (summaryData.participants && Array.isArray(summaryData.participants)) {
      const blueParticipants = summaryData.participants.filter((p: any) => p.teamId === 100).sort((a: any, b: any) => (a.participantId || 0) - (b.participantId || 0))
      const redParticipants = summaryData.participants.filter((p: any) => p.teamId === 200).sort((a: any, b: any) => (a.participantId || 0) - (b.participantId || 0))
      
      mergedData.draft_data.picks.blue = blueParticipants.map((participant: any, index: number) => ({
        order: index + 1,
        championName: participant.championName || 'Unknown Champion',
        participantId: participant.participantId || participant.id
      }))
      
      mergedData.draft_data.picks.red = redParticipants.map((participant: any, index: number) => ({
        order: index + 1,
        championName: participant.championName || 'Unknown Champion',  
        participantId: participant.participantId || participant.id
      }))
    }

    // Update the game with completion data
    const { error: updateError } = await supabaseClient
      .from('scrim_games')
      .update({
        status: 'completed',
        external_game_data: mergedData,
        result: didWeWin ? 'win' : 'loss',
        external_game_id: `grid:${seriesId}:${gameNumber}`,
        duration_seconds: summaryData.gameDuration || 0,
        side: ourTeamSide,
        game_classification: summaryData.participants?.length === 10 && !summaryData.participants.some((participant: any) => participant.botPlayer)
          ? 'standard_5v5' : 'nonstandard_custom',
        quality_flags: [
          summaryData.participants?.length !== 10 ? 'non_5v5' : null,
          summaryData.participants?.some((participant: any) => participant.botPlayer) ? 'bots_present' : null,
          !detailsData ? 'missing_grid_details' : null,
        ].filter(Boolean),
        roster_coverage: teamRoster?.filter((player: any) => summaryData.participants?.some((participant: any) =>
          [participant.riotIdGameName, participant.summonerName].filter(Boolean).some((name: string) =>
            [player.riot_id, player.summoner_name].filter(Boolean).some((rosterName: string) => rosterName.toLowerCase().split('#')[0] === name.toLowerCase().split('#')[0])
          ))).length || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', gameId)

    if (updateError) {
      console.error('❌ Error updating game:', updateError)
      throw updateError
    }

    // Create participants if we have participant data
    if (summaryData.participants && summaryData.participants.length > 0) {
      await createParticipantsForGame(supabaseClient, gameId, tenant.id, summaryData.participants, ourTeamSide)
      await createDraftForGame(supabaseClient, gameId, `${seriesId}:${gameNumber}`, mergedData.draft_data, ourTeamSide)
    }

    const { error: evidenceError } = await supabaseClient
      .from('scrim_game_evidence')
      .insert({
        tenant_id: tenant.id,
        scrim_game_id: gameId,
        provider: 'grid',
        provider_record_id: `${seriesId}:${gameNumber}`,
        payload_version: 'grid-normalized-v2',
        captured_at: new Date().toISOString(),
        capabilities: ['result', 'draft', 'participant_stats'],
        metadata: { series_id: seriesId, game_number: gameNumber, grid_game_id: seriesGame?.id || null, has_summary: !!summaryData, has_details: !!detailsData }
      })

    if (evidenceError && evidenceError.code !== '23505') {
      console.error('Error recording GRID provenance:', evidenceError)
      return false
    }

    return true

  } catch (error) {
    console.error(`❌ Error fetching/updating GRID series ${seriesId}, game ${gameNumber}:`, error)
    return false
  }
}

function detectOurTeamSide(participants: any[], teamRoster: any[]): 'blue' | 'red' | undefined {
  if (!teamRoster || teamRoster.length === 0) {
    return undefined
  }

  const rosterNames = new Set<string>()
  teamRoster.forEach(player => {
    if (player.summoner_name) {
      rosterNames.add(player.summoner_name.toLowerCase().trim())
    }
    if (player.riot_id) {
      rosterNames.add(player.riot_id.toLowerCase().trim())
      const nameOnly = player.riot_id.split('#')[0].toLowerCase().trim()
      rosterNames.add(nameOnly)
    }
  })

  const teamMatches = { 100: 0, 200: 0 }
  
  participants.forEach(participant => {
    const riotIdGameName = (participant.riotIdGameName || '').toLowerCase().trim()
    const summonerName = (participant.summonerName || '').toLowerCase().trim()
    
    const isOurPlayer = rosterNames.has(riotIdGameName) || 
                       rosterNames.has(summonerName) ||
                       rosterNames.has(riotIdGameName.split('#')[0])
    
    if (isOurPlayer) {
      teamMatches[participant.teamId]++
    }
  })
  
  if (teamMatches[100] === 0 && teamMatches[200] === 0) {
    return undefined
  }

  if (teamMatches[100] === teamMatches[200]) {
    return undefined
  }

  return teamMatches[200] > teamMatches[100] ? 'red' : 'blue'
}

async function createDraftForGame(
  supabaseClient: any,
  gameId: string,
  seriesId: string,
  draftData: { picks?: Record<'blue' | 'red', any[]>; bans?: Record<'blue' | 'red', any[]> },
  ourTeamSide: 'blue' | 'red',
) {
  const normalizeActions = (kind: 'picks' | 'bans') =>
    (['blue', 'red'] as const).flatMap(team =>
      (draftData?.[kind]?.[team] || []).map((action: any, index: number) => ({
        champion: action.championName || action.champion || 'Unknown champion',
        order: Number(action.order) || index + 1,
        team,
      })),
    )

  const picks = normalizeActions('picks')
  const bans = normalizeActions('bans')
  const completed = picks.length === 10 && bans.length === 10
  const normalizedDraft = {
    picks,
    bans,
    phase: completed ? 'completed' : picks.length > 0 ? 'partial' : 'unavailable',
    completed,
    source: 'grid',
  }

  const { data: existingDraft, error: lookupError } = await supabaseClient
    .from('game_drafts')
    .select('id')
    .eq('scrim_game_id', gameId)
    .eq('draft_mode', 'grid')
    .limit(1)
    .maybeSingle()

  if (lookupError) throw lookupError

  const draftRecord = {
    our_team_side: ourTeamSide,
    draft_data: normalizedDraft,
    session_id: seriesId,
    completed_at: completed ? new Date().toISOString() : null,
  }

  const operation = existingDraft
    ? supabaseClient.from('game_drafts').update(draftRecord).eq('id', existingDraft.id)
    : supabaseClient.from('game_drafts').insert({
        scrim_game_id: gameId,
        draft_mode: 'grid',
        ...draftRecord,
      })

  const { error } = await operation
  if (error) throw error
}

async function createParticipantsForGame(supabaseClient: any, gameId: string, tenantId: string, participants: any[], ourTeamSide: 'blue' | 'red') {
  // Clear existing participants
  await supabaseClient
    .from('scrim_participants')
    .delete()
    .eq('scrim_game_id', gameId)

  const participantsToCreate = participants.map((participant: any) => ({
    scrim_game_id: gameId,
    tenant_id: tenantId,
    summoner_name: participant.riotIdGameName || participant.summonerName || 'Unknown',
    champion_name: participant.championName,
    role: getPlayerRole(participant.teamPosition || participant.individualPosition),
    is_our_team: participant.teamId === (ourTeamSide === 'blue' ? 100 : 200),
    kills: participant.kills || 0,
    deaths: participant.deaths || 0,
    assists: participant.assists || 0,
    cs: (participant.totalMinionsKilled || 0) + (participant.neutralMinionsKilled || 0),
    gold: participant.goldEarned || 0,
    damage_dealt: participant.totalDamageDealtToChampions || 0,
    damage_taken: participant.totalDamageTaken || 0,
    vision_score: participant.visionScore || 0,
    level: participant.champLevel || 1,
    items: participant.item0 ? [
      participant.item0, participant.item1, participant.item2,
      participant.item3, participant.item4, participant.item5, participant.item6
    ].flatMap((id, slot) => id && id !== 0 ? [{ id, name: `Item ${id}`, slot }] : []) : [],
    runes: {
      primary_tree: participant.perks?.styles?.[0]?.style || '',
      secondary_tree: participant.perks?.styles?.[1]?.style || '',
      runes: participant.perks?.styles?.flatMap((style: any) => 
        style.selections?.map((sel: any) => sel.perk) || []
      ) || [],
      stat_mods: participant.perks?.statPerks ? [
        participant.perks.statPerks.defense,
        participant.perks.statPerks.flex,
        participant.perks.statPerks.offense
      ] : []
    },
    summoner_spells: [
      { id: participant.summoner1Id, name: '', slot: 1 },
      { id: participant.summoner2Id, name: '', slot: 2 }
    ].filter(spell => spell.id && spell.id !== 0),
    is_bot: participant.botPlayer === true,
    advanced_stats: {
      wards_placed: participant.wardsPlaced,
      wards_killed: participant.wardsKilled,
      control_wards_purchased: participant.visionWardsBoughtInGame,
      damage_to_objectives: participant.damageDealtToObjectives,
      damage_to_turrets: participant.damageDealtToTurrets,
      healing: participant.totalHeal,
      healing_to_teammates: participant.totalHealsOnTeammates,
      shielding_to_teammates: participant.totalDamageShieldedOnTeammates,
      damage_mitigated: participant.damageSelfMitigated,
      crowd_control_seconds: participant.timeCCingOthers,
      time_dead_seconds: participant.totalTimeSpentDead,
      neutral_cs: participant.neutralMinionsKilled,
      ally_jungle_cs: participant.neutralMinionsKilledYourJungle,
      enemy_jungle_cs: participant.neutralMinionsKilledEnemyJungle,
      largest_multi_kill: participant.largestMultiKill,
      largest_killing_spree: participant.largestKillingSpree,
    }
  }))

  if (participantsToCreate.length > 0) {
    const { error } = await supabaseClient
      .from('scrim_participants')
      .insert(participantsToCreate)

    if (error) {
      console.error('❌ Error creating participants:', error)
      throw error
    }
  }
}

function getPlayerRole(position: string): 'top' | 'jungle' | 'mid' | 'adc' | 'support' {
  if (!position) return 'mid'
  const pos = position.toLowerCase()
  if (pos.includes('top')) return 'top'
  if (pos.includes('jungle')) return 'jungle'
  if (pos.includes('middle') || pos.includes('mid')) return 'mid'
  if (pos.includes('bottom') || pos.includes('bot')) return 'adc'
  if (pos.includes('utility') || pos.includes('support')) return 'support'
  return 'mid'
}
