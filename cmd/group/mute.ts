import type { GroupParticipant } from "@whiskeysockets/baileys";
import type { CommandContext } from "../../types/index.d.ts";
import { fytBold } from "../../core/socketText.ts";

function normalizeJid(jid: string): string {
  return String(jid || "").split("@")[0].split(":")[0];
}

export default {
  name: ["mute", "silenciar"],
  category: "group",
  description: "Silencia a un usuario eliminando sus mensajes.",
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,
  async run(ctx: CommandContext) {
    const context = ctx.msg?.message?.extendedTextMessage?.contextInfo;
    const target = context?.mentionedJid?.[0] || context?.participant;
    if (!target)
      return ctx.reply({
        text: `╭〔 ⚠️ ${fytBold("AURA REED")} 〕⬣\n┃ ❌ ${fytBold("FALTA USUARIO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Etiqueta o responde al mensaje del\n┃ > usuario que deseas silenciar.\n\n╰〔 ⚡ ${fytBold("SYSTEM ALERT")} 〕⬣`,
      });
    const group = ctx.db.getGroup(ctx.from);
    const isAdmin = ctx.groupMeta?.participants?.some(
      (participant: GroupParticipant) =>
        participant.id === target && Boolean(participant.admin),
    );
    if (isAdmin)
      return ctx.reply({
        text: `╭〔 ❌ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("ACCIÓN PROHIBIDA")}\n╰━━━━━━━━━━━━⬣\n\n┃ > No puedes silenciar a un administrador.\n\n╰〔 ⚡ ${fytBold("SYSTEM ALERT")} 〕⬣`,
      });
    const mutedUsers = Array.isArray(group.mutedUsers) ? group.mutedUsers : [];
    
    // Normalizar JIDs para evitar duplicados
    const normalizedTarget = normalizeJid(target);
    const isAlreadyMuted = mutedUsers.some((jid: string) => normalizeJid(jid) === normalizedTarget);
    
    if (!isAlreadyMuted) mutedUsers.push(target);
    ctx.db.setGroup(ctx.from, { mutedUsers });
    return ctx.reply({
      text: `╭〔 🔇 ${fytBold("AURA REED")} 〕⬣\n┃ 🛑 ${fytBold("USUARIO SILENCIADO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Los mensajes de @${target.split("@")[0]} serán\n┃ > eliminados automáticamente.\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`,
      mentions: [target],
    });
  },
};
