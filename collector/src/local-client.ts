import https from 'node:https';

const BASE = 'https://127.0.0.1:2999';

/** The League client uses a self-signed certificate. This exception is pinned
 * to the loopback Game Client API and is never used for remote requests. */
export function leagueClientRequest(path: '/liveclientdata/allgamedata' | '/liveclientdata/eventdata'): Promise<unknown> {
  if (!path.startsWith('/liveclientdata/')) throw new Error('Only League Game Client API paths are allowed.');
  return new Promise((resolve, reject) => {
    const request = https.request(`${BASE}${path}`, { method: 'GET', rejectUnauthorized: false, timeout: 4_000 }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => response.statusCode === 200 ? (() => { try { resolve(JSON.parse(body)); } catch { reject(new Error('League client returned invalid JSON.')); } })() : reject(new Error(`League client returned ${response.statusCode}.`)));
    });
    request.on('timeout', () => request.destroy(new Error('League client timed out.')));
    request.on('error', reject);
    request.end();
  });
}
