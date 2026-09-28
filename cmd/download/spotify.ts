import { fytBold } from "../../core/socketText.ts";
import {
  downloadToCache,
  requestJson,
  safeFileName,
} from "../../core/downloadUtils.ts";
import { DL_CONFIG } from "../../config.ts";
import { sendDownloadPreview } from "../../core/downloadPreview.ts";
import {
  prepareDownloadCharge,
  confirmDownloadCharge,
  formatMoney,
  getBotCurrency,
} from "../../core/economyConfig.ts";
import type { CommandContext, SpotifyResponse } from "../../types/index.d.ts";

const API = DL_CONFIG.alya.BASE_URL.replace(/\/+$/, "");
const KEY = DL_CONFIG.alya.API_KEY;

export default {
  name: ["spotify", "splay", "sp", "spdl"],
  category: "download",
  description: "Descarga canciones de Spotify por enlace o búsqueda.",
  async run(ctx: CommandContext) {
    const { args, reply, react, sock, from, msg, sender } = ctx;
    const query = args.join(" ").trim();
    if (!query)
      return reply(
        "⚠️ Ingresa el nombre de una canción o un enlace de Spotify.",
      );
    await react("🎵");
    try {
      const isUrl = query.includes("open.spotify.com/");
      const endpoint = isUrl ? "/dl/spotify" : "/dl/spotifyplay";
      const parameter = isUrl
        ? `url=${encodeURIComponent(query.split("?")[0])}`
        : `query=${encodeURIComponent(query)}`;
      const response = await requestJson<SpotifyResponse>(
        `${API}${endpoint}?${parameter}&key=${KEY}`,
      );
      const song = response?.data;
      const downloadUrl =
        typeof song?.dl === "string" ? song.dl : song?.dl?.mp3;
      if (!response?.status || !song || !downloadUrl)
        throw new Error("No se pudo obtener el audio.");
      const title = song.title || "Canción de Spotify";
      const originalUrl =
        song.url ||
        (isUrl
          ? query.split("?")[0]
          : `https://open.spotify.com/search/${encodeURIComponent(title)}`);
      const file = await downloadToCache(downloadUrl);
      const { cost } = await prepareDownloadCharge(ctx, "audio", file);
      let caption = `╭〔 🎵 ${fytBold("SPOTIFY PLAY")} 〕━⬣\n\n┃ ➥ ${fytBold(title)}\n\n┣━━━━━━━━━━━━⬣\n┃ > ${fytBold("Artista")} › ${song.artist || "Desconocido"}\n┃ > ${fytBold("Álbum")} › ${song.album || "Desconocido"}\n┃ > ${fytBold("Duración")} › ${song.duration || "N/A"}\n┃ > ${fytBold("Tipo")} › Audio (MP3)\n┃ > ${fytBold(getBotCurrency(ctx).name)} › ${formatMoney(cost, ctx)}\n┃ > ${fytBold("URL")} › ${originalUrl}\n┣━━━━━━━━━━━━⬣\n┃ ⏳ Descargando audio...\n╰━━〔 ⚡ ${fytBold("SYSTEM ACTIVE")} 〕━━⬣`;
      const cover = song.coverHd || song.cover;
      const hasPreview = cover
        ? await sendDownloadPreview({
            sock,
            from,
            msg,
            thumbnail: cover,
            caption,
            link: originalUrl,
            title,
            author: song.artist || "Spotify",
            sender,
          })
        : false;
      if (!hasPreview) await reply({ text: caption });
      await reply({
        audio: { url: file },
        mimetype: "audio/mpeg",
        fileName: `${safeFileName(title, "spotify")}.mp3`,
      });
      confirmDownloadCharge(ctx);
      await react("✅");
    } catch (error: unknown) {
      await react("❌");
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo descargar la canción.";
      return reply({
        text: `❌ Error: ${message}`,
      });
    }
  },
};
