
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { apiKey, summonerName, tagLine, region } = await req.json()

    if (!apiKey || !summonerName || !tagLine) {
      return new Response(
        JSON.stringify({ success: false, error: 'API key, summoner name, and tag line are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Clean up the tagLine (remove # if present)
    const cleanTagLine = tagLine.replace('#', '')
    
    console.log(`Testing Riot API connection for ${summonerName}#${cleanTagLine} in region ${region}`)

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

    const routingValue = getRoutingValue(region)

    // First, get the PUUID using Riot ID API with correct routing
    const riotIdUrl = `https://${routingValue}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(summonerName)}/${encodeURIComponent(cleanTagLine)}`
    
    console.log(`Calling Riot ID API: ${riotIdUrl}`)
    
    const riotIdResponse = await fetch(riotIdUrl, {
      headers: {
        'X-Riot-Token': apiKey
      }
    })

    if (!riotIdResponse.ok) {
      const errorText = await riotIdResponse.text()
      console.error('Riot ID API error:', riotIdResponse.status, errorText)
      
      if (riotIdResponse.status === 401) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid API key' }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      } else if (riotIdResponse.status === 404) {
        return new Response(
          JSON.stringify({ success: false, error: `Summoner ${summonerName}#${cleanTagLine} not found` }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      } else if (riotIdResponse.status === 403) {
        return new Response(
          JSON.stringify({ success: false, error: 'API key does not have permission to access this endpoint' }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      } else {
        return new Response(
          JSON.stringify({ success: false, error: `Riot API error: ${riotIdResponse.status}` }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    const accountData = await riotIdResponse.json()
    const puuid = accountData.puuid
    
    console.log(`Successfully got PUUID: ${puuid}`)

    // Now get summoner data using the regional endpoint
    const summonerUrl = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`
    
    console.log(`Calling Summoner API: ${summonerUrl}`)
    
    const summonerResponse = await fetch(summonerUrl, {
      headers: {
        'X-Riot-Token': apiKey
      }
    })

    if (!summonerResponse.ok) {
      const errorText = await summonerResponse.text()
      console.error('Summoner API error:', summonerResponse.status, errorText)
      
      if (summonerResponse.status === 404) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Summoner data not found in region ${region}. The account may exist but not have played League of Legends in this region.` 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      } else {
        return new Response(
          JSON.stringify({ success: false, error: `Failed to get summoner data: ${summonerResponse.status}` }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    const summonerData = await summonerResponse.json()
    
    console.log(`Successfully got summoner data: Level ${summonerData.summonerLevel}`)

    // Test ranked data endpoint (optional - doesn't fail if no ranked data)
    const rankedUrl = `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerData.id}`
    
    let rankedData = []
    try {
      const rankedResponse = await fetch(rankedUrl, {
        headers: {
          'X-Riot-Token': apiKey
        }
      })

      if (rankedResponse.ok) {
        rankedData = await rankedResponse.json()
        console.log(`Successfully got ranked data: ${rankedData.length} entries`)
      } else {
        console.log(`Ranked data not available: ${rankedResponse.status}`)
      }
    } catch (error) {
      console.log('Ranked data fetch failed, but continuing with connection test')
    }

    console.log('Successfully connected to Riot API')
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        summonerName: `${summonerName}#${cleanTagLine}`,
        level: summonerData.summonerLevel,
        puuid: puuid,
        summonerId: summonerData.id,
        region: region,
        rankedData: rankedData
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error testing Riot API connection:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
