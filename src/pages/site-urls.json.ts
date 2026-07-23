import type { APIRoute } from 'astro';
import { getSitePaths } from '../utils/site-content';

// Whitelist of valid site pathnames, consumed by the chatbot link guardrail (Chat.svelte).
export const GET: APIRoute = async () => {
    const paths = await getSitePaths();
    return new Response(JSON.stringify(paths), {
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
};
