export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/schedule' || url.pathname === '/attendee/api/schedule') {
      try {
        const upstream = await fetch(
          'https://events.canonical.com/export/event/157.json?detail=contributions',
          {
            headers: { Accept: 'application/json' },
            cf: { cacheTtl: 300, cacheEverything: true },
          }
        );
        if (upstream.ok) {
          const body = await upstream.text();
          return new Response(body, {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'public, max-age=300, s-maxage=300',
            },
          });
        }
      } catch {
        // Fallback to static assets
      }
    }
    return env.ASSETS.fetch(request);
  },
};
