/**
 * Routes dynamic API requests to the existing DOGEUB server while Cloudflare
 * serves the Vite-built frontend as static assets.
 *
 * API requests stay same-origin in the browser, so the Messages session cookie
 * is kept on the Cloudflare hostname and forwarded to the Railway server.
 */
export default {
  async fetch(request, env) {
    const requestUrl = new URL(request.url);

    if (requestUrl.pathname === "/api" || requestUrl.pathname.startsWith("/api/")) {
      let apiOrigin;
      try {
        apiOrigin = new URL(env.API_ORIGIN);
      } catch {
        return Response.json(
          { error: "The DOGEUB API origin is not configured." },
          { status: 503 }
        );
      }

      if (apiOrigin.protocol !== "https:") {
        return Response.json(
          { error: "The DOGEUB API origin must use HTTPS." },
          { status: 500 }
        );
      }

      const upstreamUrl = new URL(requestUrl.pathname + requestUrl.search, apiOrigin);
      const headers = new Headers(request.headers);
      headers.delete("host");
      headers.set("x-forwarded-host", requestUrl.host);
      headers.set("x-forwarded-proto", requestUrl.protocol.slice(0, -1));

      const init = {
        method: request.method,
        headers,
        redirect: "manual"
      };
      if (request.method !== "GET" && request.method !== "HEAD") {
        init.body = request.body;
      }

      try {
        return await fetch(new Request(upstreamUrl, init));
      } catch {
        return Response.json(
          { error: "DOGEUB could not reach its API server. Please try again shortly." },
          { status: 502 }
        );
      }
    }

    return env.ASSETS.fetch(request);
  }
};
