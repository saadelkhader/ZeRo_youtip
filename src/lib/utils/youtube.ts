// ─────────────────────────────────────────────────────────────
// YouTube URL parsing & metadata helpers
// ─────────────────────────────────────────────────────────────

const YOUTUBE_ID_REGEX =
  /(?:youtube\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts|live)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

/** Extract the 11-char video id from any common YouTube URL form. */
export function extractYoutubeId(input: string): string | null {
  const trimmed = input.trim();
  // Bare id pasted directly.
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  const match = trimmed.match(YOUTUBE_ID_REGEX);
  return match ? match[1] : null;
}

export function isValidYoutubeUrl(input: string): boolean {
  return extractYoutubeId(input) !== null;
}

/** Canonical watch URL for a video id. */
export function buildWatchUrl(youtubeId: string): string {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}

/** Embed URL with distraction-reducing params (no related, modest branding). */
export function buildEmbedUrl(
  youtubeId: string,
  opts: { start?: number; autoplay?: boolean } = {},
): string {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    iv_load_policy: "3",
    playsinline: "1",
  });
  if (opts.start) params.set("start", Math.floor(opts.start).toString());
  if (opts.autoplay) params.set("autoplay", "1");
  return `https://www.youtube.com/embed/${youtubeId}?${params.toString()}`;
}

export type ThumbnailQuality =
  | "default"
  | "mqdefault"
  | "hqdefault"
  | "sddefault"
  | "maxresdefault";

/** Thumbnail URL for a video id at a given quality. */
export function buildThumbnailUrl(
  youtubeId: string,
  quality: ThumbnailQuality = "hqdefault",
): string {
  return `https://i.ytimg.com/vi/${youtubeId}/${quality}.jpg`;
}

export interface YoutubeOEmbed {
  title: string;
  author_name: string;
  author_url: string;
  thumbnail_url: string;
  html: string;
}

/**
 * Fetch lightweight metadata (title, channel, thumbnail) via the public
 * oEmbed endpoint — no API key required. Returns null on failure.
 */
export async function fetchYoutubeOEmbed(
  youtubeId: string,
): Promise<YoutubeOEmbed | null> {
  try {
    const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      buildWatchUrl(youtubeId),
    )}&format=json`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as YoutubeOEmbed;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// High-level metadata extraction (validated URL → oEmbed lookup)
// ─────────────────────────────────────────────────────────────

export interface YoutubeMetadata {
  youtube_id: string;
  title: string;
  channel_name: string;
  thumbnail_url: string;
  youtube_url: string;
}

export type YoutubeMetadataErrorReason =
  | "invalid_url"
  | "not_found"
  | "network";

export type YoutubeMetadataResult =
  | { ok: true; data: YoutubeMetadata }
  | { ok: false; reason: YoutubeMetadataErrorReason; message: string };

const ERROR_MESSAGES: Record<YoutubeMetadataErrorReason, string> = {
  invalid_url: "Lien invalide. Essaie un lien YouTube standard.",
  not_found: "Vidéo introuvable. Elle est peut-être privée ou supprimée.",
  network: "Connexion impossible. Vérifie ta connexion et réessaie.",
};

/**
 * Validate a YouTube URL, then resolve its public metadata via oEmbed.
 * No API key required. Returns a discriminated result so callers can show
 * a sober, French error for each failure mode.
 */
export async function extractYouTubeMetadata(
  url: string,
): Promise<YoutubeMetadataResult> {
  const youtube_id = extractYoutubeId(url);
  if (!youtube_id) {
    return {
      ok: false,
      reason: "invalid_url",
      message: ERROR_MESSAGES.invalid_url,
    };
  }

  let oembed: YoutubeOEmbed | null;
  try {
    const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      buildWatchUrl(youtube_id),
    )}&format=json`;
    const res = await fetch(endpoint, { cache: "no-store" });
    if (res.status === 401 || res.status === 403 || res.status === 404) {
      return {
        ok: false,
        reason: "not_found",
        message: ERROR_MESSAGES.not_found,
      };
    }
    if (!res.ok) {
      return { ok: false, reason: "network", message: ERROR_MESSAGES.network };
    }
    oembed = (await res.json()) as YoutubeOEmbed;
  } catch {
    return { ok: false, reason: "network", message: ERROR_MESSAGES.network };
  }

  return {
    ok: true,
    data: {
      youtube_id,
      title: oembed.title,
      channel_name: oembed.author_name,
      // oEmbed thumbnails are mq; prefer a higher-quality canonical URL.
      thumbnail_url: buildThumbnailUrl(youtube_id, "hqdefault"),
      youtube_url: buildWatchUrl(youtube_id),
    },
  };
}
