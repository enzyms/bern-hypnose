#!/usr/bin/env node
/**
 * Mechanical half of publishing a podcast take (the publish-podcast skill does the rest).
 *
 *   node scripts/podcast.mjs list
 *       List the private R2 inbox (needs PODCAST_UPLOAD_TOKEN in .env).
 *   node scripts/podcast.mjs prepare [inbox/<key>] [--no-transcribe]
 *       Download the latest real take (or <key>), convert to loudness-normalised mono MP3,
 *       transcribe with local Whisper (German), write .podcast-work/<stamp>/meta.json.
 *   node scripts/podcast.mjs publish <workDir> <slug>
 *       Upload episode.mp3 to episodes/<slug>.mp3, archive the raw take, remove it from the
 *       inbox, check the public URL. Prints the frontmatter values for the episode .md.
 *   node scripts/podcast.mjs delete inbox/<key> --yes
 *       Remove a junk/test take from the inbox.
 *
 * R2 reads/writes go through wrangler (logged-in account); listing goes through the Worker.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const WORKER_DIR = join(ROOT, 'workers/podcast-audio');
const BUCKET = 'bern-hypnose-podcast';
const WORKER_URL = 'https://bern-hypnose-podcast-audio.bern-hypnose-podcast-audio.workers.dev';
const PUBLIC_AUDIO_BASE = 'https://bern-hypnose.ch/podcast-audio/';
const MIN_REAL_TAKE_BYTES = 50 * 1024; // smaller objects are test junk
const SLUG = /^[a-z0-9][a-z0-9-]*$/;

function env(name) {
    if (process.env[name]) return process.env[name];
    const file = join(ROOT, '.env');
    if (!existsSync(file)) return undefined;
    const line = readFileSync(file, 'utf8').split('\n').find((l) => l.startsWith(`${name}=`));
    return line?.slice(name.length + 1).trim();
}

function run(cmd, args, opts = {}) {
    const result = spawnSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });
    if (result.status !== 0) {
        throw new Error(`${cmd} ${args.join(' ')} failed (${result.status}):\n${result.stderr || result.stdout}`);
    }
    return result.stdout;
}

const wrangler = (...args) => run('npx', ['wrangler', ...args], { cwd: WORKER_DIR });

async function listInbox() {
    const token = env('PODCAST_UPLOAD_TOKEN');
    if (!token) throw new Error('PODCAST_UPLOAD_TOKEN missing in .env');
    const response = await fetch(`${WORKER_URL}/inbox/`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error(`Inbox listing failed: HTTP ${response.status}`);
    return (await response.json()).items;
}

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s) % 60).padStart(2, '0')}`;

async function cmdList() {
    const items = await listInbox();
    if (!items.length) return console.log('Inbox is empty.');
    for (const it of items) {
        const junk = it.size < MIN_REAL_TAKE_BYTES ? '  (tiny: test/junk)' : '';
        const dur = it.meta.durationSeconds ? mmss(Number(it.meta.durationSeconds)) : '?';
        const title = it.meta.title || it.meta.note || '';
        console.log(`${it.key}  ${(it.size / 1024 / 1024).toFixed(1)} MB  ${dur}  ${title ? `"${title}"` : '(no title)'}${junk}`);
    }
}

async function cmdPrepare(keyArg, { transcribe }) {
    const items = await listInbox();
    const item = keyArg
        ? items.find((it) => it.key === keyArg)
        : [...items].reverse().find((it) => it.size >= MIN_REAL_TAKE_BYTES);
    if (!item) throw new Error(keyArg ? `${keyArg} not found in inbox` : 'No real take in the inbox.');

    const stamp = basename(item.key).replace(/\.[^.]+$/, '');
    const workDir = join(ROOT, '.podcast-work', stamp);
    mkdirSync(workDir, { recursive: true });
    const rawPath = join(workDir, basename(item.key));
    const mp3Path = join(workDir, 'episode.mp3');

    console.error(`↓ ${item.key}`);
    wrangler('r2', 'object', 'get', `${BUCKET}/${item.key}`, '--remote', '--file', rawPath);

    console.error('♪ ffmpeg: mono, 44.1 kHz, loudnorm −16 LUFS, MP3 96 kbps');
    run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', rawPath,
        '-ac', '1', '-ar', '44100', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',
        '-c:a', 'libmp3lame', '-b:a', '96k', mp3Path]);
    const durationSeconds = Math.round(Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration',
        '-of', 'default=nw=1:nk=1', mp3Path]).trim()));

    let transcriptPath = null;
    if (transcribe) {
        console.error('✎ whisper (turbo, de) — a few minutes on CPU…');
        run('whisper', [mp3Path, '--model', 'turbo', '--language', 'de', '--output_format', 'txt',
            '--output_dir', workDir, '--fp16', 'False'], { maxBuffer: 64 * 1024 * 1024 });
        transcriptPath = join(workDir, 'episode.txt');
    }

    const meta = {
        inboxKey: item.key,
        title: item.meta.title || item.meta.note || '', // written by Janine on /record/ (older takes: note)
        description: item.meta.description ?? '',
        recordedAt: stamp,
        recordedAtIso: stamp.replace(/T(\d{2})-(\d{2})-(\d{2})Z$/, 'T$1:$2:$3Z'), // use as publishDate
        workDir,
        mp3Path,
        transcriptPath,
        durationSeconds,
        fileSize: statSync(mp3Path).size,
    };
    writeFileSync(join(workDir, 'meta.json'), JSON.stringify(meta, null, 2));
    console.log(JSON.stringify(meta, null, 2));
}

async function cmdPublish(workDirArg, slug) {
    if (!workDirArg || !slug) throw new Error('usage: publish <workDir> <slug>');
    if (!SLUG.test(slug)) throw new Error(`invalid slug "${slug}" (a-z, 0-9, dashes)`);
    const meta = JSON.parse(readFileSync(join(resolve(workDirArg), 'meta.json'), 'utf8'));

    const publicUrl = `${WORKER_URL}/${slug}.mp3`;
    if ((await fetch(publicUrl, { method: 'HEAD' })).status !== 404) {
        throw new Error(`episodes/${slug}.mp3 already exists — pick another slug.`);
    }

    console.error(`↑ episodes/${slug}.mp3`);
    wrangler('r2', 'object', 'put', `${BUCKET}/episodes/${slug}.mp3`, '--remote',
        '--file', meta.mp3Path, '--content-type', 'audio/mpeg');

    const rawPath = join(meta.workDir, basename(meta.inboxKey));
    console.error(`⇢ archive/${basename(meta.inboxKey)} (raw take kept privately)`);
    wrangler('r2', 'object', 'put', `${BUCKET}/archive/${basename(meta.inboxKey)}`, '--remote', '--file', rawPath);
    wrangler('r2', 'object', 'delete', `${BUCKET}/${meta.inboxKey}`, '--remote');

    const check = await fetch(publicUrl, { method: 'HEAD' });
    if (check.status !== 200) throw new Error(`Uploaded, but ${publicUrl} answers ${check.status}`);

    console.log(JSON.stringify({
        audioUrl: `${PUBLIC_AUDIO_BASE}${slug}.mp3`,
        duration: meta.durationSeconds,
        fileSize: meta.fileSize,
    }, null, 2));
}

function cmdDelete(key, flags) {
    if (!key?.startsWith('inbox/')) throw new Error('usage: delete inbox/<key> --yes');
    if (!flags.includes('--yes')) throw new Error('Refusing without --yes.');
    wrangler('r2', 'object', 'delete', `${BUCKET}/${key}`, '--remote');
    console.log(`deleted ${key}`);
}

const [command, ...rest] = process.argv.slice(2);
const flags = rest.filter((a) => a.startsWith('--'));
const args = rest.filter((a) => !a.startsWith('--'));

try {
    if (command === 'list') await cmdList();
    else if (command === 'prepare') await cmdPrepare(args[0], { transcribe: !flags.includes('--no-transcribe') });
    else if (command === 'publish') await cmdPublish(args[0], args[1]);
    else if (command === 'delete') cmdDelete(args[0], flags);
    else {
        console.error('usage: node scripts/podcast.mjs list | prepare [inbox/<key>] [--no-transcribe] | publish <workDir> <slug> | delete inbox/<key> --yes');
        process.exit(2);
    }
} catch (error) {
    console.error(`✗ ${error.message}`);
    process.exit(1);
}
