# Spec: podcast-recorder — Recording page for Janine (Fairphone) + upload to R2 inbox + notification

**Status:** APPROVED (defaults accepted 2026-11-13: ntfy, home-screen bookmark, `/record/`)
**Author:** Sylvain Aerni (with Claude)
**Created:** 2026-11-13
**Last Updated:** 2026-11-13
**Stack:** Astro 5.18 (static), Svelte 5 (runes), Tailwind 3, Netlify. Cloudflare Worker `workers/podcast-audio/` (TypeScript, wrangler 4.162) bound to R2 bucket `bern-hypnose-podcast`.
**Depends on:** `podcast-foundation` (PR enzyms/bern-hypnose#150) — bucket, Worker, `/podcast-audio/` proxy.

---

## Summary

Janine needs a single page on her phone where she records a 3–4 minute message, listens back, and presses **Senden**. The recording lands in the private `inbox/` of the R2 bucket, and Sylvain gets a push notification. Nothing is published at this stage: publishing (conversion, Hochdeutsch text, page) is the job of the `/publish-podcast` skill, specified separately.

Her phone is a **Fairphone (Android, USB-C)**. The lavalier mic is plugged into the phone (DJI receiver over USB-C) when available. The page must therefore work first in Android Chrome (confirmed: stock Android + Chrome), and still work in iOS Safari.

---

## Current State

### Audit Findings

| # | Finding | Severity | Evidence | Implication |
|---|---------|----------|----------|-------------|
| 1 | The Worker only accepts GET/HEAD | HIGH | `workers/podcast-audio/src/index.ts:20-21` | Uploads need a new authenticated write path. Extending this Worker avoids S3 keys and presigned URLs. |
| 2 | The Worker serves only `episodes/<name>.mp3`; `inbox/` is unreachable | HIGH | `index.ts` `KEY_PREFIX`, `FILENAME`; verified live on the preview (404) | The write path must stay write-only: uploads go to `inbox/`, and the read path must not change. |
| 3 | No Worker secrets exist yet | MEDIUM | `wrangler.jsonc` has only the R2 binding | Add `UPLOAD_TOKEN` and `NTFY_TOPIC` via `wrangler secret put`. They are never committed. |
| 4 | The existing PWA manifest is scoped to `/app/start/` (self-hypnosis app) | MEDIUM | `astro.config.mjs` AstroPWA `scope: '/app/start/'`, `start_url: '/app/start/'` | The recorder cannot reuse that manifest. It needs its own static manifest scoped to `/record/`, or none (see Q4). |
| 5 | `BaseHead` supports `noindex`; the sitemap filter already excludes admin-like pages | LOW | `src/components/BaseHead.astro:20,89`; `astro.config.mjs` sitemap `filter` | `/record/` gets `noindex` and is excluded from the sitemap like `/dashboard/`. |
| 6 | `BaseLayout` mounts the chat widget and decorative 3D background on every page | MEDIUM | `src/layouts/BaseLayout.astro` (`<Three />`, `<Chat client:load>`) | The recorder should use a minimal layout: no 3D background (CPU/battery while recording on a phone), no chat bubble. |
| 7 | `localStorage` is already used client-side | LOW | `src/components/SearchSection.svelte`, `src/utils/assistant-chat.ts` | Storing the upload token on the device is consistent with the existing patterns. |
| 8 | Netlify Functions exist but are not needed | LOW | `netlify/functions/` (2 files) | Upload goes straight to the Worker; no new Netlify Function. |
| 9 | `robots.txt` disallows `/admin/` only | LOW | `public/robots.txt` | `noindex` is enough; the page is not linked anywhere. |

### Affected Files

**New**
- `src/pages/record.astro` — page shell (minimal layout, `noindex`)
- `src/components/PodcastRecorder.svelte` — recorder UI and state machine
- `src/utils/recording-store.ts` — IndexedDB persistence of the pending recording

**Modified**
- `workers/podcast-audio/src/index.ts` — authenticated `PUT /inbox/<id>.<ext>`, CORS, ntfy notification
- `workers/podcast-audio/wrangler.jsonc` — vars (allowed origins, max size)
- `astro.config.mjs` — sitemap exclusion for `/record/`

### Test Coverage

- Existing tests: none (no test runner). The Worker was verified with `wrangler dev` + `curl` and live `curl`.
- Gaps: no automated tests for the recorder. Verification is manual on the Fairphone plus Playwright with a fake microphone.

---

## Objectives

1. Janine records, listens back and sends in **three taps**, without any technical step.
2. A recording is **never lost**: it survives a page reload, a network drop or a locked screen until the upload is confirmed.
3. Raw recordings stay **private** (`inbox/`), and only someone holding the token can upload.
4. Sylvain knows **within a minute** that a new recording is waiting.

---

## Acceptance Criteria

**Recording (Fairphone, Android Chrome)**
- [ ] `/record/` asks for microphone permission once, then shows a large **Aufnehmen** button
- [ ] If several inputs exist (e.g. a USB-C DJI receiver), a microphone selector lists them; the last choice is remembered
- [ ] While recording, the page shows a running timer (mm:ss) and a live input-level meter, and the screen stays on (Screen Wake Lock)
- [ ] **Stopp** ends the recording and shows a player to listen back, plus **Neu aufnehmen** and **Senden**
- [ ] Recording stops automatically at 10:00 with a visible message
- [ ] Browser audio processing is off (`echoCancellation`, `noiseSuppression`, `autoGainControl` = false), so the lavalier sound is not degraded
- [ ] An optional short **Notiz** field (e.g. a working title) is sent with the recording
- [ ] **Datei wählen** lets her upload an existing audio file instead (`accept="audio/*"`), for example from a dictaphone app or the DJI mic's internal recording

**Reliability**
- [ ] After **Stopp**, the recording is saved in IndexedDB; reloading the page offers it again ("Unversendete Aufnahme gefunden")
- [ ] The local copy is deleted only after the Worker answers `201`
- [ ] A failed upload (offline, 5xx) shows **Erneut senden** and keeps the recording
- [ ] Upload shows progress (percentage)

**Upload & security (Worker)**
- [ ] `PUT /inbox/<id>.<ext>` with a valid `Authorization: Bearer <UPLOAD_TOKEN>` stores the object in R2 under `inbox/` and returns `201` with the key
- [ ] Missing or wrong token → `401`; the comparison is constant-time
- [ ] `<id>` must match `^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z$`, and `<ext>` must be one of `webm|ogg|m4a|mp4|mp3|wav|aac`; anything else → `400`
- [ ] `Content-Type` must be `audio/*`, and the body must be ≤ 100 MB; otherwise `415` / `413`
- [ ] An existing key is never overwritten (`409`)
- [ ] CORS: preflight `OPTIONS` allows `PUT` from `https://bern-hypnose.ch`, `https://deploy-preview-*--bern-hypnose.netlify.app` and `http://localhost:*`; other origins get no CORS headers
- [ ] GET of any `inbox/` key through the Worker or `/podcast-audio/` still returns `404` (regression of the foundation criteria)
- [ ] The note is stored as R2 custom metadata (`note`, max 500 chars), with duration and user agent

**Notification**
- [ ] After a successful upload, a push notification reaches Sylvain's phone within 60 s with "Neue Aufnahme von Janine" and the duration; it contains no audio link and no token
- [ ] A notification failure does not fail the upload (the page publishes to ntfy only after a 201, best effort)

**Page hygiene**
- [ ] `/record/` has `<meta name="robots" content="noindex, nofollow">` and is absent from the sitemap
- [ ] The page has no 3D background and no chat widget
- [ ] The UI is in German (Hochdeutsch), readable on a 360 px wide screen, buttons ≥ 48 px

**First use**
- [ ] On first visit, the page asks for the access code once and stores it on the device; a wrong code is reported clearly ("Zugangscode ungültig")

**Regression**
- [ ] `npm run build` succeeds
- [ ] `/podcast/` playback and the `/podcast-audio/` proxy behave as in `podcast-foundation`

---

## Scope

### In Scope

- `/record/` page and the `PodcastRecorder.svelte` component
- IndexedDB persistence of the pending recording
- Authenticated upload path, CORS and size and type limits in the existing Worker
- ntfy push notification, published by the page after a confirmed upload

### Out of Scope

- Converting, transcribing or publishing the recording → `/publish-podcast` spec
- Deleting or archiving `inbox/` objects after publishing → `/publish-podcast` spec
- Web Share Target ("Teilen → Bern Hypnose") → follow-up once the page is in daily use
- Editing or trimming audio in the browser
- Multi-user accounts (one shared access code for Janine)
- Homepage "Neuste Folge anhören" block

---

## Technical Approach

### Approach Summary

A static Astro page hosts a Svelte 5 recorder built on `getUserMedia` + `MediaRecorder`. The recording is persisted in IndexedDB as soon as it stops, then uploaded with a single `PUT` straight to the existing Worker on `workers.dev`. The Worker checks a shared bearer token, writes to `inbox/`, and returns the ntfy topic; the page then publishes the notification (ntfy.sh rejects requests from Workers with HTTP 522, verified 2026-11-13). No Netlify Function, no S3 credentials, no presigned URLs.

### Options considered for the upload path

| Option | Blast radius | Trade-offs | Verdict |
|--------|-------------|------------|---------|
| **A. Authenticated PUT on the existing Worker** | 1 file in the Worker + 2 secrets | No S3 keys; R2 binding already there; 100 MB request limit on Workers Free; needs CORS (cross-origin to `workers.dev`) | **Recommended** |
| B. Netlify Function issuing R2 presigned URLs (S3 API) | New function + AWS SDK dependency + R2 API token in Netlify env + bucket CORS | More moving parts, long-lived S3 credentials in Netlify | Rejected |
| C. Upload through the `/podcast-audio/` Netlify proxy (same origin, no CORS) | Same as A + proxy | Netlify proxy body size limits are unclear for 40 MB+ WAV files; writes through a CDN rewrite are fragile | Rejected |

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Recording format | `audio/webm;codecs=opus` when supported (Android Chrome), else `audio/mp4` (iOS Safari), at 128 kbps | Native browser support, small files (~4 MB / 4 min). The publish skill converts to MP3 anyway. |
| Audio processing | All browser DSP off | Lavalier mic close to the mouth; DSP pumps and muffles voices. |
| Auth | One long random access code (≥ 32 chars), Worker secret `UPLOAD_TOKEN`, stored in `localStorage` on her phone | Simplest thing that keeps strangers out. Only allows writing to a private folder. Rotatable with `wrangler secret put`. |
| Object key | `inbox/<UTC timestamp>.<ext>`, generated client-side | Sortable, and the "latest recording" for the publish skill is the last key. Collisions are rejected (409). |
| Metadata | R2 `customMetadata`: `note`, `durationSeconds`, `userAgent` | The publish skill gets context without a sidecar file. |
| Notification | ntfy.sh, topic name as Worker secret `NTFY_TOPIC` (random, unguessable), returned only in the authenticated 201; the page publishes it (JSON POST to `https://ntfy.sh/`, no CORS preflight) | Free, no account, Android + iOS app. Publishing from the Worker fails (522 from ntfy.sh). |
| Persistence | IndexedDB (one pending recording) | `localStorage` cannot hold ~4–40 MB blobs. |
| Layout | Minimal layout for `/record/` (no `<Three />`, no `<Chat />`) | Battery, CPU and focus while recording. |
| Upload progress | `XMLHttpRequest` upload events | `fetch` has no upload progress in browsers yet. |

### Phased Breakdown

1. **Worker write path**: PUT, auth, validation, CORS, metadata, ntfy. Verified with `wrangler dev` + `curl`, then deployed. The read-path regression is re-checked.
2. **Recorder component**: state machine (idle → recording → review → uploading → sent / error), mic selection, level meter, wake lock, 10-min cap. Verified in desktop Chrome with a real mic and in Playwright with a fake device.
3. **Persistence + upload**: IndexedDB save and restore, XHR upload with progress, retry, access-code screen.
4. **Page + hygiene**: `/record/`, minimal layout, `noindex`, sitemap exclusion, optional manifest (Q4). Then a full test on the Fairphone with the USB-C mic.

### Affected Layers

- Cloudflare Worker (+ secrets)
- Static page + Svelte island
- Browser storage (IndexedDB, localStorage)
- Build config (sitemap filter)

---

## Test Strategy

### Worker

| # | Test | Type | What It Verifies | Priority |
|---|------|------|-----------------|----------|
| 1 | `curl -X PUT` with / without / wrong token | integration (`wrangler dev`) | 201 / 401 / 401 | CRITICAL |
| 2 | Bad id, bad extension, non-audio type, oversize body | integration | 400 / 415 / 413 | HIGH |
| 3 | Same key twice | integration | 409, original untouched | HIGH |
| 4 | `OPTIONS` from allowed and disallowed origins | integration | CORS headers only for allowed origins | HIGH |
| 5 | GET `inbox/...` via Worker and proxy after upload | regression | still 404 | CRITICAL |
| 6 | ntfy message received on phone | manual | notification text, no secrets | MEDIUM |

### Frontend

| # | Test | Type | What It Verifies | Priority |
|---|------|------|-----------------|----------|
| 1 | Record → stop → play back → send | e2e (Playwright, `--use-fake-device-for-media-stream`) | Happy path and state transitions | CRITICAL |
| 2 | Reload after stop | e2e | Pending recording restored from IndexedDB | CRITICAL |
| 3 | Upload with network offline, then retry | e2e | Recording kept, retry succeeds | HIGH |
| 4 | Wrong access code | e2e | Clear message, nothing uploaded | MEDIUM |
| 5 | Fairphone + USB-C mic, 4-minute real recording with the screen untouched | manual | Mic selection, wake lock, real file quality | CRITICAL |
| 6 | iOS Safari (Sylvain's old iPhone) | manual | Fallback `audio/mp4` path works | MEDIUM |

---

## Risks & Mitigation

| ID | Risk | Severity | Likelihood | Mitigation |
|----|------|----------|------------|------------|
| R1 | Access code leaks (shared screenshot, lost phone) | MEDIUM | LOW | It only allows writing to a private folder. Rotate with `wrangler secret put UPLOAD_TOKEN`. Size and type limits cap the abuse. |
| R2 | Android kills the tab or the screen locks mid-recording, and the recording is lost | HIGH | MEDIUM | Screen Wake Lock; `MediaRecorder` with a 1 s timeslice so chunks accumulate. On `visibilitychange` to hidden, stop and save what exists. Test 5 on the real device. |
| R3 | Browser lacks `MediaRecorder` or Wake Lock | LOW | LOW | Confirmed stock Android + Chrome (Q2), which supports both. Keep feature detection + **Datei wählen** fallback for other devices. |
| R4 | The USB-C receiver is not exposed as an input in the browser | MEDIUM | LOW | Mic selector plus a test recording during phase 4. Fallback: the DJI internal recording + **Datei wählen**. |
| R5 | ntfy.sh outage or rate limit | LOW | LOW | Notification is best-effort; the recording is safe in R2 regardless. The publish skill lists `inbox/` anyway. |
| R6 | Cross-origin PUT blocked by a CORS misconfiguration on deploy previews | MEDIUM | MEDIUM | Explicit origin pattern list in the Worker vars; Worker test 4. |
| R7 | Large WAV uploads (32-bit float, ~45 MB / 4 min) on mobile data | LOW | MEDIUM | 100 MB cap, progress bar, retry. Recommend Wi-Fi in the UI when the file is > 20 MB. |
| R8 | Worker free-plan CPU limit while streaming a large body | LOW | LOW | Stream `request.body` straight into `R2.put` (no buffering); the content length is validated from the header. |

---

## Known Issues (Out of Scope)

| # | Issue | Why Deferred | Tracked In |
|---|-------|--------------|------------|
| 1 | No retention policy for `inbox/` | Depends on the publish flow | `/publish-podcast` spec |
| 2 | `deno.lock` left at repo root by `netlify dev` | Unrelated tooling artifact | delete or `.gitignore` in a separate change |
| 3 | The account `workers.dev` subdomain was auto-named `bern-hypnose-podcast-audio` | Cosmetic; renaming would change the URL in `netlify.toml` | none |

---

## Open Questions

| # | Question | Blocks |
|---|----------|--------|
| Q1 | ~~Notification channel~~ — **Decided: ntfy.** | — |
| Q2 | ~~Fairphone OS / browser~~ — **Decided 2026-11-13: stock Android + Chrome.** | — |
| Q3 | Is there a DJI **receiver** in the kit (USB-C), or only the transmitter? | Phase 4 test plan only |
| Q4 | ~~Installable app?~~ — **Decided: home-screen bookmark for now; manifest later if needed.** | — |
| Q5 | ~~URL~~ — **Decided: `/record/`.** | — |

---

## Research Sources

- MDN — MediaRecorder, `MediaRecorder.isTypeSupported`, MediaTrackConstraints (`echoCancellation`, `noiseSuppression`, `autoGainControl`), Screen Wake Lock API, IndexedDB
- Cloudflare Workers — R2 binding `put` with `customMetadata` and `onlyIf`, request body limits per plan, `wrangler secret put`, `ctx.waitUntil`
- ntfy.sh — publishing via HTTP POST, topic naming
- Internal: `workers/podcast-audio/src/index.ts`, `.claude/tickets/podcast-foundation/spec.md`, `astro.config.mjs`, `src/layouts/BaseLayout.astro`, `src/components/BaseHead.astro`
- Memory: podcast decisions (site-only, Mundart, Fairphone, community tone)
