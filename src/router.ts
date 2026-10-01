export interface Env {
  ASSETS: {
    fetch: (request: Request | string) => Promise<Response>;
  };
  BACKEND_SERVICE?: {
    fetch: (request: Request | string) => Promise<Response>;
  };
  BACKEND_ORIGIN?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 1. Health check endpoint
    if (pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'kitchen-bots-edge-router', timestamp: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Route /admin and /api to Payload CMS backend
    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
      // If service binding is configured
      if (env.BACKEND_SERVICE) {
        return env.BACKEND_SERVICE.fetch(request);
      }

      // If backend origin URL is configured
      if (env.BACKEND_ORIGIN) {
        const backendUrl = new URL(request.url);
        const originUrl = new URL(env.BACKEND_ORIGIN);
        backendUrl.protocol = originUrl.protocol;
        backendUrl.hostname = originUrl.hostname;
        backendUrl.port = originUrl.port;
        return fetch(new Request(backendUrl.toString(), request));
      }
    }

    // 3. Static Assets: serve Storefront SPA from ASSETS binding
    return env.ASSETS.fetch(request);
  },
};
