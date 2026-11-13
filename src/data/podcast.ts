import { type CollectionEntry, getCollection } from 'astro:content';

// TODO(Q4): series name and description still to be chosen with Janine.
export const podcastSeries = {
    id: 'https://bern-hypnose.ch/podcast/#series',
    url: 'https://bern-hypnose.ch/podcast/',
    name: 'Podcast von Janine Aerni',
    description:
        'Jede Woche eine kurze Botschaft von Janine Aerni: ein paar Minuten zum Durchatmen, Mut fassen und Weitergehen.',
    // Q1: keep /podcast/ out of the index during the test weeks.
    // When switching to true, also remove the /podcast/ exclusion in astro.config.mjs (sitemap filter).
    indexable: false
};

// Janine's recorder (/record/) uploads straight to the Worker (see workers/podcast-audio).
export const podcastUploadBase = 'https://bern-hypnose-podcast-audio.bern-hypnose-podcast-audio.workers.dev/inbox/';

export async function getPublishedEpisodes(): Promise<CollectionEntry<'podcast'>[]> {
    const episodes = await getCollection('podcast', ({ data }) => !data.draft);
    return episodes.sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime());
}

/** 407 → "PT6M47S" (schema.org duration) */
export function isoDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `PT${m ? `${m}M` : ''}${s || !m ? `${s}S` : ''}`;
}

/** 407 → "6:47" */
export function formatDuration(seconds: number): string {
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
