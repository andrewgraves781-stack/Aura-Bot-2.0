import type { CommandContext, TopMsgUser } from "../../types/index.d.ts";
import { fytBold } from "../../core/socketText.ts";

export default {
  name: ["topinactivos", "fantasmas", "inactivos"],
  category: "group",
  description: "Muestra los usuarios inactivos.",
  groupOnly: true,
  adminOnly: true,
  async run(ctx: CommandContext) {
    const activity = (
      (ctx.db.getGroup(ctx.from).topMsgUsers as
        TopMsgUser[] | string | undefined) instanceof Array
        ? (ctx.db.getGroup(ctx.from).topMsgUsers as TopMsgUser[])
        : []
    ) as TopMsgUser[];
    const counts = new Map<string, number>();
    for (const user of activity) {
      const count = Number(user.count || 0);
      for (const identity of [user.jid, user.lid].filter(Boolean)) {
        counts.set(String(identity).split("@")[0].split(":")[0], count);
      }
    }
    const users = (ctx.groupMeta?.participants || [])
      .map(
        (participant: import("@whiskeysockets/baileys").GroupParticipant) => {
          const identities = [
            participant.id,
            participant.lid,
            participant.phoneNumber,
          ].filter(Boolean);
          const count = identities.reduce(
            (total: number, identity: string) =>
              Math.max(
                total,
                counts.get(String(identity).split("@")[0].split(":")[0]) || 0,
              ),
            0,
          );
          return { id: participant.id, count };
        },
      )
      .sort(
        (
          left: { count: number; id: string },
          right: { count: number; id: string },
        ) => left.count - right.count || left.id.localeCompare(right.id),
      )
      .slice(0, 10);
    let text = `╭〔 👻 ${fytBold("ADMIN SYSTEM")} 〕⬣\n┃ 📉 ${fytBold("INACTIVOS DEL GRUPO")}\n╰━━━━━━━━━━━━⬣\n\n┃ ⚠️ ${fytBold("Usuarios inactivos")}\n┃ ⚠️ ${fytBold("que no participan")}\n\n┣━━━━━━━━━━━━⬣\n\n`;
    text += users
      .map(
        (user: { id: string; count: number }) =>
          `┃ ➪ @${user.id.split("@")[0]} › ${user.count} mensajes`,
      )
      .join("\n");
    text += `\n\n╰〔 ⚡ ${fytBold("SYSTEM ACTIVE")} 〕⬣`;
    return ctx.reply({
      text,
      mentions: users.map((user: { id: string; count: number }) => user.id),
    });
  },
};
