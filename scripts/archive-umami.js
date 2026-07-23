#!/usr/bin/env node
/**
 * Archives aggregate analytics from umami to a JSON file
 * (traffic data — keep out of the public repo).
 *
 * Three auth modes:
 *   Umami Cloud (free): UMAMI_SHARE_ID     — from the website's Share URL
 *                                            (cloud.umami.is → website settings
 *                                            → Share URL; ID = path segment)
 *   Umami Cloud (paid): UMAMI_API_KEY      (api.umami.is, x-umami-api-key)
 *   Self-hosted:        UMAMI_OLD_URL + UMAMI_OLD_USERNAME + UMAMI_OLD_PASSWORD
 *
 * Optional: UMAMI_ARCHIVE_DIR (default reports/umami-archive, gitignored)
 *
 * Runs quarterly via .github/workflows/umami-archive.yml against Cloud
 * (free tier deletes data older than 1 year); the self-hosted mode was
 * used for the July 2026 Vercel-instance export.
 *
 * Usage: node --env-file=.env scripts/archive-umami.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = process.env.UMAMI_ARCHIVE_DIR ?? path.join(ROOT, 'reports/umami-archive');

const SHARE_ID = process.env.UMAMI_SHARE_ID;
const CLOUD_KEY = process.env.UMAMI_API_KEY;
const BASE = (process.env.UMAMI_OLD_URL ?? '').replace(/\/$/, '');
const USER = process.env.UMAMI_OLD_USERNAME;
const PASS = process.env.UMAMI_OLD_PASSWORD;

if (!SHARE_ID && !CLOUD_KEY && !(BASE && USER && PASS)) {
    console.error('Set UMAMI_SHARE_ID (Cloud free) or UMAMI_API_KEY (Cloud paid) or UMAMI_OLD_URL/USERNAME/PASSWORD (self-hosted).');
    process.exit(1);
}

/** Share mode has no /websites listing — resolve the single site from the share token. */
let shareWebsite = null;

async function makeApi() {
    if (SHARE_ID) {
        const cloud = 'https://cloud.umami.is';
        const shareRes = await fetch(`${cloud}/api/share/${SHARE_ID}`);
        if (!shareRes.ok) throw new Error(`Share lookup failed (${shareRes.status}) — is the Share URL still enabled?`);
        const share = await shareRes.json();
        shareWebsite = { id: share.id ?? share.websiteId, name: 'bern-hypnose', domain: 'bern-hypnose.ch' };
        return async (pathname) => {
            if (pathname === '/websites') return [shareWebsite];
            const res = await fetch(`${cloud}/api${pathname}`, { headers: { 'x-umami-share-token': share.token } });
            if (!res.ok) throw new Error(`umami share API ${res.status} on ${pathname}`);
            return res.json();
        };
    }
    if (CLOUD_KEY) {
        return async (pathname) => {
            const res = await fetch(`https://api.umami.is/v1${pathname}`, { headers: { 'x-umami-api-key': CLOUD_KEY } });
            if (!res.ok) throw new Error(`umami Cloud API ${res.status} on ${pathname}`);
            return res.json();
        };
    }
    const loginRes = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: USER, password: PASS })
    });
    if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);
    const { token } = await loginRes.json();
    return async (pathname) => {
        const res = await fetch(`${BASE}/api${pathname}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(`umami API ${res.status} on ${pathname}`);
        return res.json();
    };
}

async function main() {
    const api = await makeApi();

    const websitesRes = await api('/websites');
    const websites = websitesRes?.data ?? websitesRes ?? [];
    if (!websites.length) throw new Error('No websites found');

    fs.mkdirSync(OUT_DIR, { recursive: true });
    const endAt = Date.now();

    for (const site of websites) {
        const id = site.id ?? site.websiteUuid;
        const createdAt = new Date(site.createdAt ?? '2023-01-01').getTime();
        const range = `startAt=${createdAt}&endAt=${endAt}`;
        const name = (site.name ?? id).replace(/[^a-z0-9.-]/gi, '_');
        console.log(`Archiving ${site.name} (${id}) since ${new Date(createdAt).toISOString().slice(0, 10)}…`);

        const archive = {
            exportedAt: new Date(endAt).toISOString(),
            source: CLOUD_KEY ? 'umami-cloud' : BASE,
            website: { id, name: site.name, domain: site.domain, createdAt: site.createdAt },
            stats: await api(`/websites/${id}/stats?${range}`),
            pageviewsDaily: await api(`/websites/${id}/pageviews?${range}&unit=day&timezone=Europe/Zurich`),
            topPages: await api(`/websites/${id}/metrics?${range}&type=url`),
            topReferrers: await api(`/websites/${id}/metrics?${range}&type=referrer`),
            events: await api(`/websites/${id}/metrics?${range}&type=event`).catch(() => []),
            browsers: await api(`/websites/${id}/metrics?${range}&type=browser`),
            countries: await api(`/websites/${id}/metrics?${range}&type=country`)
        };

        const file = path.join(OUT_DIR, `${name}-${new Date(endAt).toISOString().slice(0, 10)}.json`);
        fs.writeFileSync(file, JSON.stringify(archive, null, 2));

        const pv = archive.pageviewsDaily?.pageviews ?? [];
        const total = pv.reduce((sum, p) => sum + (p.y ?? 0), 0);
        console.log(`  → ${path.relative(ROOT, file)} (${pv.length} days, ${total} pageviews, ${archive.topPages?.length ?? 0} pages, ${archive.events?.length ?? 0} event types)`);
    }
}

main().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
