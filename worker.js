// Semua permintaan lewat worker ini: paksa HTTPS, pasang header keamanan, dan sajikan /invoice/[nomor-struk].
const SECURITY = {
  "strict-transport-security": "max-age=31536000",
  "content-security-policy": "upgrade-insecure-requests",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
};

function secure(res, extra = {}) {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries({ ...SECURITY, ...extra })) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.protocol === "http:") {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }
    const read = request.method === "GET" || request.method === "HEAD";
    if (read && /^\/invoice\/[^/]+\/?$/.test(url.pathname)) {
      const res = await env.ASSETS.fetch(new Request(new URL("/invoice-view/", url), { method: request.method, headers: request.headers }));
      return secure(res, { "cache-control": "no-store", "x-robots-tag": "noindex, nofollow", "referrer-policy": "no-referrer" });
    }
    return secure(await env.ASSETS.fetch(request));
  },
};
