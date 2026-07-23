#!/usr/bin/env node
/**
 * Chatbot regression suite: fires canonical visitor questions at the live
 * AnythingLLM embed and checks that the answer references the expected
 * page. Run after corpus/prompt/embedder changes on the backend.
 *
 * Usage: node scripts/test-chatbot.js [--only <substring>]
 * (~1 request per case, fresh session each, 1.5s apart — rate-limit friendly)
 */
import crypto from 'node:crypto';

const API = 'https://chat.bern-hypnose.ch/api/embed/090e1c03-3e1e-4e42-a9a5-9a193c659591/stream-chat';

// expect: regex matched against the full answer text (links or plain paths)
const CASES = [
    { q: 'Hast du Infos über Schmerzen und Hypnose?', expect: /schmerzen/i },
    { q: 'Hilft Hypnose gegen Flugangst?', expect: /flugangst/i },
    { q: 'Hilft Hypnose beim Rauchstopp?', expect: /rauchstopp|abhaengigkeit/i },
    { q: 'Kann ich mit Hypnose abnehmen?', expect: /abnehmen|ernaehrung/i },
    { q: 'Hilft Hypnose bei Schlafstörungen?', expect: /schlafst/i },
    { q: 'Macht ihr auch Hypnose für Kinder?', expect: /kinderhypnose/i },
    { q: 'Was kostet eine Hypnosesitzung?', expect: /angebote|kosten/i },
    { q: 'Hilft Hypnose bei Depressionen oder Burnout?', expect: /depression|burnout/i },
    { q: 'Gibt es Hypnose gegen Prüfungsangst?', expect: /pr(ü|ue)fungsangst/i },
    { q: 'Ich habe Angst vor dem Zahnarzt, kann Hypnose helfen?', expect: /zahnarzt/i },
    { q: 'Was ist Sporthypnose?', expect: /sporthypnose/i },
    { q: 'Hilft Hypnose, mein Selbstvertrauen zu stärken?', expect: /selbstvertrauen/i },
    { q: 'Hilft Hypnose bei Zwangsstörungen?', expect: /zwangsst/i },
    { q: 'Was ist Hypnose überhaupt?', expect: /was-ist-hypnose/i }
];

// Multi-turn: topic question, then a vague follow-up in the SAME session.
// This is the known weak spot — retrieval only sees the last message.
const FOLLOWUP_CASES = [
    { q1: 'infos über schmerzen und hypnose', q2: 'hast du einen link dazu?', expect: /schmerzen/i },
    { q1: 'Kann Hypnose beim Abnehmen helfen?', q2: 'link zur infos?', expect: /abnehmen|ernaehrung/i },
    { q1: 'Ich habe Flugangst.', q2: 'wo kann ich mehr darüber lesen?', expect: /flugangst/i },
    { q1: 'Was kostet das bei dir?', q2: 'gibt es dazu eine seite?', expect: /angebote|kosten/i },
    { q1: 'Ich schlafe schlecht.', q2: 'hast du dazu was auf der website?', expect: /schlafst/i }
];

async function ask(question, sessionId = crypto.randomUUID()) {
    const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, sessionId })
    });
    if (res.status === 429) throw new Error('RATE_LIMIT');
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let text = '';
    let sources = [];
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (!raw || raw === '[DONE]') continue;
            try {
                const data = JSON.parse(raw);
                if (data.textResponse) text += data.textResponse;
                if (Array.isArray(data.sources) && data.sources.length) sources = data.sources;
            } catch {
                /* partial line */
            }
        }
    }
    return { text, sources };
}

// ── URL validation against the live whitelist (mirrors the frontend guardrail) ──

const whitelistRes = await fetch('https://bern-hypnose.ch/site-urls.json');
const whitelist = new Set(await whitelistRes.json());

function classifyPaths(text) {
    const PATH_RE = /\/[a-zäöüß0-9-]+(?:\/[a-zäöüß0-9-]+)*\/?/gi;
    const valid = [];
    const rescued = [];
    const invented = [];
    for (const match of text.matchAll(PATH_RE)) {
        const prev = match.index === 0 ? '' : text[match.index - 1];
        if (prev && !/[\s(>«"':,;!]/.test(prev)) continue;
        let path = match[0].replace(/\.md$/, '/');
        if (!path.endsWith('/')) path += '/';
        if (path.split('/').filter(Boolean).length === 0) continue;
        if (whitelist.has(path)) {
            valid.push(path);
            continue;
        }
        const slug = path.split('/').filter(Boolean).at(-1);
        const matches = slug && slug.length >= 4 ? [...whitelist].filter((p) => p.endsWith(`/${slug}/`)) : [];
        if (matches.length === 1) rescued.push(`${path} → ${matches[0]}`);
        else if (slug && slug.length >= 4) invented.push(path);
    }
    return { valid, rescued, invented };
}

const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
const cases = only ? CASES.filter((c) => c.q.toLowerCase().includes(only.toLowerCase())) : CASES;

let pass = 0;
let warn = 0;
let fail = 0;
for (const testCase of cases) {
    try {
        const { text, sources } = await ask(testCase.q);
        const sourceText = JSON.stringify(sources);
        const topical = testCase.expect.test(text) || testCase.expect.test(sourceText);
        const { rescued, invented } = classifyPaths(text);

        if (topical && !invented.length && !rescued.length) {
            pass++;
            console.log(`✅ ${testCase.q}`);
        } else if (topical && !invented.length) {
            warn++;
            console.log(`⚠️  ${testCase.q}`);
            console.log(`   reparierte Links: ${rescued.join(', ')}`);
        } else {
            fail++;
            console.log(`❌ ${testCase.q}`);
            if (!topical) console.log(`   Thema-Link fehlt (erwartet: ${testCase.expect})`);
            if (invented.length) console.log(`   erfundene Links (nicht reparierbar): ${invented.join(', ')}`);
            console.log(`   Antwort: ${text.replace(/\n+/g, ' ').slice(0, 220)}…`);
        }
    } catch (err) {
        if (err.message === 'RATE_LIMIT') {
            console.error('⛔ Rate limit erreicht — später erneut ausführen.');
            process.exit(2);
        }
        fail++;
        console.log(`💥 ${testCase.q} — ${err.message}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
}

if (!only) {
    console.log('\n— Folgefragen (gleiche Session, vage Nachfrage) —');
    for (const testCase of FOLLOWUP_CASES) {
        try {
            const sessionId = crypto.randomUUID();
            await ask(testCase.q1, sessionId);
            await new Promise((resolve) => setTimeout(resolve, 1500));
            const { text, sources } = await ask(testCase.q2, sessionId);
            const topical = testCase.expect.test(text) || testCase.expect.test(JSON.stringify(sources));
            const { rescued, invented } = classifyPaths(text);
            if (topical && !invented.length && !rescued.length) {
                pass++;
                console.log(`✅ ${testCase.q1} → «${testCase.q2}»`);
            } else if (topical && !invented.length) {
                warn++;
                console.log(`⚠️  ${testCase.q1} → «${testCase.q2}»  (repariert: ${rescued.join(', ')})`);
            } else {
                fail++;
                console.log(`❌ ${testCase.q1} → «${testCase.q2}»`);
                if (!topical) console.log(`   Thema-Link fehlt (erwartet: ${testCase.expect})`);
                if (invented.length) console.log(`   erfundene Links: ${invented.join(', ')}`);
                console.log(`   Antwort: ${text.replace(/\n+/g, ' ').slice(0, 200)}…`);
            }
        } catch (err) {
            if (err.message === 'RATE_LIMIT') {
                console.error('⛔ Rate limit erreicht — später erneut ausführen.');
                process.exit(2);
            }
            fail++;
            console.log(`💥 ${testCase.q1} → ${testCase.q2} — ${err.message}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));
    }
}

console.log(`\n✅ ${pass} · ⚠️ ${warn} (Frontend repariert) · ❌ ${fail}`);
process.exit(fail ? 1 : 0);
