/* MVG Granthraj: AI replies through a server function, so the API key never reaches a phone.
   Experimental seva project, respect privacy terms, no illegal.

   Set in Vercel > Project > Settings > Environment Variables:
     OPENROUTER_API_KEY   (required)  the key from openrouter.ai, or any OpenAI-style service
     AI_MODEL             (optional)  default google/gemma-4-31b-it:free
     AI_FALLBACK_MODEL    (optional)  tried when the first model fails or returns a useless reply
     AI_BASE_URL          (optional)  default https://openrouter.ai/api/v1

   The sevak instructions live here, not in the app, so this address cannot be used as a general chatbot. */

const BASE = (process.env.AI_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/+$/, '');
const MODEL = process.env.AI_MODEL || 'google/gemma-4-31b-it:free';
const FALLBACK = process.env.AI_FALLBACK_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free';

const RULES = [
  'You are "Granthraj sevak", a humble servant-assistant for ISKCON devotees who study the recorded lectures of His Holiness Mahavishnu Goswami Maharaj.',
  'Rules, all of them strict:',
  '1. You never speak as Maharaj and never write "I" as him.',
  '2. Use only the lecture passages given in the user message. Quote Maharaj word for word from those passages and put the lecture title in square brackets after each quotation.',
  '3. Never add a verse, a Sanskrit line, a saying or a story that is not in the passages. If the passages do not answer the question, say so in one sentence.',
  '4. Srila Prabhupada and Maharaj are two different persons. Never join their names. The speaker of these lectures is Maharaj. When Maharaj reads or quotes Srila Prabhupada, say that plainly. Name Srila Prabhupada first when both are named.',
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
  if (lastMinute >= 8 || list.length >= 80) { HITS.set(ip, list); return true; }
  list.push(now); HITS.set(ip, list);
  if (HITS.size > 5000) HITS.clear();
  return false;
}

/* a reply that is empty, or only a safety label such as "User Safety: safe", is not an answer */
function useless(text) {
  const t = text.trim();
  return t.length < 30 || /^(user\s+safety|agent\s+safety|safety)\s*:/i.test(t) || /^(safe|unsafe)\b/i.test(t);
}
function tidy(text) {
  return text.replace(/\r/g, '').replace(/\*\*|__|`/g, '').replace(/^\s{0,3}#{1,6}\s*/gm, '').replace(/^\s*[*•]\s+/gm, '- ')
    .replace(/\n{3,}/g, '\n\n').trim().slice(0, 6000);
}

async function ask(model, messages, maxTokens, ms) {
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(BASE + '/chat/completions', {
      method: 'POST', signal: ctl.signal,
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.OPENROUTER_API_KEY, 'X-Title': 'MVG Granthraj' },
      body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: maxTokens })
    });
    if (!r.ok) return { status: r.status, text: '' };
    const j = await r.json().catch(() => null);
    const c = j && j.choices && j.choices[0];
    const text = (c && ((c.message && c.message.content) || c.text)) || '';
    return { status: 200, text: typeof text === 'string' ? text : '', model: (j && j.model) || model };
  } catch (e) {
    return { status: 504, text: '' };
  } finally { clearTimeout(timer); }
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!process.env.OPENROUTER_API_KEY) return res.status(200).json({ off: true });               // no key yet: the app quietly uses the lectures

  // only this site's own pages may call the function
  let origin = '';
  try { origin = new URL(req.headers.origin || '').host; } catch (e) {}
  if (!origin || origin !== req.headers.host) return res.status(403).json({ error: 'forbidden' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return res.status(200).json({ busy: true });

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

  const user = [
    TASKS[task] + (prompt ? ' Purpose: ' + prompt : ''),
    q ? 'Question from the devotee: ' + q : '',
    'Lecture passages:',
    kb.map((x, k) => '[' + (k + 1) + '] ' + x.title + ' (' + [x.verse, x.location].filter(Boolean).join(', ') + '): ' + x.passage).join('\n\n')
  ].filter(Boolean).join('\n\n');
  const messages = [{ role: 'system', content: RULES }, { role: 'user', content: user }];
  const maxTokens = task === 'chat' ? 450 : 900;

  let out = await ask(MODEL, messages, maxTokens, 26000);
  if (out.status !== 200 || useless(out.text)) {
    const first = out.status;
    out = await ask(FALLBACK, messages, maxTokens, 26000);
    if (out.status !== 200 || useless(out.text)) {
      // daily limit reached, or no usable reply: the app shows the lecture passages with a short note
      return res.status(200).json({ busy: true, reason: (first === 429 || out.status === 429) ? 'limit' : 'no reply' });
    }
  }
  return res.status(200).json({ answer: tidy(out.text), model: out.model });
};
