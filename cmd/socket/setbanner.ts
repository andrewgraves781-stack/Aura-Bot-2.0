import type { CommandContext } from "../../types/index.d.ts";
import type { proto } from "@whiskeysockets/baileys";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

function unwrapMedia(
  message: proto.IMessage | null | undefined,
): proto.IMessage | null {
  if (!message) return null;
  if (message.imageMessage || message.videoMessage || message.documentMessage)
    return message;
  if (message.viewOnceMessageV2?.message)
    return unwrapMedia(message.viewOnceMessageV2.message);
  if (message.viewOnceMessage?.message)
    return unwrapMedia(message.viewOnceMessage.message);
  if (message.documentWithCaptionMessage?.message)
    return unwrapMedia(message.documentWithCaptionMessage.message);
  return null;
}

export default {
  name: ["setbanner", "setmenuimage", "setmenubanner"],
  category: "socket",
  description: "Cambia el banner que usa el menú.",
  botUserOnly: true,
  async run(ctx: CommandContext) {
    const context = ctx.msg?.message?.extendedTextMessage?.contextInfo;
    const quotedMessage = context?.quotedMessage;
    const target = unwrapMedia(quotedMessage) || unwrapMedia(ctx.msg?.message);
    if (!target) {
      return ctx.reply(
        "⚠️ Responde a una imagen o video para establecerlo como banner.",
      );
    }

    try {
      const buffer = await downloadMediaMessage(
        { key: ctx.msg.key, message: target },
        "buffer",
        {},
        {
          logger: console as unknown as Parameters<
            typeof downloadMediaMessage
          >[3]["logger"],
          reuploadRequest: ctx.sock.updateMediaMessage as (
            msg: Parameters<typeof downloadMediaMessage>[0],
          ) => Promise<Parameters<typeof downloadMediaMessage>[0]>,
        },
      );
      if (!buffer?.length) throw new Error("No se pudo descargar el banner.");

      const mimetype =
        target.imageMessage?.mimetype ||
        target.videoMessage?.mimetype ||
        target.documentMessage?.mimetype ||
        "image/jpeg";
      const databaseDir = path.resolve("./database");
      await mkdir(databaseDir, { recursive: true });
      const extension = mimetype.includes("gif")
        ? "gif"
        : mimetype.includes("video")
          ? "mp4"
          : mimetype.includes("png")
            ? "png"
            : "jpg";
      const filePath = path.join(
        databaseDir,
        `banner-${randomUUID()}.${extension}`,
      );
      await writeFile(filePath, buffer);

      const bot = ctx.db.getBot(ctx.botJid);
      const previousPath = (
        bot?.data?.customBanner as { path?: string } | undefined
      )?.path;
      if (previousPath && previousPath !== filePath) {
        await unlink(previousPath).catch(() => undefined);
      }
      ctx.db.setBot(ctx.botJid, {
        data: { customBanner: { path: filePath, mimetype } },
      });
      return ctx.reply("✅ Banner del menú actualizado.");
    } catch (error: unknown) {
      return ctx.reply({
        text: `❌ No se pudo guardar el banner: ${error instanceof Error ? error.message : String(error) || "error desconocido"}`,
      });
    }
  },
};
