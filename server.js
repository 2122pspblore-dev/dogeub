import dotenv from "dotenv";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import compress from "@fastify/compress";
import fastifyCookie from "@fastify/cookie";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { logging, server as wisp } from "@mercuryworkshop/wisp-js/server";
import { createBareServer } from "@tomphttp/bare-server-node";
import { MasqrMiddleware } from "./masqr.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = process.env.PORT || 2345;
const server = createServer();
const bare = process.env.BARE !== "false" ? createBareServer("/seal/") : null;
logging.set_level(logging.NONE);

Object.assign(wisp.options, {
  dns_method: "resolve",
  dns_servers: ["1.1.1.3", "1.0.0.3"],
  dns_result_order: "ipv4first"
});

server.on("upgrade", (req, sock, head) =>
  bare?.shouldRoute(req)
    ? bare.routeUpgrade(req, sock, head)
    : req.url.endsWith("/wisp/")
      ? wisp.routeRequest(req, sock, head)
      : sock.end()
);

const app = Fastify({
  serverFactory: h => (
    server.on("request", (req, res) =>
      bare?.shouldRoute(req) ? bare.routeRequest(req, res) : h(req, res)
    ),
    server
  ),
  logger: false,
  keepAliveTimeout: 30000,
  connectionTimeout: 60000,
  forceCloseConnections: true
});

await app.register(fastifyCookie);
await app.register(compress, { global: true, encodings: ['gzip','deflate','br'] });

app.register(fastifyStatic, {
  root: join(__dirname, "dist"),
  prefix: "/",
  decorateReply: true,
  etag: true,
  lastModified: true,
  cacheControl: true,
  setHeaders(res, path) {
    if (path.endsWith(".html")) {
      res.setHeader("Cache-Control", "no-cache, must-revalidate");
    } else if (/\.[a-f0-9]{8,}\./.test(path)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    } else {
      res.setHeader("Cache-Control", "public, max-age=3600");
    }
  }
});

if (process.env.MASQR === "true")
  app.addHook("onRequest", MasqrMiddleware);

const proxy = (url, type = "application/javascript") => async (req, reply) => {
  try {
    const res = await fetch(url(req));
    if (!res.ok) return reply.code(res.status).send();

    const hop = [
      "connection",
      "keep-alive",
      "proxy-authenticate",
      "proxy-authorization",
      "te",
      "trailer",
      "transfer-encoding",
      "upgrade",
      "content-encoding"
    ];
    for (const [k, v] of res.headers) {
      if (!hop.includes(k.toLowerCase())) reply.header(k, v);
    }

    if (res.headers.getSetCookie) {
      const cookies = res.headers.getSetCookie();
      if (cookies.length) reply.header("set-cookie", cookies);
    }

    if (!res.headers.get("content-type")) reply.type(type);

    return reply.send(res.body);
  } catch {
    return reply.code(500).send();
  }
};

app.get("/assets/img/*", proxy(req => `https://dogeub-assets.pages.dev/img/${req.params["*"]}`, ""));
app.get("/assets-fb/*", proxy(req => `https://dogeub-assets.pages.dev/img/server/${req.params["*"]}`, ""));
app.get("/js/script.js", proxy(() => "https://byod.privatedns.org/js/script.js"));
app.get("/ds", (req, res) => res.redirect("https://discord.gg/ZBef7HnAeg"));
app.get("/return", async (req, reply) =>
  req.query?.q
    ? fetch(`https://duckduckgo.com/ac/?q=${encodeURIComponent(req.query.q)}`)
        .then(r => r.json())
        .catch(() => reply.code(500).send({ error: "request failed" }))
    : reply.code(401).send({ error: "query parameter?" })
);


const aiRequestWindows = new Map();

app.post("/api/ai/chat", async (req, reply) => {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    return reply.code(503).send({ error: "AI assistant is not configured yet. The site owner needs to add AI_API_KEY to the server environment." });
  }

  // A small per-IP limit helps prevent accidental or abusive API spend.
  const now = Date.now();
  const clientIp = req.ip || req.raw.socket.remoteAddress || "unknown";
  const window = aiRequestWindows.get(clientIp);
  if (window && now - window.startedAt < 60000 && window.count >= 8) {
    return reply.code(429).send({ error: "Too many AI requests. Please wait a minute and try again." });
  }
  aiRequestWindows.set(clientIp, window && now - window.startedAt < 60000
    ? { startedAt: window.startedAt, count: window.count + 1 }
    : { startedAt: now, count: 1 });
  if (aiRequestWindows.size > 10000) {
    for (const [ip, item] of aiRequestWindows) {
      if (now - item.startedAt >= 60000) aiRequestWindows.delete(ip);
    }
  }

  const body = req.body;
  if (!body || !Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 20) {
    return reply.code(400).send({ error: "Send between 1 and 20 messages." });
  }

  const messages = [];
  for (const message of body.messages) {
    if (!message || !["user", "assistant"].includes(message.role) ||
        typeof message.content !== "string" || !message.content.trim() ||
        message.content.length > 6000) {
      return reply.code(400).send({ error: "Each message must have a valid role and text under 6,000 characters." });
    }
    messages.push({ role: message.role, content: message.content.trim() });
  }

  try {
    const upstream = await fetch(process.env.AI_API_URL || "https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are DogeUB AI, a helpful, friendly assistant. Give clear, practical answers. For schoolwork, help the user learn instead of just doing all the work for them. Never ask for passwords, API keys, or other secrets." },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1200
      }),
      signal: AbortSignal.timeout(45000)
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      req.log?.warn?.({ status: upstream.status }, "AI provider request failed");
      return reply.code(502).send({ error: "The AI provider could not complete the request. Check the server's AI settings and try again." });
    }

    const answer = data?.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim()) {
      return reply.code(502).send({ error: "The AI provider returned an empty response." });
    }
    return reply.send({ reply: answer.trim() });
  } catch {
    return reply.code(502).send({ error: "Couldn't reach the AI provider. Try again in a moment." });
  }
});

app.setNotFoundHandler((req, reply) =>
  req.raw.method === "GET" && req.headers.accept?.includes("text/html")
    ? reply.sendFile("index.html")
    : reply.code(404).send({ error: "Not Found" })
);

const host = process.env.HOST || "0.0.0.0";
app.listen({ port, host }).then(() => console.log(`Server running on ${port}`));
