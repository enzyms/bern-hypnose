/**
 * Automatic edit of a raw podcast take, before loudness normalisation:
 *  - finds speech with an adaptive threshold (noise floor vs. voice level, per 50 ms frame),
 *  - trims the start and the end (keeps a short breath before the first word and after the last),
 *  - ignores tiny blips at the edges (button clicks, phone handling),
 *  - shortens long pauses inside the take,
 *  - joins the kept parts with short fades so the cuts don't click.
 * Returns the ffmpeg filter for the kept parts plus a report for Sylvain.
 */
import { spawnSync } from 'node:child_process';

const FRAME = 0.05; // seconds per analysis frame
const LEAD_IN = 0.25; // silence kept before the first word
const TAIL_OUT = 0.6; // silence kept after the last word
const MIN_EDGE_SPEECH = 0.4; // a run shorter than this at the edges is a click, not speech
const MERGE_GAP = 0.3; // gaps shorter than this are part of speech
const LONG_PAUSE = 1.4; // pauses longer than this are shortened…
const KEPT_PAUSE = 0.9; // …to this
const FADE = 0.015;

function frameLevels(input) {
    const result = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', input, '-af',
        `aformat=channel_layouts=mono,highpass=f=100,asetnsamples=n=${Math.round(48000 * FRAME)}:p=0,` +
        'astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level',
        '-ar', '48000', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
    const levels = [];
    for (const line of `${result.stdout}\n${result.stderr}`.split('\n')) {
        const match = line.match(/RMS_level=(-?[\d.]+|-inf)/);
        if (match) levels.push(match[1] === '-inf' ? -120 : Number(match[1]));
    }
    return levels;
}

const percentile = (values, p) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
};

export function planEdit(input, totalSeconds) {
    const levels = frameLevels(input);
    if (levels.length < 10) return null;
    // Browser WebM files often carry no duration: fall back to the decoded length.
    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) totalSeconds = levels.length * FRAME;

    const floor = percentile(levels, 10);
    const voice = percentile(levels, 90);
    const threshold = Math.min(-30, Math.max(-60, floor + 0.35 * (voice - floor)));

    // Speech runs, with short gaps merged
    let runs = [];
    let start = null;
    levels.forEach((level, i) => {
        if (level > threshold && start === null) start = i;
        if (level <= threshold && start !== null) {
            runs.push([start * FRAME, i * FRAME]);
            start = null;
        }
    });
    if (start !== null) runs.push([start * FRAME, levels.length * FRAME]);
    runs = runs.reduce((merged, run) => {
        const last = merged[merged.length - 1];
        if (last && run[0] - last[1] < MERGE_GAP) last[1] = run[1];
        else merged.push([...run]);
        return merged;
    }, []);

    // Drop short blips at the edges (clicks, handling noise)
    const droppedEdgeBlips = [];
    while (runs.length > 1 && runs[0][1] - runs[0][0] < MIN_EDGE_SPEECH) droppedEdgeBlips.push(runs.shift());
    while (runs.length > 1 && runs.at(-1)[1] - runs.at(-1)[0] < MIN_EDGE_SPEECH) droppedEdgeBlips.push(runs.pop());
    if (!runs.length) return null;

    const firstSpeech = runs[0][0];
    const lastSpeech = runs.at(-1)[1];

    // Kept parts: speech plus breathing room; long pauses shortened
    const half = KEPT_PAUSE / 2;
    const parts = [[Math.max(0, firstSpeech - LEAD_IN), null]];
    let shortenedPauses = 0;
    for (let i = 0; i < runs.length - 1; i++) {
        const gap = runs[i + 1][0] - runs[i][1];
        if (gap > LONG_PAUSE) {
            parts.at(-1)[1] = runs[i][1] + half;
            parts.push([runs[i + 1][0] - half, null]);
            shortenedPauses++;
        }
    }
    parts.at(-1)[1] = Math.min(totalSeconds, lastSpeech + TAIL_OUT);

    const keptSeconds = parts.reduce((sum, [a, b]) => sum + (b - a), 0);
    const round = (n) => Math.round(n * 100) / 100;
    return {
        parts,
        report: {
            originalSeconds: round(totalSeconds),
            editedSeconds: round(keptSeconds),
            trimmedStart: round(parts[0][0]),
            trimmedEnd: round(totalSeconds - parts.at(-1)[1]),
            shortenedPauses,
            droppedEdgeBlips: droppedEdgeBlips.length,
            // Speech right at the very start/end of the raw file may mean a clipped word.
            startsAbruptly: firstSpeech < 0.15,
            endsAbruptly: totalSeconds - lastSpeech < 0.15,
            thresholdDb: round(threshold),
            noiseFloorDb: round(floor),
            voiceDb: round(voice),
        },
    };
}

/** ffmpeg filter_complex: trim each kept part, fade its edges, concatenate. */
export function editFilter(parts) {
    const chains = parts.map(([a, b], i) => {
        const length = b - a;
        return `[0:a]atrim=start=${a.toFixed(3)}:end=${b.toFixed(3)},asetpts=PTS-STARTPTS,` +
            `afade=t=in:d=${FADE},afade=t=out:st=${Math.max(0, length - FADE).toFixed(3)}:d=${FADE}[p${i}]`;
    });
    const inputs = parts.map((_, i) => `[p${i}]`).join('');
    return `${chains.join(';')};${inputs}concat=n=${parts.length}:v=0:a=1[cut]`;
}
