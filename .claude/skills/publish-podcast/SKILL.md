---
name: publish-podcast
description: Publish Janine's latest podcast take from the private R2 inbox as an episode on bern-hypnose.ch/podcast/ — download, convert, transcribe the Mundart, draft a short Hochdeutsch text, get Sylvain's approval, then upload, write the episode page, commit and push. Use when Sylvain asks to publish the podcast / the latest take ("publie le podcast", "nouvelle prise de Janine", the "Publish latest podcast take" button of the Bern Hypnose mod).
---

# Publish the latest podcast take

Janine records on `/record/`; takes land in the private R2 inbox (`inbox/<UTC timestamp>.<ext>`). This skill turns the latest take into a published episode. Talk to Sylvain in French; the episode text is in **Hochdeutsch** (Swiss spelling: "ss", never "ß").

Context: weekly 3–4 min motivational messages in Mundart (Bärndütsch) for Janine's small community. Tone is warm and encouraging, **not marketing**: no call to action to `/termin/`, no sales language. Decisions and constraints: `.claude/tickets/podcast-foundation/spec.md`, `.claude/tickets/podcast-recorder/spec.md`.

## 1. Look at the inbox

```bash
node scripts/podcast.mjs list
```

- Empty → tell Sylvain there is nothing to publish and stop.
- Several real takes → name them (time, duration, title) and ask which one, unless he already said "the latest".
- Tiny objects (`tiny: test/junk`) are leftovers from tests: offer to delete them (`node scripts/podcast.mjs delete inbox/<key> --yes`), never delete a real take without asking.

## 2. Prepare

```bash
node scripts/podcast.mjs prepare            # latest real take
node scripts/podcast.mjs prepare inbox/<key> # a specific one
```

It downloads the take, converts it to a loudness-normalised mono MP3 (−16 LUFS, 96 kbps) and transcribes it locally with Whisper (`turbo`, German; the first run downloads the model; a few minutes on CPU — run it in the background if it takes long). It prints `meta.json`: `workDir`, `transcriptPath`, `durationSeconds`, `fileSize`, `title`, `description` (both written by Janine on `/record/`; the title is mandatory there, the description optional).

## 3. Draft the episode

Read the transcript. Whisper turns Mundart into approximate Standard German: it captures the ideas, not the exact words. **Never quote it as if it were verbatim.**

**Janine's own words come first.** She types the title (mandatory) and a description (optional) on her phone when she sends the take.

- **title** — Janine's title, as she wrote it. Only fix an obvious typo, and say so to Sylvain. If it is empty (older takes), draft one: short, warm, Hochdeutsch, max ~60 characters.
- **summary** — ≤ 160 characters, used as meta description and list teaser. If her description fits, use it as is; if it is longer, condense it faithfully (her wording, shortened); if there is none, write one or two sentences from the transcript.
- **body** — if she wrote a description, use it **verbatim** as the body (paragraph breaks kept). Do not rewrite or embellish her text. If there is none, draft 150–300 words in Hochdeutsch, "Darum geht es in dieser Folge": the message, its key thoughts, an encouraging closing line. Plain Markdown, no headings. No `/termin/` link. A link to a related blog post (`/blog/<slug>/`) is welcome when it truly fits and Sylvain agrees; check it exists in `src/content/blog/`.
- Whatever she wrote, still read the transcript and tell Sylvain if her title or description does not match what she says in the recording.
- **slug** — `YYYY-MM-DD-<short-kebab-title>`, date = recording date (`recordedAt`), ASCII only (ä→ae, ö→oe, ü→ue).
- **episode number** — highest `episode:` in `src/content/podcast/*.md` + 1, ignoring the technical test episode (`2026-11-13-test-folge.md`). For the first real episode, ask Sylvain whether to delete the test episode (and its `episodes/test-folge.mp3`) in the same commit.

Show Sylvain the title, summary, body, slug and number, plus 3–4 lines of what the transcript said, so he can check nothing was misheard. Offer him the MP3 to listen to (`<workDir>/episode.mp3`).

**Stop and wait for his explicit approval.** His "go" for this episode is also the approval to commit and push it.

## 4. Publish (only after approval)

```bash
node scripts/podcast.mjs publish <workDir> <slug>
```

It uploads `episodes/<slug>.mp3`, keeps the raw take in the private `archive/`, removes it from the inbox and checks the public URL. It prints `audioUrl`, `duration`, `fileSize`.

Write `src/content/podcast/<slug>.md`:

```markdown
---
title: '<title>'
publishDate: <recordedAtIso from meta.json, e.g. 2026-11-20T07:15:00Z>
summary: '<summary>'
audioUrl: '<audioUrl>'
duration: <duration>
fileSize: <fileSize>
episode: <number>
draft: false
---

<body>
```

Then:
1. `npm run build` must pass (the schema rejects a wrong `audioUrl`).
2. Commit only the new episode file (and the test-episode removal if agreed): `Add podcast episode <number>: <title>`, with the attribution trailer.
3. Push the current branch. Pushing to `main` is what deploys; Sylvain's approval in step 3 covers this push. On any other branch, say which branch it is on.
4. Report the episode URL (`https://bern-hypnose.ch/podcast/<slug>/`) and that Netlify is deploying.

## If something fails

- `PODCAST_UPLOAD_TOKEN missing` → it must be in `.env` (same value as the Worker secret `UPLOAD_TOKEN`).
- wrangler not authenticated → Sylvain runs `npx wrangler login` in `workers/podcast-audio/`.
- `already exists` on publish → choose another slug; never overwrite a published episode.
- If publish failed after the MP3 upload, re-running is safe only with the same slug check: inspect what exists first.
