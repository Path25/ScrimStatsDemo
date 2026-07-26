const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

Deno.serve((request) => {
  if (request.method === 'OPTIONS') return new Response(null, { headers });
  return new Response(JSON.stringify({
    error: 'This legacy endpoint has been retired. Use the managed Solo Queue tracker.',
  }), { status: 410, headers });
});
