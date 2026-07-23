/**
 * Forwarding proxy for the umami collect endpoint.
 *
 * A plain Netlify redirect makes umami geolocate every visitor to the
 * Netlify edge node (Germany) — this function forwards the visitor's real
 * IP via X-Forwarded-For so country stats are correct, and passes the
 * User-Agent through for browser/device detection.
 */
export default async (req, context) => {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    const body = await req.text();
    const res = await fetch('https://cloud.umami.is/api/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': req.headers.get('user-agent') ?? '',
            'X-Forwarded-For': context.ip ?? req.headers.get('x-nf-client-connection-ip') ?? ''
        },
        body
    });

    // umami returns a cache token the tracker reuses — pass it through verbatim
    return new Response(await res.text(), {
        status: res.status,
        headers: { 'Content-Type': res.headers.get('content-type') ?? 'text/plain' }
    });
};

export const config = { path: '/stats/api/send' };
