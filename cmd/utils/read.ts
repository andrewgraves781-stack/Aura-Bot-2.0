import type { CommandContext } from "../../types/index.d.ts";
import { downloadMediaMessage, type proto } from "@whiskeysockets/baileys";
import { fytBold } from "../../core/socketText.ts";
import { sendMessageWithRateLimit } from "../../core/mediaSendUtils.ts";

function unwrapMessage(
  message: proto.IMessage | null | undefined,
): proto.IMessage | null {
  if (!message) return null;
  if (
    message.imageMessage ||
    message.videoMessage ||
    message.documentMessage ||
    message.audioMessage
  )
    return message;
  if (message.viewOnceMessageV2?.message)
    return unwrapMessage(message.viewOnceMessageV2.message);
  if (message.viewOnceMessage?.message)
    return unwrapMessage(message.viewOnceMessage.message);
  if (message.documentWithCaptionMessage?.message)
    return unwrapMessage(message.documentWithCaptionMessage.message);
  return null;
}

function getMediaCaption(message: proto.IMessage | null | undefined): string {
  return (
    message?.imageMessage?.caption ||
    message?.videoMessage?.caption ||
    message?.documentMessage?.caption ||
    ""
  );
}

export default {
  name: ["read"],
  category: "utils",
  description: "Extrae y reenvía medios de visualización única.",
  async run({ sock, msg, from, reply, react }: CommandContext) {
    const context = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMessage = context?.quotedMessage;
    const target = unwrapMessage(quotedMessage);
    if (!target)
      return reply({
        text: `╭〔 ⚠️ ${fytBold("AURA REED")} 〕⬣\n┃ ❌ ${fytBold("FALTA MENSAJE VÁLIDO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Responde a una imagen o video de visualización única.`,
      });
    await react("⏳");
    try {
      const buffer = await downloadMediaMessage(
        {
          key: msg.key,
          message: target,
        } as import("@whiskeysockets/baileys").WAMessage,
        "buffer",
        {},
        {
          logger: console as unknown as Parameters<
            typeof downloadMediaMessage
          >[3]["logger"],
          reuploadRequest: sock.updateMediaMessage,
        },
      );
      if (!buffer?.length) throw new Error("No se pudo descargar el medio.");
      const quoted = {
        key: {
          remoteJid: from,
          id: context?.stanzaId || msg.key.id,
          participant: context?.participant,
        },
        message: quotedMessage,
      };
      const originalCaption = getMediaCaption(target);
      const caption =
        originalCaption ||
        `🔁 ${fytBold(target.imageMessage ? "Aquí tienes la imagen" : "Aquí tienes el video")}`;
      if (target.imageMessage)
        await sendMessageWithRateLimit(
          sock,
          from,
          { image: buffer, caption },
          { quoted },
        );
      else if (target.videoMessage)
        await sendMessageWithRateLimit(
          sock,
          from,
          { video: buffer, caption },
          { quoted },
        );
      else throw new Error("Solo se admiten imágenes y videos.");
      await react("✅");
    } catch (error: unknown) {
      await react("❌");
      return reply({
        text: `❌ ${error instanceof Error ? error.message : String(error) || "No pude extraer el medio."}`,
      });
    }
  },
};
