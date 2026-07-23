#!/usr/bin/env node
/**
 * Archives aggregate analytics from a umami v2 instance to
 * reports/umami-archive/ (gitignored — traffic data stays local).
 *
 * Written for the July 2026 migration off the old self-hosted (Vercel)
 * instance to Umami Cloud; also reusable yearly against Cloud before its
 * 1-year retention deletes history (set env vars accordingly).
 *
 * Env: UMAMI_OLD_URL, UMAMI_OLD_USERNAME, UMAMI_OLD_PASSWORD
 * Usage: node --env-file=.env scripts/archive-umami.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'reports/umami-archive');

const BASE = (process.env.UMAMI_OLD_URL ?? '').replace(/\/$/, '');
const USER = process.env.UMAMI_OLD_USERNAME;
const PASS = process.env.UMAMI_OLD_PASSWORD;

if (!BASE || !USER || !PASS) {
    console.error('Set UMAMI_OLD_URL, UMAMI_OLD_USERNAME, UMAMI_OLD_PASSWORD in .env');
    process.exit(1);
}

async function main() {
    const loginRes = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: USER, password: PASS })
    });
    if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);
    const { token } = await loginRes.json();

    const api = async (pathname) => {
        const res = await fetch(`${BASE}/api${pathname}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(`umami API ${res.status} on ${pathname}`);
        return res.json();
    };

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
            source: BASE,
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
