<script lang="ts">
    import { onMount } from 'svelte';
    import { savePending, loadPending, clearPending, type PendingRecording } from '../utils/recording-store';

    type Props = { uploadBase: string };
    let { uploadBase }: Props = $props();

    type Phase = 'loading' | 'locked' | 'idle' | 'recording' | 'review' | 'uploading' | 'sent' | 'error';

    const TOKEN_KEY = 'bh-aufnahme-token';
    const MIC_KEY = 'bh-aufnahme-mic';
    const MAX_SECONDS = 600;
    const BIG_FILE_BYTES = 20 * 1024 * 1024;

    let phase = $state<Phase>('loading');
    let token = $state('');
    let codeInput = $state('');
    let codeError = $state('');
    let checkingCode = $state(false);

    let mics = $state<MediaDeviceInfo[]>([]);
    let micId = $state('');
    let elapsed = $state(0);
    let level = $state(0);
    let notice = $state('');
    let note = $state('');
    let progress = $state(0);
    let errorMessage = $state('');
    let restored = $state(false);
    let unsupported = $state(false);

    let pending = $state<PendingRecording | null>(null);
    let previewUrl = $state('');

    // Recording internals (not reactive)
    let stream: MediaStream | null = null;
    let recorder: MediaRecorder | null = null;
    let chunks: Blob[] = [];
    let startedAt = 0;
    let timer: ReturnType<typeof setInterval> | undefined;
    let audioContext: AudioContext | null = null;
    let raf = 0;
    let wakeLock: WakeLockSentinel | null = null;

    const formatTime = (seconds: number) =>
        `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

    onMount(() => {
        unsupported = !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined';
        try {
            token = localStorage.getItem(TOKEN_KEY) ?? '';
            micId = localStorage.getItem(MIC_KEY) ?? '';
        } catch {
            /* private mode: ask for the code each time */
        }

        const linkCode = takeLinkCode();

        loadPending()
            .then((saved) => {
                if (saved) {
                    setPending(saved);
                    restored = true;
                }
            })
            .catch(() => {})
            .finally(async () => {
                if (linkCode) return applyLinkCode(linkCode);
                if (!token) phase = 'locked';
                else if (!pending) phase = 'idle';
            });

        // The link may also be opened while /record/ is already open: only the hash changes.
        const onHashChange = () => {
            const code = takeLinkCode();
            if (code && phase !== 'recording' && phase !== 'uploading') applyLinkCode(code);
        };
        window.addEventListener('hashchange', onHashChange);

        const onVisibility = () => {
            if (document.visibilityState === 'hidden' && phase === 'recording') {
                notice = 'Die Aufnahme wurde beendet, weil die Seite in den Hintergrund ging.';
                stopRecording();
            }
            if (document.visibilityState === 'visible' && phase === 'recording') requestWakeLock();
        };
        document.addEventListener('visibilitychange', onVisibility);
        // Device labels are only exposed once mic permission was granted (then the USB receiver shows up).
        if (!unsupported) {
            refreshMics();
            navigator.mediaDevices.addEventListener('devicechange', refreshMics);
        }
        return () => {
            window.removeEventListener('hashchange', onHashChange);
            document.removeEventListener('visibilitychange', onVisibility);
            if (!unsupported) navigator.mediaDevices.removeEventListener('devicechange', refreshMics);
            teardown();
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    });

    function setPending(recording: PendingRecording | null) {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        pending = recording;
        previewUrl = recording ? URL.createObjectURL(recording.blob) : '';
        if (recording) phase = 'review';
    }

    // --- Access code -------------------------------------------------------

    /**
     * Setup link: /record/#code=<access code>. Reads the code once, then strips it from the
     * address bar and history so it does not linger in bookmarks or screenshots.
     */
    function takeLinkCode(): string {
        const code = new URLSearchParams(location.hash.slice(1)).get('code')?.trim() ?? '';
        if (code) history.replaceState(null, '', location.pathname + location.search);
        return code;
    }

    async function applyLinkCode(code: string) {
        if (code === token) {
            phase = pending ? 'review' : 'idle';
            notice = 'Zugangscode ist bereits gespeichert.';
            return;
        }
        phase = 'locked';
        await checkAndStoreCode(code);
        if (token === code) notice = 'Zugangscode gespeichert. Du kannst jetzt aufnehmen.';
    }

    async function saveCode(event: SubmitEvent) {
        event.preventDefault();
        await checkAndStoreCode(codeInput.trim());
    }

    async function checkAndStoreCode(code: string) {
        if (!code) return;
        checkingCode = true;
        codeError = '';
        try {
            const response = await fetch(`${uploadBase}auth-check`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${code}` }
            });
            if (response.status === 204) {
                token = code;
                try {
                    localStorage.setItem(TOKEN_KEY, code);
                } catch {}
                codeInput = '';
                phase = pending ? 'review' : 'idle';
            } else if (response.status === 401) {
                codeError = 'Zugangscode ungültig.';
            } else {
                codeError = `Prüfung fehlgeschlagen (${response.status}). Bitte später nochmals versuchen.`;
            }
        } catch {
            codeError = 'Keine Verbindung. Bitte Internet prüfen.';
        } finally {
            checkingCode = false;
        }
    }

    // --- Microphones -------------------------------------------------------

    async function refreshMics() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            mics = devices.filter((d) => d.kind === 'audioinput' && d.deviceId);
            if (micId && !mics.some((m) => m.deviceId === micId)) micId = '';
        } catch {
            mics = [];
        }
    }

    function chooseMic(event: Event) {
        micId = (event.currentTarget as HTMLSelectElement).value;
        try {
            localStorage.setItem(MIC_KEY, micId);
        } catch {}
    }

    // --- Recording ---------------------------------------------------------

    function pickMimeType(): string {
        const candidates = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'];
        return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? '';
    }

    async function requestWakeLock() {
        try {
            wakeLock = (await navigator.wakeLock?.request('screen')) ?? null;
        } catch {
            wakeLock = null;
        }
    }

    async function startRecording() {
        notice = '';
        errorMessage = '';
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: micId ? { exact: micId } : undefined,
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    channelCount: 1
                }
            });
        } catch (error) {
            errorMessage =
                (error as DOMException)?.name === 'NotAllowedError'
                    ? 'Kein Zugriff auf das Mikrofon. Bitte in den Browser-Einstellungen erlauben.'
                    : 'Mikrofon konnte nicht gestartet werden.';
            return;
        }
        await refreshMics();

        const mimeType = pickMimeType();
        recorder = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 128000 });
        chunks = [];
        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) chunks.push(event.data);
        };
        recorder.onstop = finishRecording;
        recorder.start(1000);

        startedAt = Date.now();
        elapsed = 0;
        timer = setInterval(() => {
            elapsed = (Date.now() - startedAt) / 1000;
            if (elapsed >= MAX_SECONDS) {
                notice = 'Maximale Länge von 10 Minuten erreicht. Die Aufnahme wurde gestoppt.';
                stopRecording();
            }
        }, 250);

        startMeter(stream);
        requestWakeLock();
        phase = 'recording';
    }

    function startMeter(source: MediaStream) {
        try {
            audioContext = new AudioContext();
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 1024;
            audioContext.createMediaStreamSource(source).connect(analyser);
            const data = new Float32Array(analyser.fftSize);
            const tick = () => {
                analyser.getFloatTimeDomainData(data);
                let sum = 0;
                for (const sample of data) sum += sample * sample;
                const rms = Math.sqrt(sum / data.length);
                level = Math.min(1, rms * 4);
                raf = requestAnimationFrame(tick);
            };
            tick();
        } catch {
            /* the meter is a nicety; recording works without it */
        }
    }

    function stopRecording() {
        if (recorder && recorder.state !== 'inactive') recorder.stop();
    }

    function teardown() {
        clearInterval(timer);
        cancelAnimationFrame(raf);
        audioContext?.close().catch(() => {});
        audioContext = null;
        stream?.getTracks().forEach((track) => track.stop());
        stream = null;
        wakeLock?.release().catch(() => {});
        wakeLock = null;
        level = 0;
    }

    async function finishRecording() {
        const mimeType = recorder?.mimeType || chunks[0]?.type || 'audio/webm';
        const durationSeconds = Math.round((Date.now() - startedAt) / 1000);
        teardown();
        const recording: PendingRecording = {
            blob: new Blob(chunks, { type: mimeType }),
            mimeType,
            durationSeconds,
            createdAt: new Date(startedAt).toISOString()
        };
        chunks = [];
        recorder = null;
        restored = false;
        setPending(recording);
        try {
            await savePending(recording);
        } catch {
            notice = 'Achtung: Die Aufnahme konnte nicht lokal gesichert werden. Bitte gleich senden.';
        }
    }

    // --- File upload instead of recording ----------------------------------

    async function chooseFile(event: Event) {
        const input = event.currentTarget as HTMLInputElement;
        const file = input.files?.[0];
        input.value = '';
        if (!file) return;
        const durationSeconds = await probeDuration(file);
        const recording: PendingRecording = {
            blob: file,
            mimeType: file.type || 'audio/mpeg',
            durationSeconds,
            createdAt: new Date().toISOString(),
            fileName: file.name
        };
        restored = false;
        notice = '';
        setPending(recording);
        try {
            await savePending(recording);
        } catch {}
    }

    function probeDuration(blob: Blob): Promise<number> {
        return new Promise((resolve) => {
            const url = URL.createObjectURL(blob);
            const audio = new Audio();
            const done = (value: number) => {
                URL.revokeObjectURL(url);
                resolve(Number.isFinite(value) ? Math.round(value) : 0);
            };
            audio.preload = 'metadata';
            audio.onloadedmetadata = () => done(audio.duration);
            audio.onerror = () => done(0);
            audio.src = url;
        });
    }

    // --- Review ------------------------------------------------------------

    async function discard() {
        if (!confirm('Diese Aufnahme verwerfen?')) return;
        await clearPending().catch(() => {});
        setPending(null);
        restored = false;
        notice = '';
        phase = 'idle';
    }

    // --- Upload ------------------------------------------------------------

    const EXTENSIONS: Record<string, string> = {
        'audio/webm': 'webm',
        'audio/ogg': 'ogg',
        'audio/mp4': 'm4a',
        'audio/x-m4a': 'm4a',
        'audio/m4a': 'm4a',
        'audio/aac': 'aac',
        'audio/mpeg': 'mp3',
        'audio/mp3': 'mp3',
        'audio/wav': 'wav',
        'audio/x-wav': 'wav',
        'audio/wave': 'wav'
    };

    function objectName(recording: PendingRecording): { name: string; contentType: string } {
        let contentType = recording.mimeType.split(';')[0].trim().toLowerCase();
        let extension = EXTENSIONS[contentType];
        if (!extension && recording.fileName) {
            const fromName = recording.fileName.split('.').pop()?.toLowerCase() ?? '';
            if (Object.values(EXTENSIONS).includes(fromName)) extension = fromName;
            if (!contentType.startsWith('audio/')) contentType = fromName === 'mp3' ? 'audio/mpeg' : `audio/${fromName}`;
        }
        const stamp = recording.createdAt.replace(/\.\d{3}Z$/, 'Z').replace(/:/g, '-');
        return { name: `${stamp}.${extension ?? 'webm'}`, contentType };
    }

    function send() {
        if (!pending) return;
        const recording = pending;
        const { name, contentType } = objectName(recording);
        phase = 'uploading';
        progress = 0;
        errorMessage = '';

        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadBase + name);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Content-Type', contentType);
        xhr.setRequestHeader('X-Podcast-Note', encodeURIComponent(note.trim()));
        xhr.setRequestHeader('X-Podcast-Duration', String(recording.durationSeconds));
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) progress = Math.round((event.loaded / event.total) * 100);
        };
        xhr.onload = async () => {
            if (xhr.status === 201 || xhr.status === 409) {
                // 409: already stored by an earlier attempt whose answer got lost.
                let topic: string | null = null;
                try {
                    topic = JSON.parse(xhr.responseText).notifyTopic ?? null;
                } catch {}
                if (xhr.status === 201 && topic) await notify(topic, recording.durationSeconds, note.trim());
                await clearPending().catch(() => {});
                setPending(null);
                note = '';
                restored = false;
                phase = 'sent';
            } else if (xhr.status === 401) {
                try {
                    localStorage.removeItem(TOKEN_KEY);
                } catch {}
                token = '';
                codeError = 'Der Zugangscode ist nicht mehr gültig. Bitte neu eingeben.';
                phase = 'locked';
            } else if (xhr.status === 413) {
                fail('Die Datei ist zu gross (max. 100 MB).');
            } else {
                fail(`Senden fehlgeschlagen (Fehler ${xhr.status}). Die Aufnahme ist gesichert.`);
            }
        };
        xhr.onerror = () => fail('Keine Verbindung. Die Aufnahme ist gesichert – bitte erneut senden.');
        xhr.send(recording.blob);
    }

    function fail(message: string) {
        errorMessage = message;
        phase = 'error';
    }

    async function notify(topic: string, durationSeconds: number, text: string) {
        // JSON publish to the ntfy root keeps this a "simple" CORS request (no preflight).
        try {
            await fetch('https://ntfy.sh/', {
                method: 'POST',
                body: JSON.stringify({
                    topic,
                    title: 'Bern Hypnose Podcast',
                    message: `Neue Aufnahme von Janine (${formatTime(durationSeconds)})${text ? `: ${text}` : ''}`,
                    tags: ['microphone']
                })
            });
        } catch {
            /* best effort: the recording is already safe in R2 */
        }
    }

    function newRecording() {
        notice = '';
        phase = 'idle';
    }
</script>

<div class="flex flex-col gap-6">
    {#if unsupported}
        <p class="rounded-xl bg-yellow-100 p-4 text-yellow-900">
            Dieser Browser kann nicht direkt aufnehmen. Du kannst aber eine Audiodatei auswählen und senden.
        </p>
    {/if}

    {#if notice}
        <p class="rounded-xl bg-white/70 p-4" role="status">{notice}</p>
    {/if}

    {#if phase === 'loading'}
        <p class="opacity-70">Einen Moment…</p>
    {:else if phase === 'locked'}
        <form class="flex flex-col gap-3" onsubmit={saveCode}>
            <label for="code" class="font-bold">Zugangscode</label>
            <input
                id="code"
                type="password"
                autocomplete="current-password"
                bind:value={codeInput}
                class="rounded-xl border border-gray-300 p-4 text-lg"
            />
            {#if codeError}<p class="text-red-700" role="alert">{codeError}</p>{/if}
            <button type="submit" disabled={checkingCode} class="btn-main">
                {checkingCode ? 'Wird geprüft…' : 'Speichern'}
            </button>
            <p class="text-sm opacity-70">Der Code wird nur einmal eingegeben und auf diesem Gerät gespeichert.</p>
        </form>
    {:else if phase === 'idle'}
        {#if mics.length > 1}
            <label class="flex flex-col gap-2">
                <span class="font-bold">Mikrofon</span>
                <select class="rounded-xl border border-gray-300 p-3" value={micId} onchange={chooseMic}>
                    <option value="">Standard</option>
                    {#each mics as mic (mic.deviceId)}
                        <option value={mic.deviceId}>{mic.label || 'Mikrofon'}</option>
                    {/each}
                </select>
            </label>
        {/if}
        {#if errorMessage}<p class="text-red-700" role="alert">{errorMessage}</p>{/if}
        {#if !unsupported}
            <button type="button" class="btn-main btn-big" onclick={startRecording}>
                <span class="dot" aria-hidden="true"></span> Aufnehmen
            </button>
        {/if}
        <label class="btn-secondary">
            Datei wählen
            <input type="file" accept="audio/*" class="sr-only" onchange={chooseFile} />
        </label>
    {:else if phase === 'recording'}
        <div class="flex flex-col items-center gap-4">
            <p class="text-6xl font-black tabular-nums" aria-live="off">{formatTime(elapsed)}</p>
            <div class="h-3 w-full overflow-hidden rounded-full bg-gray-200" aria-hidden="true">
                <div class="h-full bg-red-500 transition-[width] duration-75" style={`width: ${Math.round(level * 100)}%`}></div>
            </div>
            <p class="text-sm opacity-70">Aufnahme läuft · max. 10 Minuten</p>
        </div>
        <button type="button" class="btn-main btn-big" onclick={stopRecording}>
            <span class="square" aria-hidden="true"></span> Stopp
        </button>
    {:else if phase === 'review' || phase === 'error'}
        {#if restored}
            <p class="rounded-xl bg-white/70 p-4" role="status">Unversendete Aufnahme gefunden.</p>
        {/if}
        {#if pending}
            <div class="flex flex-col gap-2">
                <p class="font-bold">
                    Anhören · {formatTime(pending.durationSeconds)}
                    {#if pending.fileName}<span class="font-normal opacity-70"> · {pending.fileName}</span>{/if}
                </p>
                <!-- svelte-ignore a11y_media_has_caption -->
                <audio controls src={previewUrl} class="w-full"></audio>
            </div>
            <label class="flex flex-col gap-2">
                <span class="font-bold">Notiz <span class="font-normal opacity-70">(optional, z. B. Arbeitstitel)</span></span>
                <input type="text" maxlength="500" bind:value={note} class="rounded-xl border border-gray-300 p-3" />
            </label>
            {#if pending.blob.size > BIG_FILE_BYTES}
                <p class="text-sm opacity-70">Grosse Datei ({Math.round(pending.blob.size / 1024 / 1024)} MB) – am besten im WLAN senden.</p>
            {/if}
            {#if errorMessage}<p class="text-red-700" role="alert">{errorMessage}</p>{/if}
            <button type="button" class="btn-main btn-big" onclick={send}>
                {phase === 'error' ? 'Erneut senden' : 'Senden'}
            </button>
            <button type="button" class="btn-secondary" onclick={discard}>Verwerfen und neu aufnehmen</button>
        {/if}
    {:else if phase === 'uploading'}
        <div class="flex flex-col gap-3" role="status">
            <p class="font-bold">Wird gesendet… {progress}%</p>
            <div class="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                <div class="h-full bg-red-500" style={`width: ${progress}%`}></div>
            </div>
            <p class="text-sm opacity-70">Bitte die Seite offen lassen.</p>
        </div>
    {:else if phase === 'sent'}
        <div class="flex flex-col gap-4" role="status">
            <p class="text-2xl font-black">Gesendet. Danke!</p>
            <p>Sylvain wurde benachrichtigt und kümmert sich um die Veröffentlichung.</p>
            <button type="button" class="btn-secondary" onclick={newRecording}>Neue Aufnahme</button>
        </div>
    {/if}
</div>

<style>
    .btn-main,
    .btn-secondary {
        display: flex;
        min-height: 3rem;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        border-radius: 9999px;
        padding: 0.75rem 1.5rem;
        font-weight: 700;
        cursor: pointer;
    }
    .btn-main {
        background: rgb(239 68 68);
        color: white;
    }
    .btn-main:disabled {
        opacity: 0.6;
    }
    .btn-secondary {
        border: 2px solid rgb(239 68 68);
        color: rgb(185 28 28);
        background: white;
    }
    .btn-big {
        min-height: 5rem;
        font-size: 1.5rem;
    }
    .btn-main:focus-visible,
    .btn-secondary:focus-within {
        outline: 3px solid rgb(185 28 28);
        outline-offset: 3px;
    }
    .dot {
        width: 1.25rem;
        height: 1.25rem;
        border-radius: 9999px;
        background: white;
    }
    .square {
        width: 1.1rem;
        height: 1.1rem;
        background: white;
    }
</style>
