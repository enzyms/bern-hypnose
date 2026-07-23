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

    // Rank data lives in the stats endpoint; its exact contract is undocumented,
    // so try the plausible variants and keep the raw dump for diagnosis.
    const today = new Date();
    const from = new Date(today.getTime() - 30 * 86400000);
    const iso = (d) => d.toISOString().slice(0, 10);
    const compact = (d) => iso(d).replaceAll('-', '');
    const attempts = [
        { label: 'POST iso', path: `/serpwatcher/trackings/${trackingId}/stats`, options: { method: 'POST', body: JSON.stringify({ from: iso(from), to: iso(today) }) } },
        { label: 'GET compact', path: `/serpwatcher/trackings/${trackingId}/stats?from=${compact(from)}&to=${compact(today)}` },
        { label: 'GET iso', path: `/serpwatcher/trackings/${trackingId}/stats?from=${iso(from)}&to=${iso(today)}` }
    ];
    let stats = null;
    for (const attempt of attempts) {
        try {
            stats = await api(attempt.path, attempt.options ?? {});
            raw.stats = stats;
            raw.statsVariant = attempt.label;
            break;
        } catch (err) {
            raw[`statsError (${attempt.label})`] = err.message;
        }
    }

    // Stats keywords carry ranks but no names — join with /detail via _id.
    const nameById = new Map((detail?.keywords ?? []).map((kw) => [kw._id, kw.kw]));

    const source = stats?.keywords ?? [];
    const keywords = source.map((kw) => ({
        keyword: nameById.get(kw._id) ?? kw.kw ?? '',
        rank: kw.rank?.last ?? null,
        rankAvg: kw.rank?.avg ?? null,
        rankBest: kw.rank?.best ?? null,
        change: kw.rank_change ?? null,
        searchVolume: kw.search_volume ?? null,
        estimatedVisits: kw.estimated_visits ?? null,
        mapPackRank: kw.map_pack?.rank != null && kw.map_pack.rank > 0 ? kw.map_pack.rank : null
    }));

    // timeframes is keyed by date — take the most recent entry
    const timeframes = stats?.stats?.timeframes ?? {};
    const lastDate = Object.keys(timeframes).sort().at(-1);
    const lastFrame = lastDate ? timeframes[lastDate] : null;

    return {
        trackingId,
        performanceIndex: lastFrame?.performance_index != null ? Math.round(lastFrame.performance_index * 10) / 10 : null,
        visibilityIndex: lastFrame?.visibility_index != null ? Math.round(lastFrame.visibility_index * 100) / 100 : null,
        estimatedVisits: lastFrame?.estimated_visits ?? null,
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
        let detail = null;
        try {
            detail = await api(`/aiwatcher/monitor/${id}`);
            raw[`aiMonitor_${id}`] = detail;
        } catch (err) {
            console.warn(`AI monitor ${id} detail failed: ${err.message}`);
        }

        // metrics.*.value is null while the current period is still collecting;
        // fall back to the newest completed timeSeries point.
        const metrics = detail?.metrics ?? {};
        const series = Array.isArray(detail?.timeSeries) ? detail.timeSeries : [];
        const lastPoint = series.at(-1) ?? {};
        const ownBrand = detail?.rankings?.brands?.find((b) => b.isMatch);

        results.push({
            id,
            name: monitor.brand ?? monitor.domain ?? String(id),
            score: metrics.score?.value ?? lastPoint.score ?? null,
            visibility: metrics.visibility?.value ?? lastPoint.visibility ?? null,
            position: metrics.position?.value ?? lastPoint.position ?? null,
            frequency: ownBrand?.frequency ?? null,
            timeSeries: series.map((p) => ({ date: p.date, score: p.score ?? null, visibility: p.visibility ?? null, position: p.position ?? null }))
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
            lines.push(
                `Performance-Index: **${snapshot.serpwatcher.performanceIndex}** · geschätzte Besuche/Monat: **${snapshot.serpwatcher.estimatedVisits ?? '–'}**`,
                ''
            );
        }
        lines.push('| Keyword | Position | Δ | Ø | Suchvolumen | Besuche (geschätzt) |', '|---|---|---|---|---|---|');
        for (const kw of snapshot.serpwatcher.keywords) {
            const delta = kw.change == null ? '–' : kw.change > 0 ? `▲ ${kw.change}` : kw.change < 0 ? `▼ ${Math.abs(kw.change)}` : '=';
            lines.push(`| ${kw.keyword} | ${kw.rank ?? '–'} | ${delta} | ${kw.rankAvg ?? '–'} | ${kw.searchVolume ?? '–'} | ${kw.estimatedVisits ?? '–'} |`);
        }
        lines.push('');
    }

    if (snapshot.aiSearch?.length) {
        lines.push('## AI Search Watcher – Sichtbarkeit in KI-Antworten', '');
        lines.push('| Monitor | Sichtbarkeit % | Ø Position | Score | Zitierungen |', '|---|---|---|---|---|');
        for (const monitor of snapshot.aiSearch) {
            lines.push(`| ${monitor.name} | ${monitor.visibility ?? '–'} | ${monitor.position ?? '–'} | ${monitor.score ?? '–'} | ${monitor.frequency ?? '–'} |`);
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
