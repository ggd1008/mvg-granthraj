/* MVG Vani festival updates: opt-in and stop.
   Stores the mobile number, language and time of consent in the private Blob store (not in the browser).
   Only the admin (you) can read the store, through the Vercel dashboard.
   Experimental seva project, respect privacy terms, no illegal. */
const crypto = require('crypto');
const { put, del } = require('@vercel/blob');

const keyFor = mobile => 'optin/' + crypto.createHash('sha256').update(mobile).digest('hex').slice(0, 48) + '.json';

function readBody(req) {
  return new Promise(resolve => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    let d = '';
    req.on('data', c => { d += c; if (d.length > 2000) req.destroy(); });
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
  if (!sameOrigin(req)) return res.status(403).json({ error: 'origin' });
  const b = await readBody(req);
  const mobile = b && typeof b.mobile === 'string' ? b.mobile.replace(/\D/g, '') : '';
  if (!/^[6-9]\d{9}$/.test(mobile)) return res.status(400).json({ error: 'mobile' });
  if (req.method === 'POST') {
    if (!b || b.consent !== true) return res.status(400).json({ error: 'consent' });
    const lang = ['en', 'hi', 'gu'].includes(b.lang) ? b.lang : 'en';
    await put(keyFor(mobile), JSON.stringify({ mobile, lang, consent: 'festival-updates-v1', at: new Date().toISOString() }),
      { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });
    return res.status(200).json({ ok: true });
  }
  if (req.method === 'DELETE') {
    await del(keyFor(mobile));
    return res.status(200).json({ ok: true });
  }
  return res.status(405).json({ error: 'method' });
};
