/* MVG Vani: AI replies through a server function, so the API key never reaches a phone.
   Experimental seva project, respect privacy terms, no illegal.

   Set in Vercel > Project > Settings > Environment Variables:
     OPENROUTER_API_KEY   (required)  the key from openrouter.ai, or any OpenAI-style service
     AI_MODEL             (optional)  the model tried first
     AI_FALLBACK_MODEL    (optional)  one or more models tried next, separated by commas
     AI_BASE_URL          (optional)  default https://openrouter.ai/api/v1

   The sevak instructions live here, not in the app, so this address cannot be used as a general chatbot.
   The server log gets one line per attempt (model, status, the service's own error text). Questions are never logged.
   Self-test: open /api/chat?check=1 in a browser to see whether the key and the models answer. */

const BASE = (process.env.AI_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/+$/, '');
/* tried on 9 Oct 2026 with the self-test: the first two answered in about a second and kept to the passages; the Gemma free models were often refused as busy */
const DEFAULT_MODELS = ['nvidia/nemotron-3-super-120b-a12b:free', 'poolside/laguna-xs-2.1:free', 'google/gemma-4-26b-a4b-it:free'];
const MODELS = (() => {
  const list = [process.env.AI_MODEL || DEFAULT_MODELS[0]]
    .concat(process.env.AI_FALLBACK_MODEL ? process.env.AI_FALLBACK_MODEL.split(',') : DEFAULT_MODELS.slice(1))
    .map(s => String(s).trim()).filter(Boolean);
  return list.filter((m, i) => list.indexOf(m) === i).slice(0, 4);
})();

const RULES = [
  'You are "Granthraj sevak", a humble servant-assistant for ISKCON devotees who study the recorded lectures of His Holiness Mahavishnu Goswami Maharaj.',
  'Rules, all of them strict:',
  '1. You never speak as Maharaj and never write "I" as him.',
  '2. Use only the lecture passages given in the user message. Quote Maharaj word for word from those passages and put the lecture title in square brackets after each quotation.',
  '3. Never add a verse, a Sanskrit line, a saying or a story that is not in the passages. If the passages do not answer the question, say so in one sentence.',
  '4. Srila Prabhupada and Maharaj are two different persons. The speaker of these lectures is Maharaj; call him "Maharaj". Srila Prabhupada is his spiritual master; call him "Srila Prabhupada". Never join the two names: never write "Srila Prabhupada Maharaj" or "Prabhupada Maharaj". When Maharaj quotes or speaks about Srila Prabhupada, say that plainly, and name Srila Prabhupada first when both are named.',
  '5. No greeting, no salutation, no blessing and no closing line. Do not address the reader by any name or title. The app adds the greeting itself. Begin directly with the answer.',
  '6. Plain text only. No markdown, no asterisks, no hash signs, no bullet symbols.',
  '7. Write in simple, practical English.'
].join('\n');

const TASKS = {
  chat: 'Answer the question in at most 150 words.',
  notes: 'Prepare study notes of at most 350 words, under three or four short plain headings, each on its own line.',
  article: 'Write a short article of at most 400 words with a plain title line and short paragraphs.',
  list: 'Make a numbered list of at most eight practical points, one or two sentences each.'
};

const clean = (s, n) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);

/* small in-memory limiter: slows down misuse, resets when the function restarts */
const HITS = new Map();
function limited(ip) {
  const now = Date.now(), list = (HITS.get(ip) || []).filter(t => now - t < 864e5);
  const lastMinute = list.filter(t => now - t < 6e4).length;
  if (lastMinute >= 12 || list.length >= 200) { HITS.set(ip, list); return true; }
  list.push(now); HITS.set(ip, list);
  if (HITS.size > 5000) HITS.clear();
  return false;
}

/* A reply is thrown away when it is empty, is only a safety label such as "User Safety: safe",
   or joins the two names ("Prabhupada Maharaj") although the passages do not. */
const MIXED = /prabhupada?\s+maharaj/i;
function useless(text, source) {
  const t = text.trim();
  if (t.length < 30 || /^(user\s+safety|agent\s+safety|safety)\s*:/i.test(t) || /^(safe|unsafe)\b/i.test(t)) return true;
  return MIXED.test(t) && !MIXED.test(source || '');
}
/* plain text, and no greeting of its own: the app greets once, by itself */
function tidy(text) {
  let s = text.replace(/\r/g, '').replace(/\*\*|__|`/g, '').replace(/^\s{0,3}#{1,6}\s*/gm, '').replace(/^\s*[*•]\s+/gm, '- ')
    .replace(/\n{3,}/g, '\n\n').trim();
  s = s.replace(/^(hare krishna\s*[,.!]+\s*|hare krishna\s+(?=(dear|prabhuji|mataji|prabhu)\b))?((dear\s+devotee|prabhuji|mataji|prabhu)\s*[,.!:]+\s*)?/i, '');
  return (s.charAt(0).toUpperCase() + s.slice(1)).slice(0, 6000);
}

async function ask(model, messages, maxTokens, ms, reasoning) {
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), ms), t0 = Date.now();
  const body = { model, messages, temperature: 0.2, max_tokens: maxTokens };
  if (reasoning) body.reasoning = reasoning;
  try {
    const r = await fetch(BASE + '/chat/completions', {
      method: 'POST', signal: ctl.signal,
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.OPENROUTER_API_KEY, 'X-Title': 'MVG Vani' },
      body: JSON.stringify(body)
    });
    const j = await r.json().catch(() => null);
    if (!r.ok || (j && j.error && !j.choices)) {
      const e = j && j.error, raw = e && e.metadata && e.metadata.raw;
      return { status: r.ok ? ((e && +e.code) || 502) : r.status, text: '', ms: Date.now() - t0, err: clean([e && (e.message || e), raw].filter(Boolean).join(' | '), 300) };
    }
    const c = j && j.choices && j.choices[0], m = c && c.message;
    const text = (m && m.content) || (c && c.text) || '';
    return { status: 200, text: typeof text === 'string' ? text : '', ms: Date.now() - t0, model: (j && j.model) || model,
      thought: !!(m && (m.reasoning || m.reasoning_content)), end: c && c.finish_reason };
  } catch (e) {
    return { status: 504, text: '', ms: Date.now() - t0, err: 'timeout or network: ' + clean(e && e.message, 120) };
  } finally { clearTimeout(timer); }
}

const note = (what, model, out) => console.log('ai ' + JSON.stringify({ what, model, status: out.status, ms: out.ms, chars: out.text.length, end: out.end, err: out.err || undefined }));

/* One model, with the adjustments some hosted models need:
   - thinking is switched off, because the answer comes straight from the passages; where a model cannot switch it off,
     it gets a larger allowance so that thinking does not use up the whole reply;
   - a model that refuses a system message gets the rules inside the user message. */
async function askModel(model, messages, maxTokens, until, what) {
  let fold = false, think = 0, out = null;
  for (let tries = 0; tries < 3; tries++) {
    const left = until - Date.now();
    if (left < 4000) break;
    const msgs = fold ? [{ role: 'user', content: messages[0].content + '\n\n' + messages[1].content }] : messages;
    out = await ask(model, msgs, think ? maxTokens * 2 + 800 : maxTokens, Math.min(22000, left - 500), think ? { effort: 'low', exclude: true } : { effort: 'none', exclude: true });
    note(what + (fold ? ' +rules in user message' : '') + (think ? ' +thinking allowed' : ''), model, out);
    if (out.status === 400 && !fold && /system|developer instruction/i.test(out.err || '')) { fold = true; continue; }
    if (out.status === 400 && !think && /reason|effort|thinking/i.test(out.err || '')) { think = 1; continue; }
    if (out.status === 200 && !out.text.trim() && !think) { think = 1; continue; }   // thinking used up the whole reply
    break;
  }
  return out || { status: 504, text: '', err: 'no time left' };
}

/* the models in order, until one gives a usable reply */
async function answer(messages, maxTokens, source, what, models) {
  const until = Date.now() + 54000;
  let limit = false, last = null;
  for (const model of models || MODELS) {
    if (until - Date.now() < 4000) break;
    const out = await askModel(model, messages, maxTokens, until, what);
    last = out;
    if (out.status === 429) limit = true;
    if (out.status === 401 || out.status === 402) break;                 // wrong key, or no credit: another model will not help
    if (out.status === 200 && !useless(out.text, source)) return { ok: true, text: tidy(out.text), model: out.model || model, ms: out.ms };
  }
  return { ok: false, limit, status: last && last.status, err: last && (last.err || (last.status === 200 ? 'reply not usable: ' + clean(last.text, 80) : '')) };
}

function build(task, q, prompt, kb) {
  const user = [
    TASKS[task] + (prompt ? ' Purpose: ' + prompt : ''),
    q ? 'Question from the devotee: ' + q : '',
    'Lecture passages:',
    kb.map((x, k) => '[' + (k + 1) + '] ' + x.title + ' (' + [x.verse, x.location].filter(Boolean).join(', ') + '): ' + x.passage).join('\n\n')
  ].filter(Boolean).join('\n\n');
  return { messages: [{ role: 'system', content: RULES }, { role: 'user', content: user }], source: kb.map(x => x.passage).join(' ') };
}

/* GET /api/chat?check=1 : a self-test with one fixed question and two fixed lecture passages.
   It shows, for each model, the status, the time taken, the reply and the service's own error text.
   ?check=1&m=<some model id ending in :free> tries one other free model. Each result is kept for ten minutes. */
const SAMPLE = [
  { title: 'Convince the Mind about our Precarious Condition', verse: 'SB 5.11.4', location: 'Wellington', passage: 'And as soon as we have this complete clear idea about our material activities and the spiritual status, then our mind doesn’t go here and there. Mind wants the clear understanding. That is the nature of the mind. Otherwise, it will flicker. And these scriptures or these discourses, or the temple communities or the temple puja worship, everything is to completely put our mind on a proper line. And then once the mind is sorted out, you don’t have to worry about anything else.' },
  { title: 'Bhagavatam takes us directly to Goloka - Part 3', verse: 'SB 2.3.17', location: 'Rajkot', passage: 'Prabhupada has shown us that any mind will be controlled by service. You know Prabhupada also was controlling. He developed the whole society without endeavor to control the minds. Just giving this process. Our process is so very sublime that everything becomes good, provided they follow some process. So, our younger ones particularly should be trained to do these things.' }
];
const CHECKS = new Map();
async function selfTest(model) {
  const hit = CHECKS.get(model);
  if (hit && Date.now() - hit.at < 6e5) return Object.assign({ cached: true }, hit);
  const b = build('chat', 'How to control the mind?', '', SAMPLE);
  const t0 = Date.now(), out = await answer(b.messages, 700, b.source, 'check', [model]);
  const r = { at: Date.now(), model, ok: out.ok, seconds: +((Date.now() - t0) / 1000).toFixed(1), reply: out.ok ? out.text.slice(0, 1200) : undefined, status: out.ok ? 200 : out.status, error: out.ok ? undefined : out.err };
  CHECKS.set(model, r);
  if (CHECKS.size > 30) CHECKS.clear();
  return r;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET' && /[?&]check=1\b/.test(req.url || '')) {
    if (!process.env.OPENROUTER_API_KEY) return res.status(200).json({ keySet: false });
    const m = /[?&]m=([^&]+)/.exec(req.url || ''), one = m ? decodeURIComponent(m[1]) : '';
    if (one && !/^[a-z0-9.-]+\/[a-z0-9.-]+:free$/.test(one)) return res.status(400).json({ error: 'only a free model id can be tried here' });
    const results = await Promise.all((one ? [one] : MODELS).map(selfTest));
    return res.status(200).json({ keySet: true, base: BASE, order: MODELS, results });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!process.env.OPENROUTER_API_KEY) return res.status(200).json({ off: true });               // no key yet: the app quietly uses the lectures

  // only this site's own pages may call the function
  let origin = '';
  try { origin = new URL(req.headers.origin || '').host; } catch (e) {}
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  if (!origin || (origin !== host && origin !== req.headers.host)) {
    console.log('ai ' + JSON.stringify({ what: 'refused origin', origin, host }));
    return res.status(403).json({ error: 'forbidden' });
  }

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return res.status(200).json({ busy: true, reason: 'slow down' });

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || typeof b !== 'object') return res.status(400).json({ error: 'bad request' });

  const task = TASKS[b.task] ? b.task : 'chat';
  const q = clean(b.q, 600), prompt = clean(b.prompt, 400);
  const kb = (Array.isArray(b.kb) ? b.kb : []).slice(0, 16).map(x => ({
    title: clean(x && x.title, 160), verse: clean(x && x.verse, 40), location: clean(x && x.location, 60), passage: clean(x && x.passage, 900)
  })).filter(x => x.title && x.passage);
  if (!q && !prompt) return res.status(400).json({ error: 'empty question' });
  if (!kb.length) return res.status(422).json({ error: 'no passages' });   // nothing to answer from: the app shows its own message

  const m = build(task, q, prompt, kb);
  const out = await answer(m.messages, task === 'chat' ? 700 : 1400, m.source, task);
  // daily limit reached, or no usable reply: the app shows the lecture passages with a short note
  if (!out.ok) return res.status(200).json({ busy: true, reason: out.limit ? 'limit' : 'no reply' });
  return res.status(200).json({ answer: out.text, model: out.model });
};
