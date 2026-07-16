import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk@0.70.0";

// ==========================================================================
// mr-resolve — Revelación musical, pasos 2-4.
// Artista tecleado a ciegas -> Haiku 4.5 + web search (nombre + canción más
// popular actual + estimación del inicio del estribillo) -> YouTube Data API
// (vídeo más reproducido + duración) -> arranque justo ANTES DEL ESTRIBILLO
// (acotado por la duración) -> caché con caducidad -> envío al espectador.
// La clave de API nunca está en el cliente.
// ==========================================================================

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const CACHE_DAYS = parseInt(Deno.env.get("MR_CACHE_DAYS") || "30", 10);
const MONTHLY_LIMIT = parseInt(Deno.env.get("MR_MONTHLY_LIMIT") || "300", 10);
const CHORUS_LEAD = parseInt(Deno.env.get("MR_CHORUS_LEAD") || "5", 10); // segundos antes del pico

const admin = createClient(SB_URL, SERVICE_KEY, { auth: { persistSession: false } });

let secretsCache: Record<string, string> | null = null;
async function getSecret(name: string): Promise<string | null> {
  const env = Deno.env.get(name);
  if (env) return env;
  if (!secretsCache) {
    const { data } = await admin.from("app_secrets").select("key,value");
    secretsCache = {};
    for (const row of data || []) secretsCache[row.key] = row.value;
  }
  return secretsCache[name] || null;
}

function normalize(s: string): string {
  return (s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function parseISODuration(iso: string): number {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || "");
  if (!m) return 0;
  return (parseInt(m[1] || "0", 10) * 3600) + (parseInt(m[2] || "0", 10) * 60) + parseInt(m[3] || "0", 10);
}

// ---- Haiku 4.5 + web search: corrige el nombre, da la canción más popular hoy y
// estima el segundo donde ENTRA EL ESTRIBILLO (paso 4). No se puede leer el mapa
// "momentos más reproducidos" de YouTube desde el servidor (YouTube bloquea las IPs
// de centros de datos con 429), así que el arranque lo estima la IA (con web search)
// y se acota por la duración real del vídeo.
async function askClaude(raw: string): Promise<{ artist: string; song: string; chorus: number; tokens: number } | null> {
  const key = await getSecret("ANTHROPIC_API_KEY");
  if (!key) return null;
  const anthropic = new Anthropic({ apiKey: key, maxRetries: 1, timeout: 15000 });
  const prompt =
    "A magician typed a music artist's name blindly (screen hidden), so it may have typos or missing accents: \"" +
    raw.slice(0, 80) +
    "\".\n" +
    "Do ONE web search to (a) identify the real music artist this most likely refers to, (b) find that artist's single MOST POPULAR / most-streamed song RIGHT NOW (current, not historical), and (c) estimate chorus_seconds: the integer number of seconds into that song's official studio version where the main chorus/hook FIRST starts (0 if unsure).\n" +
    "Reply with ONLY one compact JSON object, no prose:\n" +
    '{"is_music": true, "artist": "canonical artist name", "song": "current most popular song title", "chorus_seconds": 48}\n' +
    'If it is not a real music artist, reply {"is_music": false, "artist": "", "song": "", "chorus_seconds": 0}.';
  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 320,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 1 } as any],
      messages: [{ role: "user", content: prompt }],
    });
    const text = (msg.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n");
    const tokens = ((msg.usage && (msg.usage.input_tokens + msg.usage.output_tokens)) || 0) as number;
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const obj = JSON.parse(m[0]);
    if (!obj || obj.is_music === false || !obj.artist) return null;
    const chorus = Math.max(0, Math.floor(Number(obj.chorus_seconds) || 0));
    return { artist: String(obj.artist).trim(), song: String(obj.song || "").trim(), chorus, tokens };
  } catch (_e) {
    return null;
  }
}

// ---- YouTube Data API: vídeo real de la canción, el de más reproducciones + duración.
async function askYouTube(artist: string, song: string): Promise<{ videoId: string; title: string; duration: number } | null> {
  const key = await getSecret("YOUTUBE_API_KEY");
  if (!key) return null;
  const q = (song ? artist + " " + song : artist).trim();
  const searchUrl =
    "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&order=relevance&maxResults=6&q=" +
    encodeURIComponent(q) + "&key=" + key;
  try {
    const sr = await fetch(searchUrl);
    if (!sr.ok) return null;
    const sj = await sr.json();
    const ids: string[] = (sj.items || []).map((it: any) => it.id && it.id.videoId).filter(Boolean);
    if (!ids.length) return null;
    const statUrl =
      "https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=" +
      ids.join(",") + "&key=" + key;
    const vr = await fetch(statUrl);
    if (!vr.ok) return { videoId: ids[0], title: "", duration: 0 };
    const vj = await vr.json();
    let best: any = null;
    let bestViews = -1;
    for (const it of vj.items || []) {
      const views = parseInt((it.statistics && it.statistics.viewCount) || "0", 10) || 0;
      if (views > bestViews) { bestViews = views; best = it; }
    }
    if (!best) return { videoId: ids[0], title: "", duration: 0 };
    return {
      videoId: best.id,
      title: (best.snippet && best.snippet.title) || "",
      duration: parseISODuration(best.contentDetails && best.contentDetails.duration),
    };
  } catch (_e) {
    return null;
  }
}

// ---- Arranque justo ANTES del estribillo. Se usa la estimación de la IA si es
// plausible (acotada por la duración del vídeo) y se resta CHORUS_LEAD segundos para
// entrar con un pequeño impulso; si no, una heurística por duración (~20% del tema).
function chorusStart(claudeChorus: number, duration: number): { start: number; source: string } {
  const upper = duration > 0 ? duration - 8 : 240;
  // La estimación de la IA es válida si cae dentro del cuerpo de la canción.
  if (claudeChorus >= 10 && claudeChorus <= upper) {
    let s = claudeChorus - CHORUS_LEAD;
    if (s < 0) s = 0;
    return { start: s, source: "ai" };
  }
  if (duration > 0) {
    let s = Math.round(duration * 0.2);
    if (s < 20) s = 20;
    if (s > 75) s = 75;
    if (s > upper) s = Math.max(0, upper);
    return { start: s, source: "heuristic" };
  }
  return { start: 0, source: "none" };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, reason: "method" }, 405);

  const authHeader = req.headers.get("Authorization") || "";
  const asUser = createClient(SB_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: ures } = await asUser.auth.getUser();
  const uid = ures && ures.user && ures.user.id;
  if (!uid) return json({ ok: false, reason: "auth" }, 401);

  let body: any = {};
  try { body = await req.json(); } catch (_e) { /* vacío */ }
  const raw = String((body && body.artist) || "");
  const norm = normalize(raw);
  if (!norm) return json({ ok: false, reason: "empty" }, 400);

  const monthStart = new Date();
  monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
  const { count } = await admin
    .from("music_reveal_usage")
    .select("id", { count: "exact", head: true })
    .eq("magician", uid).eq("action", "resolve").eq("cache_hit", false)
    .gte("created_at", monthStart.toISOString());
  if ((count || 0) >= MONTHLY_LIMIT) return json({ ok: false, reason: "limit" }, 429);

  let artistName = "", songTitle = "", videoId = "", startSeconds = 0, chorusSource = "cache";
  let cacheHit = false, tokens = 0, openaiCalls = 0, ytQueries = 0;
  const { data: cached } = await admin
    .from("music_reveal_artists")
    .select("artist_name,song_title,youtube_video_id,preferred_start_seconds,chorus_start_seconds,expires_at")
    .eq("normalized_name", norm).gt("expires_at", new Date().toISOString())
    .not("youtube_video_id", "is", null).maybeSingle();

  if (cached && cached.youtube_video_id) {
    cacheHit = true;
    artistName = cached.artist_name; songTitle = cached.song_title || ""; videoId = cached.youtube_video_id;
    const cs = (cached.preferred_start_seconds != null ? cached.preferred_start_seconds : cached.chorus_start_seconds);
    startSeconds = (cs != null ? cs : 0) as number;
  } else {
    const c = await askClaude(raw);
    if (!c) {
      await admin.from("music_reveal_usage").insert({ magician: uid, action: "resolve", cache_hit: false, openai_calls: 1 });
      return json({ ok: false, reason: "not_music" });
    }
    openaiCalls = 1; tokens = c.tokens; artistName = c.artist; songTitle = c.song;
    const y = await askYouTube(c.artist, c.song);
    ytQueries = y ? 1 : 0;
    if (!y) {
      await admin.from("music_reveal_usage").insert({ magician: uid, action: "resolve", cache_hit: false, openai_calls: 1, openai_tokens: tokens });
      return json({ ok: false, reason: "no_video", artist_name: artistName });
    }
    videoId = y.videoId;
    if (y.title) songTitle = songTitle || y.title;
    // Paso 4: arranque justo antes del estribillo (estimación IA acotada por duración).
    const ch = chorusStart(c.chorus, y.duration);
    startSeconds = ch.start; chorusSource = ch.source;
    const expires = new Date(Date.now() + CACHE_DAYS * 86400000).toISOString();
    await admin.from("music_reveal_artists").upsert({
      normalized_name: norm, artist_name: artistName, song_title: songTitle,
      youtube_video_id: videoId, youtube_url: "https://www.youtube.com/watch?v=" + videoId,
      chorus_start_seconds: startSeconds, preferred_start_seconds: startSeconds,
      confidence: 0.9, verified: false, last_verified_at: new Date().toISOString(),
      expires_at: expires, updated_at: new Date().toISOString(),
    }, { onConflict: "normalized_name" });
  }

  const reveal = { video_id: videoId, start_seconds: startSeconds, youtube_url: "https://www.youtube.com/watch?v=" + videoId + "&t=" + startSeconds + "s" };
  const { data: sent } = await admin.rpc("mr_deliver_reveal", { p_magician: uid, p_reveal: reveal });
  const delivered = sent && sent.sent;

  await admin.from("music_reveal_usage").insert({
    magician: uid, action: "resolve", cache_hit: cacheHit,
    openai_calls: openaiCalls, openai_tokens: tokens, youtube_queries: ytQueries,
  });

  return json({
    ok: true, cached: cacheHit, sent: !!delivered,
    artist_name: artistName, song_title: songTitle, video_id: videoId,
    start_seconds: startSeconds, chorus_source: chorusSource,
    rev: (sent && sent.rev) || 0,
  });
});
