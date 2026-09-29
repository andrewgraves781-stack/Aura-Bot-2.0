import ffmpegPath from "ffmpeg-static";
import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fetch } from "undici";
import { fileTypeFromBuffer } from "file-type";

const SONGFINDER_API = "https://songfinder.gg/api/recognize/url";
const UGUU_UPLOAD = "https://uguu.se/upload";
const CLIP_SECONDS = 60;
const MAX_INPUT_BYTES = 60 * 1024 * 1024;

const SF_HEADERS = {
  accept: "*/*",
  "accept-language": "es-419,es;q=0.9,es-ES;q=0.8,en;q=0.7",
  "content-type": "application/json",
  origin: "https://songfinder.gg",
  referer: "https://songfinder.gg/",
  "sec-ch-ua": '"Not;A=Brand";v="8", "Chromium";v="150", "Microsoft Edge";v="150"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0",
};

const execFileAsync = promisify(execFile);

function makeToken() {
  return randomBytes(24).toString("base64url");
}

async function recognizeUrl(audioUrl: string, startTime = 0): Promise<Record<string, string>> {
  const res = await fetch(SONGFINDER_API, {
    method: "POST",
    headers: SF_HEADERS,
    body: JSON.stringify({
      url: audioUrl,
      startTime,
      recaptchaToken: makeToken(),
    }),
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    // no-op
  }

  if (!res.ok) throw new Error(`SongFinder respondió HTTP ${res.status}`);
  if (!json?.success || !json?.track) {
    throw new Error(json?.message || json?.error || "No se encontró coincidencia");
  }

  const t = json.track;
  return {
    title: t.title || "",
    artist: t.artist || "",
    album: t.album || "",
    releaseDate: t.releaseDate || "",
    genre: t.genre || "",
    label: t.label || "",
    coverArt: t.coverArt || "",
    url: t.url || "",
    isrc: t.isrc || "",
  };
}

async function uploadUguu(buffer: Buffer): Promise<string> {
  const info = (await fileTypeFromBuffer(buffer)) || {
    ext: "mp3",
    mime: "audio/mpeg",
  };
  const blob = new Blob([buffer], { type: info.mime || "audio/mpeg" });
  const form = new FormData();
  form.append(
    "files[]",
    blob,
    `${randomBytes(5).toString("hex")}.${info.ext || "mp3"}`,
  );

  const res = await fetch(UGUU_UPLOAD, {
    method: "POST",
    body: form as unknown as Parameters<typeof fetch>[1]["body"],
    headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64)" },
  });
  const json = (await res.json()) as { files?: Array<{ url?: string }> };
  const url = json?.files?.[0]?.url;
  if (!url) throw new Error("uguu.se no devolvió enlace");
  return url;
}

function prepareClip(buffer: Buffer, seconds = CLIP_SECONDS): Promise<Buffer> {
  return new Promise((resolve) => {
    const tmpIn = path.join(
      path.resolve("./cache/shazam"),
      `sf_${Date.now()}_${randomBytes(3).toString("hex")}`,
    );

    try {
      mkdir(path.dirname(tmpIn), { recursive: true }).catch(() => undefined);
      writeFile(tmpIn, buffer).catch(() => resolve(buffer));
    } catch {
      return resolve(buffer);
    }

    const ff = execFile(
      ffmpegPath || "ffmpeg",
      [
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        tmpIn,
        "-t",
        String(seconds),
        "-vn",
        "-acodec",
        "libmp3lame",
        "-ar",
        "44100",
        "-ac",
        "2",
        "-b:a",
        "128k",
        "-f",
        "mp3",
        "pipe:1",
      ],
      { timeout: 120000 },
      (error, stdout) => {
        unlink(tmpIn).catch(() => undefined);
        if (error || !stdout || !Buffer.isBuffer(stdout)) return resolve(buffer);
        resolve(stdout);
      },
    );

    ff.on("error", () => {
      unlink(tmpIn).catch(() => undefined);
      resolve(buffer);
    });
  });
}

export async function identifySong(
  buffer: Buffer,
  options: { maxBytes?: number; seconds?: number; startTime?: number } = {},
): Promise<Record<string, string>> {
  if (!Buffer.isBuffer(buffer)) throw new Error("Se esperaba un Buffer");
  if (buffer.length > (options.maxBytes || MAX_INPUT_BYTES))
    throw new Error("El archivo es demasiado grande");

  const clip = await prepareClip(buffer, options.seconds || CLIP_SECONDS);
  const url = await uploadUguu(clip);
  const track = await recognizeUrl(url, options.startTime || 0);

  return { ...track, sourceUrl: url };
}

export { recognizeUrl, uploadUguu, prepareClip };
