import type { CommandContext } from "../../types/index.d.ts";
import { fytBold } from "../../core/socketText.ts";

function normalizeJid(jid: string): string {
  return String(jid || "").split("@")[0].split(":")[0];
}

export default {
  name: ["unmute", "desilenciar"],
  category: "group",
  description: "Quita el silencio a un usuario.",
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,
  async run(ctx: CommandContext) {
    const context = ctx.msg?.message?.extendedTextMessage?.contextInfo;
    const target = context?.mentionedJid?.[0] || context?.participant;
    if (!target)
      return ctx.reply({
        text: `╭〔 ⚠️ ${fytBold("AURA REED")} 〕⬣\n┃ ❌ ${fytBold("FALTA USUARIO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Etiqueta o responde al usuario que deseas desilenciar.\n\n╰〔 ⚡ ${fytBold("SYSTEM ALERT")} 〕⬣`,
      });
    const group = ctx.db.getGroup(ctx.from);
    const mutedUsers = Array.isArray(group.mutedUsers) ? group.mutedUsers : [];
    
    // Normalizar JIDs para comparación
    const normalizedTarget = normalizeJid(target);
    const isMuted = mutedUsers.some((jid: string) => normalizeJid(jid) === normalizedTarget);
    
    if (!isMuted)
      return ctx.reply({
        text: `╭〔 ⚠️ ${fytBold("AURA REED")} 〕⬣\n┃ ℹ️ El usuario @${target.split("@")[0]} no está silenciado.\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`,
        mentions: [target],
      });
    ctx.db.setGroup(ctx.from, {
      mutedUsers: mutedUsers.filter((jid: string) => normalizeJid(jid) !== normalizedTarget),
    });
    return ctx.reply({
      text: `╭〔 🔊 ${fytBold("AURA REED")} 〕⬣\n┃ ✅ ${fytBold("DESILENCIADO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > El usuario @${target.split("@")[0]} ya puede hablar.\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`,
      mentions: [target],
    });
  },
};
