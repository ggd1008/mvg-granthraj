MVG Vani - hosting kit, version 2.2
Experimental seva project, respect privacy terms, no illegal.
Jai Srila Prabhupada ki Jai!

FILES
  index.html              the app (172 lectures inside)
  sw.js                   service worker, cache-first, cache name mvg-granthraj-v5
  manifest.webmanifest    app name (MVG Vani), colours, icons
  icon-192.png, icon-512.png   lotus icons
  api/chat.js             server function for AI replies (runs on Vercel)
  vercel.json             gives that function up to 60 seconds
The site is deployed by Vercel from the GitHub repository; every commit to main redeploys it.
Updating: when index.html changes, raise v5 to v6 in sw.js in the same commit so phones download the new copy.
The web address, the repository name and the storage keys still say "mvg-granthraj"; changing them would
break the shared link and the data saved on phones.

AI REPLIES
  The API key is kept on the server, never in the app:
    Vercel > project mvg-granthraj > Settings > Environment Variables
      OPENROUTER_API_KEY   required   the key from openrouter.ai
      AI_MODEL             optional   the model tried first
      AI_FALLBACK_MODEL    optional   one or more models tried next, separated by commas
      AI_BASE_URL          optional   default https://openrouter.ai/api/v1 (any OpenAI-style service works)
  After adding or changing a variable, redeploy once (Deployments > latest > Redeploy).
  Default order: nvidia/nemotron-3-super-120b-a12b:free, poolside/laguna-xs-2.1:free, google/gemma-4-26b-a4b-it:free.
  Self-test: open /api/chat?check=1 in a browser. It shows, for each model, the status, the time taken and a
  sample reply. Each check uses a few of the day's free replies.
  The app sends the question and a few matching lecture passages to api/chat.js. The sevak rules live
  in that file: no speaking as Maharaj, only the given passages, no added verses, Srila Prabhupada and
  Maharaj never mixed, no greeting, plain text. A reply that is empty, is only a safety label, or joins
  the two names is thrown away and the next model is tried. If all fail, the app shows the lecture
  passages with a short note.
  Free limits on OpenRouter: 20 requests a minute; 50 free replies a day for the whole site, or 1,000 a day
  once 10 credits have been bought (one time).
  Free models are trial services. Their providers may keep questions to improve their models, and NVIDIA's
  trial terms allow testing and evaluation only, not permanent public use. For regular use, move to a paid
  model by setting AI_MODEL.

VERSION 2.2
  Name          "MVG Vani" in the header, the home-screen name, login, posters and exports.
                The assistant is still called "Granthraj sevak".
  Screen        The maha-mantra strip is removed from the app screen. It stays on posters.
  Panels        The main button of a panel (Prepare, Download, Save) sits in a footer that is always in view.
                Fields and buttons have clear borders and their own colours in dark and light mode.
  Notes         Order: result, "What is it for?", kind, lectures. Prepare is always in view.
  AI replies    Maharaj's own passage is shown under every AI reply. Quoted words that cannot be found in the
                passages are flagged. No markdown symbols. No greeting from the AI.
  Greeting      One greeting, on the first reply of a chat. Obeisances are still returned every time.
  Posters       Only Maharaj's words can be chosen. His round photo is on top by default. Mantra top and bottom.
  Menu          About is removed from Settings. The Rajkot inauguration details are final.
  Daily menu    A handle on the left edge opens: Today's lecture, Reading plan, Sadhana tracker, My notes,
                Bookmarks, All lectures. Reading plan, sadhana and notes are kept only on the device
                (mvg_plan, mvg_sadhana, mvg_notes).

EARLIER VERSIONS, IN SHORT
  The app is "Granthraj sevak". It never says "I" as Maharaj; his words appear only inside quotes.
  It asks once how to address the devotee (Prabhuji / Mataji). Srila Prabhupada is always named first.
  Login: mobile number, then the experimental access code 123456. No SMS is sent; the number stays on the device.
  Custom lectures: Settings > Admin panel (PIN 108, changeable). Saved as {t, v, l, r:[{k:'p'|'v', text}]}.
  The PIN only hides the panel. It is not real security, because everything lives in the browser.
  English only for now (TT.hi and TT.gu are empty). Hindi, Gujarati and Hinglish questions are understood by the search.
  Lecture count 172: 163 in the first file, minus 1 duplicate, plus 10 from the PDFs.
