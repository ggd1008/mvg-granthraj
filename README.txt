MVG Granthraj Chat - hosting kit, version 2
Experimental seva project, respect privacy terms, no illegal.
Jai Srila Prabhupada ki Jai!

UPLOAD
Put these 5 files together in one folder on an https site (for example Hostinger public_html/granthraj/):
  index.html              the app (172 lectures inside)
  sw.js                   service worker, cache-first, cache name mvg-granthraj-v2
  manifest.webmanifest    app name, colours, icons
  icon-192.png, icon-512.png   lotus icons (kept as lotus; Maharaj's photo is used inside the app only)
Open the folder address once on the phone while online. After that the app opens offline and the
browser offers "Install app" / "Add to Home screen".
Updating: when you replace index.html, open sw.js and raise v2 to v3 so phones download the new copy.

CHANGELOG, VERSION 2

A. Voice and address
  A1  The app is "Granthraj sevak". It never says "I" as Maharaj. Maharaj's words appear only inside quotes.
  A2  It asks once "How may I address you?" (Prabhuji / Mataji). Until chosen it says only "Hare Krishna".
      The choice can be changed in Settings.
  A3  First mention is "His Holiness Mahavishnu Goswami Maharaj", after that "Maharaj" or "Srila Gurudev".
      Srila Prabhupada is always named first.
  A4  Greetings are written in full, never as PAMHO or AGTSP.

B. Greetings
  B1  First open: "Hare Krishna, Prabhuji. Please accept my humble obeisances. All glories to Srila
      Prabhupada and Srila Gurudeva."
  B2  Returning: "Hare Krishna, Mataji" with "How is your chanting today?" in the ask box.
  B3  Reply to "Dandavat pranam": "Hare Krishna, Prabhuji. Dandavat pranam." A servant returns obeisances.
  B4  Newcomer ("first time", "new here"): "Hare Krishna. Welcome."
  B5  Before a quote: "Srila Gurudev said in Rajkot, on SB 1.2.18:"
  B6  Nothing found: "Please forgive this servant, Prabhuji. I could not find this in Maharaj's lectures."
      The three spare topics are offered there.
  B7  Closing: "Jai Srila Prabhupada ki Jai!" on thanks or goodbye, and at the end of exports and notes.

C. Borders
  C1  The full maha-mantra replaces the Ram border, in the script of the chosen language (Roman for English).
  C2  On posters the mantra is upright on the top and bottom only; the sides carry a lotus motif.
      The faint background pattern is lotus too, so the holy name is never sideways, upside down or cut.
  C3  Posters, the footer and exports carry "Founder-Acarya: His Divine Grace A.C. Bhaktivedanta Swami
      Prabhupada", placed before Maharaj's name.

D. Chips
  D1-D6 as accepted. The three spare chips appear when nothing is found.

E. Persona intro
  E1  Shown on the first open, with the lecture count filled in automatically.
  E2  The Hindi intro is stored in the code as INTRO_HI, ready for when Hindi is switched on.
  E3  Subtitle: "Maharaj's vani, at your service".

THREE DECISIONS
  1. Golden Line removed from the main screen and from chat. It is now in Settings > About.
     The main screen shows Maharaj's life verse SB 1.6.26 from the second visit onward.
  2. Footer: "Jai Srila Prabhupada • Jai Srila Gurudeva" and the Founder-Acarya line.
  3. Life sketch uses the official site's birth sentence. The Rajkot inauguration details are marked
     "to be confirmed". Lecture count stays 172: the duplicate was already removed in version 1
     (163 in the first file, minus 1 duplicate, plus 10 from the PDFs).

LANGUAGE
  English only for now. TT.hi = {} and TT.gu = {} are empty, so the language choice is hidden.
  Hindi, Gujarati and Hinglish questions are still understood by the search.

NEW FEATURES
  1. Login: mobile number, then the experimental access code 123456. No SMS is sent and there is no server.
     The number is stored only on that device (mvg_user_mobile). Log out is in Settings.
  2. Maharaj's photos: round header logo, 96px photo on the main and login screens, 32px photo beside
     each quote of his words, gallery in Settings > About, optional photo at the top of posters.
     The sevak's own chat bubble keeps the lotus, because the sevak must not appear to be Maharaj.
  3. Custom lectures: Admin panel form (title, verse, place, Sanskrit lines, transcript). Saved in
     mvg_kb_custom as {t, v, l, r:[{k:'p'|'v', text}]}, merged on load, shown in search and the library.
  4. Admin panel (Settings > Admin panel, PIN 108, changeable): add, list, delete, export and import custom
     lectures; users on this device; hosting-kit downloads; erase everything. The PIN only hides the panel.
     It is not real security, because everything lives in the browser.
  5. Prepare notes: the Notes button under an answer. Choose up to five lectures, pick Notes, Article or
     List, and write what it is for. With an API set, the request and the chosen passages are sent to it.
     Without an API the notes are Maharaj's own passages. Export as PDF or Word, or add to chat and bookmark.
     API: any address ending in /v1 is called in the OpenAI style with the model name from Settings.
  6. Links to ISKCON Rajkot, Granthraj and Media Hub on the main screen and in Settings.

PHOTO SIZES
  Used now (made from the three photos received):
    header logo and quote photo   160 x 160 px, from the transparent picture (original only 120 x 80)
    main and login photo          288 x 288 px, face crop from the lecture picture
    gallery                       720 x 478 px and 324 x 420 px
  For sharper results please send:
    header logo                   square, at least 256 x 256 px, face centred, transparent or plain background
    main photo                    square, at least 512 x 512 px
    gallery (3 or 4 photos)       at least 1200 px on the long side, JPG
    poster photo                  square, at least 600 x 600 px
