/* MVG Vani sadhana reminder: subscribe, unsubscribe, and give the public key.
   Stores only the browser's push subscription (endpoint and keys). No name, no mobile number.
   Experimental seva project, respect privacy terms, no illegal. */
const crypto = require('crypto');
const { put, del } = require('@vercel/blob');

const keyFor = endpoint => 'subs/' + crypto.createHash('sha256').update(endpoint).digest('hex').slice(0, 48) + '.json';

function readBody(req) {
  return new Promise(resolve => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    let d = '';
    req.on('data', c => { d += c; if (d.length > 4000) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch (e) { resolve(null); } });
    req.on('error', () => resolve(null));
  });
}

function sameOrigin(req) {
  const o = req.headers.origin;
  if (!o) return true;
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  try { return new URL(o).host === host; } catch (e) { return false; }
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.status(200).json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
  if (!sameOrigin(req)) return res.status(403).json({ error: 'origin' });
  const b = await readBody(req);
  if (req.method === 'POST') {
    const s = b && b.subscription;
    if (!s || typeof s.endpoint !== 'string' || !/^https:\/\//.test(s.endpoint) || !s.keys || !s.keys.p256dh || !s.keys.auth)
      return res.status(400).json({ error: 'bad subscription' });
    await put(keyFor(s.endpoint), JSON.stringify({ endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh, auth: s.keys.auth }, at: new Date().toISOString() }),
      { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });
    return res.status(200).json({ ok: true });
  }
  if (req.method === 'DELETE') {
    if (!b || typeof b.endpoint !== 'string') return res.status(400).json({ error: 'bad request' });
    await del(keyFor(b.endpoint));
    return res.status(200).json({ ok: true });
  }
  return res.status(405).json({ error: 'method' });
};
