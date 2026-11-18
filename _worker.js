// Only the PayApp callback uses this worker; static pages stay on Pages' free asset routing.
const CALLBACK = '/api/payapp-feedback';
const UPSTREAM = 'https://taekilso-api-jhqz3vlila-du.a.run.app' + CALLBACK;
export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== CALLBACK) return env.ASSETS.fetch(request);
    const headers = {'Cache-Control':'no-store','Content-Type':'text/plain; charset=utf-8','X-Content-Type-Options':'nosniff'};
    if (request.method !== 'POST') return new Response('METHOD_NOT_ALLOWED',{status:405,headers});
    if (Number(request.headers.get('content-length')) > 4_500_000) return new Response('BODY_TOO_LARGE',{status:413,headers});
    try {
      // Fixed destination, no redirects, logging or caching of payment payloads.
      const upstream = await fetch(UPSTREAM,{
        method:'POST',body:request.body,
        headers:{'Content-Type':request.headers.get('content-type')||'application/x-www-form-urlencoded'},
        redirect:'manual',signal:AbortSignal.timeout(20000)
      });
      if (upstream.status >= 300 && upstream.status < 400) return new Response('UPSTREAM_ERROR',{status:502,headers});
      return new Response(upstream.body,{status:upstream.status,headers});
    } catch (_) {
      return new Response('UPSTREAM_ERROR',{status:502,headers});
    }
  }
};
