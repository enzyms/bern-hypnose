#!/usr/bin/env node
/**
 * Weekly SEO report: pulls SERPWatcher rankings and AI Search Watcher visibility
 * from the Mangools API, appends a snapshot to src/data/seo-metrics.json and
 * writes a human-readable report to reports/seo/YYYY-WW.md.
 *
 * Env:
 *   MANGOOLS_API_KEY      required — https://mangools.com/api (API token page)
 *   MANGOOLS_API_BASE     optional — default https://api.mangools.com/v3
 *   MANGOOLS_TRACKING_ID  optional — skip tracking auto-discovery
 *
 * Usage: node scripts/seo-report.js [--dry-run]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const METRICS_FILE = path.join(ROOT, 'src/data/seo-metrics.json');
const REPORTS_DIR = path.join(ROOT, 'reports/seo');
const RAW_DEBUG_FILE = path.join(REPORTS_DIR, 'raw-last.json');

const API_BASE = process.env.MANGOOLS_API_BASE ?? 'https://api.mangools.com/v3';
const API_KEY = process.env.MANGOOLS_API_KEY;
const DOMAIN = 'bern-hypnose.ch';
const DRY_RUN = process.argv.includes('--dry-run');

if (!API_KEY) {
    console.error('MANGOOLS_API_KEY is not set. Get it from https://mangools.com/api');
    process.exit(1);
}

async function api(pathname, options = {}) {
    const url = `${API_BASE}${pathname}`;
    const res = await fetch(url, {
        ...options,
        headers: {
            'x-access-token': API_KEY,
            'Content-Type': 'application/json',
            ...(options.headers ?? {})
        }
    });
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Mangools API ${res.status} on ${pathname}: ${body.slice(0, 300)}`);
    }
    return res.json();
}

function isoWeek(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

async function fetchSerpwatcher(raw) {
    let trackingId = process.env.MANGOOLS_TRACKING_ID;
    if (!trackingId) {
        const trackings = await api('/serpwatcher/trackings');
        raw.trackings = trackings;
        const list = Array.isArray(trackings) ? trackings : (trackings?.trackings ?? []);
        const match = list.find((t) => (t.domain ?? t.url ?? '').includes(DOMAIN)) ?? list[0];
        if (!match) throw new Error('No SERPWatcher tracking found — create one for bern-hypnose.ch in the Mangools app first.');
        trackingId = match._id ?? match.id;
        console.log(`Using tracking ${trackingId} (${match.domain ?? match.url ?? 'unknown domain'})`);
    }

    const detail = await api(`/serpwatcher/trackings/${trackingId}/detail`);
    raw.trackingDetail = detail;

    const keywords = (detail?.tracked_keywords ?? detail?.keywords ?? []).map((kw) => ({
        keyword: kw.kw ?? kw.keyword ?? '',
        rank: kw.rank?.value ?? kw.rank ?? null,
        rankAvg: kw.rank_avg ?? null,
        change: kw.rank_change ?? kw.change ?? null,
        searchVolume: kw.search_volume ?? kw.sv ?? null
    }));

    return {
        trackingId,
        performanceIndex: detail?.performance_index ?? detail?.pi ?? null,
        keywords
    };
}

async function fetchAiWatcher(raw) {
    const monitors = await api('/aiwatcher/monitors');
    raw.aiMonitors = monitors;
    const list = Array.isArray(monitors) ? monitors : (monitors?.monitors ?? []);
    const results = [];
    for (const monitor of list) {
        const id = monitor._id ?? monitor.id;
        let detail = monitor;
        try {
            detail = await api(`/aiwatcher/monitor/${id}`);
            raw[`aiMonitor_${id}`] = detail;
        } catch (err) {
            console.warn(`AI monitor ${id} detail failed: ${err.message}`);
        }
        results.push({
            id,
            name: monitor.name ?? monitor.domain ?? String(id),
            visibility: detail?.visibility ?? detail?.share_of_voice ?? detail?.stats?.visibility ?? null,
            mentions: detail?.mentions ?? detail?.stats?.mentions ?? null,
            promptCount: detail?.prompts_count ?? detail?.prompts?.length ?? null
        });
    }
    return results;
}

function formatReport(snapshot) {
    const lines = [
        `# SEO-Report ${snapshot.week} (${snapshot.date})`,
        '',
        `Domain: ${DOMAIN}`,
        ''
    ];

    if (snapshot.serpwatcher) {
        lines.push('## SERPWatcher – Rankings', '');
        if (snapshot.serpwatcher.performanceIndex != null) {
            lines.push(`Performance-Index: **${snapshot.serpwatcher.performanceIndex}**`, '');
        }
        lines.push('| Keyword | Position | Δ | Suchvolumen |', '|---|---|---|---|');
        for (const kw of snapshot.serpwatcher.keywords) {
            const delta = kw.change == null ? '–' : kw.change > 0 ? `▲ ${kw.change}` : kw.change < 0 ? `▼ ${Math.abs(kw.change)}` : '=';
            lines.push(`| ${kw.keyword} | ${kw.rank ?? '–'} | ${delta} | ${kw.searchVolume ?? '–'} |`);
        }
        lines.push('');
    }

    if (snapshot.aiSearch?.length) {
        lines.push('## AI Search Watcher – Sichtbarkeit in KI-Antworten', '');
        lines.push('| Monitor | Sichtbarkeit | Erwähnungen | Prompts |', '|---|---|---|---|');
        for (const monitor of snapshot.aiSearch) {
            lines.push(`| ${monitor.name} | ${monitor.visibility ?? '–'} | ${monitor.mentions ?? '–'} | ${monitor.promptCount ?? '–'} |`);
        }
        lines.push('');
    }

    lines.push('---', '_Automatisch generiert von scripts/seo-report.js_', '');
    return lines.join('\n');
}

async function main() {
    const now = new Date();
    const raw = {};
    const snapshot = {
        date: now.toISOString().slice(0, 10),
        week: isoWeek(now),
        serpwatcher: null,
        aiSearch: null
    };

    try {
        snapshot.serpwatcher = await fetchSerpwatcher(raw);
        console.log(`SERPWatcher: ${snapshot.serpwatcher.keywords.length} keywords`);
    } catch (err) {
        console.error(`SERPWatcher failed: ${err.message}`);
    }

    try {
        snapshot.aiSearch = await fetchAiWatcher(raw);
        console.log(`AI Search Watcher: ${snapshot.aiSearch.length} monitors`);
    } catch (err) {
        console.error(`AI Search Watcher failed: ${err.message}`);
    }

    if (!snapshot.serpwatcher && !snapshot.aiSearch) {
        console.error('Both API calls failed — nothing to write.');
        process.exit(1);
    }

    fs.mkdirSync(REPORTS_DIR, { recursive: true });
    fs.writeFileSync(RAW_DEBUG_FILE, JSON.stringify(raw, null, 2));

    if (DRY_RUN) {
        console.log(JSON.stringify(snapshot, null, 2));
        return;
    }

    const metrics = fs.existsSync(METRICS_FILE) ? JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8')) : { snapshots: [] };
    metrics.snapshots = metrics.snapshots.filter((s) => s.week !== snapshot.week);
    metrics.snapshots.push(snapshot);
    metrics.snapshots.sort((a, b) => a.date.localeCompare(b.date));
    fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2) + '\n');

    const reportPath = path.join(REPORTS_DIR, `${snapshot.week}.md`);
    fs.writeFileSync(reportPath, formatReport(snapshot));
    console.log(`Wrote ${reportPath} and updated ${path.relative(ROOT, METRICS_FILE)}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
