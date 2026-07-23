#!/usr/bin/env node
/**
 * Pulls all chatbot (embed widget) conversations from AnythingLLM and writes
 * visitor questions to reports/chat-questions/ (gitignored — the repo is
 * public and questions may contain personal information; keep them local).
 *
 * Feeds the keyword-discovery loop (reports/seo/strategy.md, Säule 2).
 *
 * Env:
 *   ANYTHINGLLM_API_KEY   required — AnythingLLM: Settings → Developer API → Generate
 *   ANYTHINGLLM_BASE_URL  optional — default https://chat.bern-hypnose.ch
 *
 * Usage: node --env-file=.env scripts/fetch-chat-questions.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'reports/chat-questions');

const BASE = (process.env.ANYTHINGLLM_BASE_URL ?? 'https://chat.bern-hypnose.ch').replace(/\/$/, '');
const API_KEY = process.env.ANYTHINGLLM_API_KEY;

if (!API_KEY) {
    console.error('ANYTHINGLLM_API_KEY is not set.');
    console.error('Create one in AnythingLLM: Settings → Developer API → Generate New API Key,');
    console.error('then add ANYTHINGLLM_API_KEY=... to .env');
    process.exit(1);
}

async function api(pathname) {
    const res = await fetch(`${BASE}/api/v1${pathname}`, {
        headers: { Authorization: `Bearer ${API_KEY}`, accept: 'application/json' }
    });
    if (!res.ok) throw new Error(`AnythingLLM API ${res.status} on ${pathname}: ${(await res.text()).slice(0, 200)}`);
    return res.json();
}

function monthOf(ts) {
    const d = typeof ts === 'number' ? new Date(ts < 1e12 ? ts * 1000 : ts) : new Date(ts);
    return isNaN(d) ? 'unbekannt' : d.toISOString().slice(0, 7);
}

async function main() {
    const embedsRes = await api('/embed');
    const embeds = embedsRes?.embeds ?? [];
    if (!embeds.length) {
        console.error('No embeds found — check the API key permissions.');
        process.exit(1);
    }

    let allChats = [];
    for (const embed of embeds) {
        const uuid = embed.uuid ?? embed.id;
        const chatsRes = await api(`/embed/${uuid}/chats`);
        const chats = chatsRes?.chats ?? [];
        console.log(`Embed ${uuid}: ${chats.length} messages`);
        allChats = allChats.concat(chats);
    }

    // Group questions by month, then by session
    const byMonth = new Map();
    for (const chat of allChats) {
        const question = (chat.prompt ?? '').trim();
        if (!question) continue;
        const month = monthOf(chat.createdAt ?? chat.created_at);
        if (!byMonth.has(month)) byMonth.set(month, []);
        byMonth.get(month).push({
            date: chat.createdAt ?? chat.created_at ?? '',
            session: (chat.session_id ?? chat.sessionId ?? '?').slice(0, 8),
            question
        });
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });
    for (const [month, entries] of byMonth) {
        const lines = [
            `# Chatbot-Fragen ${month}`,
            '',
            `${entries.length} Fragen. NICHT committen (öffentliches Repo, Besucher-Privatsphäre).`,
            '',
            ...entries.map((e) => `- \`${e.session}\` ${e.question}`)
        ];
        fs.writeFileSync(path.join(OUT_DIR, `${month}.md`), lines.join('\n') + '\n');
    }

    const total = [...byMonth.values()].reduce((sum, arr) => sum + arr.length, 0);
    console.log(`Wrote ${byMonth.size} monthly file(s) to reports/chat-questions/ — ${total} questions total.`);
}

main().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
