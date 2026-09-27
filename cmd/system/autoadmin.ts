import type { GroupParticipant } from "@whiskeysockets/baileys";
import type { CommandContext } from "../../types/index.d.ts";
import { fytBold } from "../../core/socketText.ts";

export default {
  name: ["autoadmin", "seradmin", "dameadmin"],
  description: "El bot te da admin del grupo (solo owners).",
  category: "system",
  ownerOnly: true, // 🔒 Solo owners (lo valida tu handler.ts)
  groupOnly: true, // Solo funciona en grupos
  botAdmin: true, // El bot necesita ser admin para poder dar admin

  async run({
    sock,
    from,
    sender,
    reply,
    react,
    msg,
    db,
    groupMeta,
    clearGroupCache,
  }: CommandContext) {
    await react("👑");

    try {
      // Verificar si ya es admin
      const participant = groupMeta?.participants?.find(
        (p: GroupParticipant) =>
          p.id === sender || (p as { lid?: string }).lid === sender,
      );

      if (
        participant?.admin === "admin" ||
        participant?.admin === "superadmin"
      ) {
        return reply({
          text: `👑 Ya eres admin de este grupo, no necesitas el comando.`,
        });
      }

      // El bot promueve a admin al que ejecutó el comando
      await sock.groupParticipantsUpdate(from, [sender], "promote");
      clearGroupCache?.(); // Limpia la caché de grupos del handler

      // Nombre desde la DB
      const senderUser = db.getUser(sender);
      const senderName =
        senderUser?.pushName ||
        senderUser?.username ||
        msg.pushName ||
        sender.split("@")[0];

      await reply({
        text: `👑 \`${senderName}\` ${fytBold("ahora es admin")} del grupo.`,
        mentions: [sender],
      });
    } catch (error: unknown) {
      await react("❌");
      await reply({
        text: `❌ Error al darte admin: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  },
};
