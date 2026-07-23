/**
 * Forwarding proxy for the umami collect endpoint.
 *
 * A plain Netlify redirect makes umami geolocate every visitor to the
 * Netlify edge node; without a forwarded IP the function's AWS runtime
 * (US) wins instead. So: resolve the real client IP from the incoming
 * request and pass it via the headers umami's request-ip resolver checks.
 *
 * GET /stats/api/send returns the resolved IP sources for debugging.
 */

function clientIp(req, context) {
    const xff = req.headers.get('x-forwarded-for') ?? '';
    return (
        context?.ip ||
        req.headers.get('x-nf-client-connection-ip') ||
        xff.split(',')[0].trim() ||
        ''
    );
}

export default async (req, context) => {
    if (req.method === 'GET') {
        return Response.json({
            resolved: clientIp(req, context),
            contextIp: context?.ip ?? null,
            nfHeader: req.headers.get('x-nf-client-connection-ip'),
            xff: req.headers.get('x-forwarded-for')
        });
    }
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    const ip = clientIp(req, context);
    const body = await req.text();
    const res = await fetch('https://cloud.umami.is/api/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': req.headers.get('user-agent') ?? '',
            // umami's request-ip checks x-client-ip before x-forwarded-for
            ...(ip ? { 'X-Client-IP': ip, 'X-Forwarded-For': ip } : {})
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
