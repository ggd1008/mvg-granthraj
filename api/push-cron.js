/* MVG Vani daily sadhana reminder, run by Vercel Cron (see vercel.json).
   Sends one short reminder to every stored subscription. Removes subscriptions the browser no longer accepts.
   Needs CRON_SECRET, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT and the Blob store token. */
const webpush = require('web-push');
const { list, get, del } = require('@vercel/blob');

module.exports = async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== 'Bearer ' + secret) return res.status(401).json({ error: 'auth' });
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'https://app.mvgvani.org', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  const payload = JSON.stringify({
    title: 'MVG Vani · Sadhana',
    body: 'Hare Krishna! Aaj ka sadhana check karein: japa, Bhagavatam padhna, seva. Please mark today’s sadhana.',
    url: './'
  });
  let cursor, total = 0, sent = 0, gone = 0, failed = 0;
  try {
    do {
      const page = await list({ prefix: 'subs/', cursor, limit: 500 });
      for (const bl of page.blobs) {
        total++;
        const r = await get(bl.pathname, { access: 'private' });
        if (!r || r.statusCode !== 200) { failed++; continue; }
        const sub = JSON.parse(await new Response(r.stream).text());
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload, { TTL: 3600 });
          sent++;
        } catch (e) {
          if (e.statusCode === 404 || e.statusCode === 410) { await del(bl.pathname); gone++; }
          else { failed++; console.log('push ' + JSON.stringify({ status: e.statusCode })); }
        }
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
  } catch (e) {
    console.log('push-cron ' + JSON.stringify({ error: String(e && e.message || e).slice(0, 200) }));
    return res.status(500).json({ error: 'run failed', total, sent, gone, failed });
  }
  console.log('push-cron ' + JSON.stringify({ total, sent, gone, failed }));
  return res.status(200).json({ total, sent, gone, failed });
};
