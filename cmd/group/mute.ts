import type { GroupParticipant } from "@whiskeysockets/baileys";
import type { CommandContext } from "../../types/index.d.ts";
import { fytBold } from "../../core/socketText.ts";

function normalizeJid(jid: string): string {
  return String(jid || "").split("@")[0].split(":")[0];
}

function matchMutedUser(savedJid: string, targetJid: string): boolean {
  const left = new Set<string>();
  const right = new Set<string>();

  for (const value of [savedJid, targetJid]) {
    const raw = String(value || "").trim();
    if (!raw) continue;

    const variants = [
      raw,
      raw.split(":")[0],
      raw.split("@")[0],
      raw.replace(/@s\.whatsapp\.net$/i, ""),
      raw.replace(/@lid$/i, ""),
    ];

    for (const variant of variants) {
      if (!variant) continue;
      const cleaned = normalizeJid(variant);
      const normalized = cleaned.toLowerCase();
      if (normalized) {
        if (value === savedJid) left.add(normalized);
        if (value === targetJid) right.add(normalized);
      }
    }
  }

  return [...left].some((value) => right.has(value));
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

    const normalizedTarget = normalizeJid(target);
    const isAlreadyMuted = mutedUsers.some((jid: string) =>
      matchMutedUser(jid, normalizedTarget),
    );

    if (!isAlreadyMuted) {
      mutedUsers.push(target);

      if (target.endsWith("@lid")) {
        const targetJid = ctx.groupMeta?.participants?.find(
          (p: any) => p.lid === target
        )?.id;
        if (targetJid && !mutedUsers.includes(targetJid)) {
          mutedUsers.push(targetJid);
        }
      }
    }

    ctx.db.setGroup(ctx.from, { mutedUsers });
    
    return ctx.reply({
      text: `╭〔 🔇 ${fytBold("AURA REED")} 〕⬣\n┃ 🛑 ${fytBold("USUARIO SILENCIADO")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Los mensajes de @${target.split("@")[0]} serán\n┃ > eliminados automáticamente.\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`,
      mentions: [target],
    });
  },
};
