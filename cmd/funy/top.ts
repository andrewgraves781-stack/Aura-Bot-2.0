import type { GroupMetadata, GroupParticipant } from "@whiskeysockets/baileys";
import type { CommandContext } from "../../types/index.d.ts";
import { fytBold } from "../../core/socketText.ts";

export default {
  name: ["top"],
  category: "funy",
  description: "Crea un top 10 aleatorio con un tema.",
  groupOnly: true,

  async run(ctx: CommandContext) {
    if (!ctx.groupMeta) {
      return ctx.reply("❌ Este comando solo funciona en grupos.");
    }
    const groupMetadata = ctx.groupMeta;
    const participants = Array.isArray(groupMetadata.participants)
      ? groupMetadata.participants.filter((participant: GroupParticipant) =>
          Boolean(participant?.id),
        )
      : [];
    const topic = ctx.args.join(" ") || "los más locos";
    const top10 = [...participants]
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);

    let text = `╭〔 🏆 ${fytBold("TOP 10")} 〕⬣\n`;
    text += `┃ ${fytBold(topic.toUpperCase())}\n`;
    text += `╰━━━━━━━━━━━━⬣\n\n`;

    top10.forEach((participant: GroupParticipant, index: number) => {
      text += `┃ ${index + 1}. @${participant.id.split("@")[0]}\n`;
    });

    text += `\n╰〔 ⚡ ${fytBold("AURA REED")} 〕⬣`;

    return ctx.reply({
      text,
      mentions: top10.map((participant: GroupParticipant) => participant.id),
    });
  },
};
