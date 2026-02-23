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
    const { playerId, apiKey } = await req.json()
    console.log('=== SOLOQ SYNC STARTED ===')
    console.log('Player ID:', playerId)
    console.log('API Key provided:', !!apiKey)

    if (!playerId || !apiKey) {
      console.log('ERROR: Missing required parameters')
      return new Response(
        JSON.stringify({ success: false, error: 'Player ID and API key are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get player data
    console.log('Fetching player data from database...')
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single()

    if (playerError || !player) {
      console.log('ERROR: Player not found:', playerError)
      return new Response(
        JSON.stringify({ success: false, error: 'Player not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Player data retrieved:', {
      summoner_name: player.summoner_name,
      riot_tag_line: player.riot_tag_line,
      region: player.region,
      current_rank: player.rank,
      current_lp: player.lp,
      puuid: player.puuid
    })

    if (!player.summoner_name || !player.riot_tag_line || !player.region) {
      console.log('ERROR: Player missing required Riot information')
      return new Response(
        JSON.stringify({ success: false, error: 'Player missing required Riot information' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Map region codes to routing values for Riot ID API
    const getRoutingValue = (region: string) => {
      const regionMap: { [key: string]: string } = {
        'na1': 'americas',
        'br1': 'americas',
        'la1': 'americas',
        'la2': 'americas',
        'euw1': 'europe',
        'eune1': 'europe',
        'tr1': 'europe',
        'ru': 'europe',
        'kr': 'asia',
        'jp1': 'asia',
        'oc1': 'sea'
      }
      return regionMap[region] || 'americas'
    }

    const routingValue = getRoutingValue(player.region)
    const cleanTagLine = player.riot_tag_line.replace('#', '')
    console.log('Routing value:', routingValue, 'Clean tag line:', cleanTagLine)

    // Get PUUID if we don't have it
    let puuid = player.puuid
    if (!puuid) {
      console.log('PUUID not found, fetching from Riot ID API...')
      const riotIdUrl = `https://${routingValue}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(player.summoner_name)}/${encodeURIComponent(cleanTagLine)}`
      console.log('Riot ID API URL:', riotIdUrl)
      
      const riotIdResponse = await fetch(riotIdUrl, {
        headers: { 'X-Riot-Token': apiKey }
      })

      console.log('Riot ID API Response Status:', riotIdResponse.status)
      
      if (!riotIdResponse.ok) {
        const errorText = await riotIdResponse.text()
        console.log('ERROR: Riot ID API failed:', errorText)
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to get player account data' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const accountData = await riotIdResponse.json()
      console.log('Riot ID API Response:', JSON.stringify(accountData, null, 2))
      puuid = accountData.puuid
      console.log('PUUID retrieved:', puuid)
    } else {
      console.log('Using existing PUUID:', puuid)
    }

    // Get summoner data
    console.log('Fetching summoner data...')
    const summonerUrl = `https://${player.region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`
    console.log('Summoner API URL:', summonerUrl)
    
    const summonerResponse = await fetch(summonerUrl, {
      headers: { 'X-Riot-Token': apiKey }
    })

    console.log('Summoner API Response Status:', summonerResponse.status)

    if (!summonerResponse.ok) {
      const errorText = await summonerResponse.text()
      console.log('ERROR: Summoner API failed:', errorText)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to get summoner data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const summonerData = await summonerResponse.json()
    console.log('Summoner API Response:', JSON.stringify(summonerData, null, 2))

    // Get ranked data using PUUID instead of summoner ID
    console.log('Fetching ranked data using PUUID...')
    const rankedUrl = `https://${player.region}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`
    console.log('Ranked API URL (PUUID-based):', rankedUrl)
    
    const rankedResponse = await fetch(rankedUrl, {
      headers: { 'X-Riot-Token': apiKey }
    })

    console.log('Ranked API Response Status:', rankedResponse.status)
    
    let rankedData = []
    if (rankedResponse.ok) {
      rankedData = await rankedResponse.json()
      console.log('Ranked API Response:', JSON.stringify(rankedData, null, 2))
    } else {
      const errorText = await rankedResponse.text()
      console.log('WARNING: Ranked API failed:', errorText)
    }

    // Find Solo/Duo queue data
    console.log('Processing ranked data...')
    const soloQueueData = rankedData.find((entry: any) => entry.queueType === 'RANKED_SOLO_5x5')
    console.log('Solo Queue Data Found:', !!soloQueueData)
    
    if (soloQueueData) {
      console.log('Solo Queue Entry:', JSON.stringify(soloQueueData, null, 2))
    } else {
      console.log('Available queue types:', rankedData.map((entry: any) => entry.queueType))
    }
    
    let rank = 'Unranked'
    let lp = 0
    let wins = 0
    let losses = 0
    let tier = 'UNRANKED'
    let rankDivision = 'I'
    
    if (soloQueueData) {
      tier = soloQueueData.tier
      rankDivision = soloQueueData.rank
      
      console.log('Processing rank data:', { tier, rankDivision, lp: soloQueueData.leaguePoints })
      
      // Handle different tier formatting
      if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(tier)) {
        rank = `${tier} ${soloQueueData.leaguePoints} LP`
      } else {
        rank = `${tier} ${rankDivision}`
      }
      
      lp = soloQueueData.leaguePoints
      wins = soloQueueData.wins
      losses = soloQueueData.losses
      
      console.log('Final rank processing:', { rank, lp, wins, losses })
    } else {
      console.log('No solo queue data found - player will remain unranked')
    }

    // Get match history (last 20 ranked games)
    console.log('Fetching match history...')
    const matchHistoryUrl = `https://${routingValue}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&count=20`
    console.log('Match History URL:', matchHistoryUrl)
    
    const matchHistoryResponse = await fetch(matchHistoryUrl, {
      headers: { 'X-Riot-Token': apiKey }
    })

    console.log('Match History Response Status:', matchHistoryResponse.status)

    let matchHistory = []
    let championStats: { [key: string]: { games: number, wins: number } } = {}
    
    if (matchHistoryResponse.ok) {
      const matchIds = await matchHistoryResponse.json()
      console.log('Match IDs retrieved:', matchIds.length)
      
      // First, clear existing matches for this player to avoid duplicates
      await supabase
        .from('player_soloq_matches')
        .delete()
        .eq('player_id', playerId)
      
      // Clear existing stats for this player - use player_id if available, otherwise match_id list
      const { error: clearStatsError } = await supabase
        .from('player_soloq_stats')
        .delete()
        .in('match_id', matchIds.slice(0, 15))
      
      if (clearStatsError) {
        console.log('ERROR: Failed to clear existing stats:', clearStatsError)
        throw new Error('Failed to clear existing stats')
      }
      
      // Process matches (limit to 15 for performance)
      console.log('Processing matches...')
      for (const matchId of matchIds.slice(0, 15)) {
        try {
          const matchUrl = `https://${routingValue}.api.riotgames.com/lol/match/v5/matches/${matchId}`
          const matchResponse = await fetch(matchUrl, {
            headers: { 'X-Riot-Token': apiKey }
          })
          
          if (matchResponse.ok) {
            const matchData = await matchResponse.json()
            const participant = matchData.info.participants.find((p: any) => p.puuid === puuid)
            
            if (participant) {
              const champion = participant.championName
              
              // Update champion stats
              if (!championStats[champion]) {
                championStats[champion] = { games: 0, wins: 0 }
              }
              championStats[champion].games++
              if (participant.win) {
                championStats[champion].wins++
              }
              
              // Store match data with simple match_id
              const matchRecord = {
                match_id: matchId, // Simple Riot match ID
                puuid,
                player_id: playerId,
                tenant_id: player.tenant_id,
                champion_id: participant.championId,
                champion_name: champion,
                win: participant.win,
                game_duration: matchData.info.gameDuration,
                game_creation: new Date(matchData.info.gameCreation).toISOString(),
                queue_id: matchData.info.queueId,
                game_mode: matchData.info.gameMode,
                game_type: matchData.info.gameType,
                role: participant.teamPosition || participant.individualPosition,
                lane: participant.lane
              }
              
              // Store match
              const { error: matchError } = await supabase
                .from('player_soloq_matches')
                .insert(matchRecord)
              
              if (matchError) {
                console.log('ERROR: Failed to store match:', matchError)
                throw new Error('Failed to store match data')
              } else {
                matchHistory.push(matchRecord)
              }
              
              // Store match stats with simple match_id (same as in matches table)
              const statsRecord = {
                match_id: matchId, // Simple Riot match ID - must match the matches table
                kills: participant.kills,
                deaths: participant.deaths,
                assists: participant.assists,
                champion_level: participant.champLevel,
                total_damage_dealt: participant.totalDamageDealt,
                total_damage_dealt_to_champions: participant.totalDamageDealtToChampions,
                total_damage_taken: participant.totalDamageTaken,
                total_heal: participant.totalHeal,
                total_minions_killed: participant.totalMinionsKilled,
                neutral_minions_killed: participant.neutralMinionsKilled,
                vision_score: participant.visionScore,
                gold_earned: participant.goldEarned,
                items: [
                  participant.item0, participant.item1, participant.item2,
                  participant.item3, participant.item4, participant.item5, participant.item6
                ].filter(item => item > 0),
                summoner_spells: [participant.summoner1Id, participant.summoner2Id],
                runes: {
                  primaryStyle: participant.perks?.styles?.[0]?.style,
                  subStyle: participant.perks?.styles?.[1]?.style,
                  primaryPerks: participant.perks?.styles?.[0]?.selections?.map((s: any) => s.perk) || [],
                  subPerks: participant.perks?.styles?.[1]?.selections?.map((s: any) => s.perk) || []
                },
                first_blood_kill: participant.firstBloodKill,
                first_tower_kill: participant.firstTowerKill,
                team_objectives: participant.challenges || {}
              }
              
              // Try inserting stats with detailed error logging
              const { data: statsData, error: statsError } = await supabase
                .from('player_soloq_stats')
                .insert(statsRecord)
                .select()
              
              if (statsError) {
                console.log('ERROR: Failed to insert stats, trying simplified version:', statsError)
                // Try a simpler insertion with only required fields
                const simpleStatsRecord = {
                  match_id: matchId,
                  kills: participant.kills,
                  deaths: participant.deaths,
                  assists: participant.assists,
                  champion_level: participant.champLevel || 1,
                  total_damage_dealt: participant.totalDamageDealt || 0,
                  total_damage_dealt_to_champions: participant.totalDamageDealtToChampions || 0,
                  total_damage_taken: participant.totalDamageTaken || 0,
                  total_heal: participant.totalHeal || 0,
                  total_minions_killed: participant.totalMinionsKilled || 0,
                  neutral_minions_killed: participant.neutralMinionsKilled || 0,
                  vision_score: participant.visionScore || 0,
                  gold_earned: participant.goldEarned || 0
                }
                
                const { error: simpleStatsError } = await supabase
                  .from('player_soloq_stats')
                  .insert(simpleStatsRecord)
                
                if (simpleStatsError) {
                  console.log('ERROR: Failed to store simplified stats:', simpleStatsError)
                  throw new Error('Failed to store match statistics')
                }
              }
            }
          }
        } catch (matchError) {
          console.log('WARNING: Match processing failed:', matchError)
          // Continue processing other matches if one fails
          continue;
        }
      }
    } else {
      const errorText = await matchHistoryResponse.text()
      console.log('WARNING: Match history API failed:', errorText)
    }

    // Calculate champion pool and win rates
    const championPool = Object.keys(championStats).length
    const totalGames = wins + losses
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0
    
    // Get most played champions
    const topChampions = Object.entries(championStats)
      .sort(([,a], [,b]) => b.games - a.games)
      .slice(0, 5)
      .map(([champion, stats]) => ({
        name: champion,
        games: stats.games,
        winRate: Math.round((stats.wins / stats.games) * 100)
      }))

    console.log('Final stats calculated:', {
      championPool,
      totalGames,
      winRate,
      topChampions
    })

    // Update player data
    console.log('Updating player data in database...')
    const updateData = {
      puuid,
      summoner_id: summonerData.id,
      rank,
      lp,
      last_soloq_sync: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      main_champions: topChampions
    }
    
    console.log('Player update data:', JSON.stringify(updateData, null, 2))
    
    const { error: updateError } = await supabase
      .from('players')
      .update(updateData)
      .eq('id', playerId)

    if (updateError) {
      console.log('ERROR: Failed to update player:', updateError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update player data' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Store daily rank history (only if we have ranked data and it's a new day)
    if (soloQueueData) {
      console.log('Storing rank history...')
      const today = new Date().toISOString().split('T')[0] // Get YYYY-MM-DD format
      
      // Check if we already have an entry for today
      const { data: existingEntry } = await supabase
        .from('player_rank_history')
        .select('id')
        .eq('player_id', playerId)
        .gte('recorded_at', `${today}T00:00:00.000Z`)
        .lt('recorded_at', `${today}T23:59:59.999Z`)
        .single()
      
      if (!existingEntry) {
        // Only insert if we don't have an entry for today
        const { error: rankHistoryError } = await supabase
          .from('player_rank_history')
          .insert({
            player_id: playerId,
            tenant_id: player.tenant_id,
            tier: tier,
            rank_division: rankDivision,
            league_points: lp,
            wins: wins,
            losses: losses,
            summoner_id: summonerData.id,
            recorded_at: new Date().toISOString()
          })
        
        if (rankHistoryError) {
          console.log('WARNING: Failed to store rank history:', rankHistoryError)
        } else {
          console.log('Rank history stored successfully')
        }
      } else {
        console.log('Rank history already exists for today')
      }
    }

    const finalResult = {
      success: true,
      summonerName: `${player.summoner_name}#${cleanTagLine}`,
      rank,
      lp,
      level: summonerData.summonerLevel,
      winRate,
      championPool,
      totalGames,
      wins,
      losses,
      topChampions,
      matchesProcessed: matchHistory.length
    }
    
    console.log('=== SOLOQ SYNC COMPLETED SUCCESSFULLY ===')
    console.log('Final result:', JSON.stringify(finalResult, null, 2))

    return new Response(
      JSON.stringify(finalResult),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.log('=== SOLOQ SYNC FAILED ===')
    console.log('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
