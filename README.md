# Kotoba Daily · ことばデイリー

A three-minute Japanese vocabulary game built with Next.js App Router, React, TypeScript and Tailwind CSS. Everyone gets the Animals (動物) challenge. The daily date uses UTC. You can replay after a round ends.

## Run locally

Install Node.js 24 and npm. In the project directory, run:

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). If that port is occupied, use the Local URL printed by Next.js. The clearly labeled demo works immediately with its bundled animal dictionary.

## Enable OpenAI validation

In PowerShell, create the local environment file:

```powershell
Copy-Item .env.example .env.local
```

On macOS or Linux, use `cp .env.example .env.local`. Set `OPENAI_API_KEY` in that file to your server-side API key and restart Next.js. Optionally set `OPENAI_MODEL` to a Responses API model supporting Structured Outputs. The default is `gpt-4.1-mini`. The official OpenAI JavaScript SDK parses the response against a Zod schema. [Structured Outputs guide](https://developers.openai.com/api/docs/guides/structured-outputs)

## Play

1. Select **Learner** for a kana preview and automatic romaji conversion on submit, or **Fluent** for direct Japanese input.
2. Start a round. Enter a word and press Enter or Submit. More words can be submitted while earlier ones are being checked.
3. Each unique concept earns 10 points. 犬, 柴犬, 秋田犬 and ハシビロコウ earn 40 points together. いぬ and イヌ share the 犬 concept. 大きい犬 is an improvised description.
4. Select **Give up** to end early, or play until time expires. The results show your score and collected words. Words received before the round ended can still earn points while you review the results. Refreshing restores the current UTC day's most recent round on that browser.

## Judging and storage

The Node.js route timestamps arrivals before reading the submission. A round accepts requests during the half-open interval from its start to its three-minute deadline. The server checks the clock, word length (48 UTF-16 code units), Japanese script, and fixed-window request limits. The default limits are 70 submissions per round and 100 POST requests per client address per minute. Local development falls back to one shared address bucket. A deployed proxy should supply a trusted client address.

A curated dictionary resolves common names, aliases and example rejections deterministically. With an API key, remaining candidates go to the server-side model as untrusted JSON data. Model-derived concept IDs use normalized canonical headwords, so synonym matching outside the curated dictionary depends on the model's choice of headword. The validator treats low confidence, refusal and missing output as uncertain. API outages return a retryable error. Demo dictionary misses are uncertain.

SQLite in `.data/kotoba.sqlite` holds rounds, accepted concepts, rate counters and judgments. Valid and invalid judgments are cached by category/rule version, validator configuration and normalized spelling. Only decisive judgments are cached. A unique database key on round and concept prevents double scoring during concurrent requests. Browser local storage holds the most recent round ID for each UTC date. The database requires a writable filesystem. Replace the storage adapter in `lib/storage.ts` to add a shared backend such as Supabase.

## Verify and run the production build

```sh
npm run lint
npm test
npm run build
npm start
```

Tests cover spelling aliases, separate breeds, category exclusions, uncertain demo results, duplicate awards, deadline boundaries, cached rejections and rate windows. Node 24 may print an experimental warning for its built-in SQLite module.

## Source map

| File | Responsibility |
| --- | --- |
| `app/page.tsx`, `app/layout.tsx`, `app/globals.css` | Daily page, metadata, responsive layout and game styling |
| `components/Game.tsx`, `components/Habitat.tsx` | Round controls, collection, results, instructions and illustrated habitat |
| `app/api/game/route.ts` | Start, resume and submit endpoints |
| `lib/game.ts`, `lib/dictionary.ts` | Shared rules, normalization, types and local validator |
| `lib/validator.ts` | Structured AI judgments and cache coordination |
| `lib/storage.ts` | SQLite persistence and atomic scoring |
| `tests/game.test.ts` | Game rules and persistence tests |
| `.env.example` | Optional server configuration |
