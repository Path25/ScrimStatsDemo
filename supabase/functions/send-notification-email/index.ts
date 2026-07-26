Deno.serve(() => new Response(JSON.stringify({ error: "retired", message: "Use the service-controlled notification dispatcher." }), {
  status: 410,
  headers: { "content-type": "application/json", "cache-control": "no-store" },
}));
