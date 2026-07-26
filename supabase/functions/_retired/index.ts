import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

Deno.serve(() => new Response(JSON.stringify({
  error: "This endpoint has been retired from the managed-pilot release.",
  code: "endpoint_retired",
}), { status: 410, headers }));
