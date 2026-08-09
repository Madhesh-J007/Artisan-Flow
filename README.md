# Artisan Flow — Prototype

A two-sided marketplace: Tamil-voice-first artisans on one side, structured-intake
retailers/buyers on the other, connected through real accounts and a shared
explainable scoring engine.

## Claude API setup (for the Profile Extraction Agent)

1. Get an API key at https://console.anthropic.com/settings/keys
2. Copy `.env.example` to `.env` in the project root
3. Paste your key: `ANTHROPIC_API_KEY=sk-ant-...`
4. That's it — `npm run dev` picks it up automatically via a local dev
   middleware that mirrors the production Vercel function, so the extraction
   agent works identically in dev and in production.

**For production (Vercel):** add the same `ANTHROPIC_API_KEY` under your
Vercel project's **Settings → Environment Variables** before deploying — it
is NOT read from `.env` in production, only in local dev.

**Never commit `.env`** — it's already in `.gitignore`. Only `.env.example`
(with a placeholder) is committed.



1. Go to https://console.firebase.google.com → **Add project** (free Spark plan is fine)
2. In your new project: **Build → Authentication → Get started → Sign-in method**
   → enable **Email/Password**
3. **Build → Firestore Database → Create database** → start in **test mode**
   (fine for a hackathon demo — see `firestore.rules` below for something slightly
   safer once you're past the demo)
4. **Project settings** (gear icon, top left) → **General** → scroll to
   "Your apps" → click the web icon `</>` → register an app (any nickname) →
   copy the `firebaseConfig` object it gives you
5. Paste that config into `src/firebase.js`, replacing the placeholder values

**Optional but recommended:** once you've copied `firestore.rules` content into
the Firebase Console under **Firestore Database → Rules** and published it,
your data is scoped so retailers/artisans can only write their own records
(rather than the wide-open default test-mode rules).

**One-time setup, permanently solved (recommended):** rather than clicking the
console link every time this project is set up fresh (e.g. on a teammate's
machine), deploy the rules and indexes as code:

```bash
npm install -g firebase-tools
firebase login
firebase use --add          # select your artisian-flow project when prompted
firebase deploy --only firestore:indexes,firestore:rules
```

This reads `firestore.indexes.json` and `firestore.rules` (already in this
project) and creates both composite indexes plus the security rules in one
shot. Takes about a minute to finish building on Firebase's side, then never
needs to be done again for this project — including for any teammate who
later runs this same command against the same Firebase project.

**Quick one-off alternative:** if you just want to unblock yourself right now
without installing the CLI, the browser console error includes a direct link
that pre-fills and creates a single index when clicked. You'd need to do this
twice (once for the artisan-side query, once for the retailer-side query) —
the CLI approach above does both permanently in one command instead.

**One thing to expect either way:** the first time you load the "Buyer Requests" or "Sent Requests" tab, Firestore may show a console error with a direct link saying
"this query requires an index." That's normal — click the link, click
"Create index," wait ~1 minute, and it resolves permanently. This happens
because those queries filter by one field and sort by another
(`where('artisanId', '==', uid)` + `orderBy('createdAt', 'desc')`).

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
```

Test the scoring engine standalone (no UI, no Firebase needed):

```bash
npm run test:engine
```

## How the two sides connect

1. **Register** as either an Artisan or a Retailer — this creates a Firestore
   `users/{uid}` document with a `role` field.
2. **Artisan**, on first login, goes through the voice-intake conversation to
   build their profile (saved to Firestore). After that, they see two tabs:
   - **Opportunities** — ranked market opportunities (melas, export orders,
     D2C requests) from the static `opportunities.json` dataset
   - **Buyer Requests** — real-time list of requests sent by retailers,
     with Accept/Decline
3. **Retailer** posts a requirement (craft, location, quantity, price band,
   timeline) via a structured form, and the app queries Firestore for **all
   registered artisans with a complete profile**, ranks them with the same
   scoring engine, and shows the results. Tapping "Contact" writes a real
   document to the `requests` collection — which the artisan then sees live
   in their **Buyer Requests** tab.

This means: **register two accounts (one artisan, one retailer) in two
browser tabs or two browsers, and you can demo the full connected loop live**
— post a requirement as the retailer, watch the request appear instantly for
the artisan, accept it, see the status update back on the retailer's side.

## Project structure

```
artisan-flow/
├── firestore.rules                    Firestore security rules (paste into console)
├── src/
│   ├── firebase.js                    Firebase config — PASTE YOUR KEYS HERE
│   ├── context/AuthContext.jsx        Login/register/logout, current user + role
│   ├── App.jsx                        Routes: AuthScreen → ArtisanDashboard | RetailerDashboard
│   ├── data/
│   │   ├── opportunities.json         18 fictional market opportunities (artisan side)
│   │   ├── artisanProfiles.json       Sample data for standalone engine testing
│   │   └── distances.js               Location distance lookup
│   ├── engine/
│   │   ├── scoringEngine.js           Core scoring engine — used in BOTH directions
│   │   └── testRun.mjs                Standalone test, run with npm run test:engine
│   └── components/
│       ├── AuthScreen.jsx             Login / register with role toggle
│       ├── ArtisanDashboard.jsx       Tabs: Opportunities, Buyer Requests
│       ├── ArtisanRequests.jsx        Real-time incoming requests, accept/decline
│       ├── RetailerDashboard.jsx      Tabs: Find Artisans, Sent Requests
│       ├── RetailerRequirement.jsx    Requirement intake form
│       ├── RetailerMatches.jsx        Ranked artisan results
│       ├── RetailerArtisanDetail.jsx  Breakdown, explanation, Contact button
│       ├── RetailerSentRequests.jsx   Real-time status of sent requests
│       ├── VoiceIntake.jsx            Simulated conversational voice intake
│       ├── OpportunityDetail.jsx      Breakdown, explanation, negotiation, feedback
│       └── UI.jsx                     Shared buttons/cards/toast/dashboard header
```

## The core technical differentiator

`scoringEngine.js` has one scoring function, `scoreOpportunity(profile, opp, weights)`,
used in **two directions**:

- `rankOpportunities(artisanProfile, opportunities, weights)` — artisan-facing:
  ranks market opportunities against one artisan
- `rankArtisansForRequirement(requirement, artisanProfiles, weights)` — retailer-facing:
  ranks artisans against one requirement

Same weighted dimensions (craft match, location fit, capacity fit, price fit,
buyer-requirement fit), same explainability, applied both ways. This is worth
saying explicitly to judges — it's a stronger story than building two separate
matching systems.

## What's real vs. simulated

✅ **Real:**
- Firebase Authentication + Firestore accounts for both roles
- Deterministic weighted scoring engine, in both directions
- Real-time request flow between retailer and artisan (Firestore `onSnapshot`)
- Feedback-driven weight adjustment and re-ranking (artisan side)
- Negotiation script and explanation generation
- **Profile Extraction Agent** — real Claude API call (`claude-haiku-4-5-20251001`)
  parses the conversation transcript into structured JSON via
  `src/server/extractProfile.js`, served through `/api/extract-profile`
  (Vercel serverless function in production, Vite dev middleware locally).
  Falls back gracefully to offline preset data if the API call fails
  (no network, missing key, no credits, etc.) — shown transparently in the
  UI, never silently breaks the demo.
- **Tamil text-to-speech playback** — a "Listen" button (`SpeakButton` in
  `UI.jsx`) reads the agent's questions, the match explanation, and the
  negotiation script aloud, using the browser's built-in Web Speech API
  (`ta-IN`). No API key, no cost, works offline. If the device/browser has
  no Tamil voice pack installed, it falls back to whatever voice is
  available rather than failing silently — a real device limitation, not a bug.
- **Real live Tamil speech recognition** — `LiveVoiceIntake.jsx` uses the
  browser's native `SpeechRecognition` API (`ta-IN`) to actually listen to
  the microphone and transcribe real speech, no API key, no cost. Offered as
  an alternative to the scripted demo at the start of profile setup — the
  real transcript goes to the same Profile Extraction Agent as the scripted
  path. Needs Chrome or Edge; shows a clear message and a path back to the
  scripted demo if the browser doesn't support it.

🎭 **Simulated, by design (for demo reliability):**
- Voice input — tapping the mic plays a scripted Tamil conversation with a
  typing effect, rather than running live ASR. A picker lets you choose which
  of 6 preset scenarios gets "spoken," so different test accounts get
  realistic, varied profiles. What happens *after* the transcript is
  generated (the extraction call) is real, not scripted.

## Next integration points (not yet built)

1. **More registered artisans** — the retailer-side matching is only as good
   as how many artisans have signed up and completed their profile. For a
   demo, register 2–3 artisan accounts ahead of time with different
   craft/location combinations so retailer matching has real variety to show.

## Roadmap (explained in pitch, not built)

Photo enhancement · full offline-first sync · packaging guidance ·
cluster fulfillment for bulk orders · dialect adaptability · multi-language
expansion beyond Tamil.
