import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from './cors.ts';

// Kept as an explicit tombstone so an older deployed function can be replaced
// safely. Browser-created bearer tokens are no longer a supported ingest path.
serve(() => new Response(JSON.stringify({
  error: 'This ingest endpoint has been retired. Use the paired desktop collector.',
  code: 'collector_required',
}), { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }));
