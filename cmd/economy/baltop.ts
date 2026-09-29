import type { CommandContext } from "../../types/index.d.ts";
import {
  getEconomyUser,
  formatMoney,
} from "../../core/economyConfig.ts";
import { db } from "../../core/AuraDB.ts";

export default {
  name: ["baltop", "topbal", "topcoins"],
  category: "economy",
  description: "Muestra el ranking de usuarios con más monedas.",
  groupOnly: true,
  async run(ctx: CommandContext) {
    if (!ctx.groupMeta) {
      return ctx.reply("❌ Este comando solo funciona en grupos.");
    }
    const pageSize = 10;
    const requestedPage = Number.parseInt(String(ctx.args?.[0] || "1"), 10);
    if (!Number.isInteger(requestedPage) || requestedPage < 1) {
      return ctx.reply("⚠️ Indica una página válida. Ejemplo: `.baltop 1`");
    }

    const botJid = String(ctx.sock?.user?.id || "").split(":")[0];
    const botNumber = botJid.split("@")[0];
    const botId = String(ctx.sock?.subBotId || "").split("@")[0];
    const users = db.getAllUsers();
    const usersByIdentity = new Map<
      string,
      { jid: string; username: string }
    >();
    for (const user of users) {
      const jid = String(user.jid || "").trim();
      const storedUser = {
        jid,
        username:
          user.username ||
          (user as { pushName?: string }).pushName ||
          "Usuario",
      };
      if (jid) usersByIdentity.set(jid.split("@")[0].split(":")[0], storedUser);
      if (user.lid)
        usersByIdentity.set(
          String(user.lid).split("@")[0].split(":")[0],
          storedUser,
        );
      if (user.phone_number)
        usersByIdentity.set(
          String(user.phone_number).replace(/\D/g, ""),
          storedUser,
        );
    }
    const participants = Array.isArray(ctx.groupMeta.participants)
      ? ctx.groupMeta.participants.filter((participant) => Boolean(participant?.id))
      : [];
    const rows = participants
      .flatMap((participant) => {
        const number = participant.id.split("@")[0].split(":")[0];
        const storedUser = usersByIdentity.get(number);
        if (!storedUser || number === botNumber || number === botId) {
          return [];
        }
        const user = getEconomyUser(ctx.from, storedUser.jid);
        const total = Number(user.bolsillo ?? 0) + Number(user.banco ?? 0);
        return total > 0
          ? [{
              jid: storedUser.jid,
              username: storedUser.username,
              number,
              total,
            }]
          : [];
      })
      .sort((a, b) => b.total - a.total);
    if (!rows.length)
      return ctx.reply("⚠️ No hay usuarios con saldo para mostrar.");

    const totalPages = Math.ceil(rows.length / pageSize);
    if (requestedPage > totalPages) {
      return ctx.reply(
        `⚠️ Esa página no existe. Hay ${totalPages} página${totalPages === 1 ? "" : "s"}.`,
      );
    }

    const page = requestedPage;
    const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);
    let text = `╭〔 💎 𝐁𝐀𝐋𝐀𝐍𝐂𝐄 𝐓𝐎𝐏 💎 〕⬣\n┃ 🏆 𝐑𝐀𝐍𝐊𝐈𝐍𝐆 𝐃𝐄 𝐌𝐎𝐍𝐄𝐃𝐀𝐒\n┃ 📄 Página ${page}/${totalPages}\n╰━━━━━━━━━━━━⬣\n\n`;
    pageRows.forEach((row, index) => {
      const position = (page - 1) * pageSize + index;
      text += `┃ ${position < 3 ? ["🥇", "🥈", "🥉"][position] : "🎖️"} ${row.username}\n┃ ${formatMoney(row.total, ctx)}\n\n`;
    });
    text += `╰〔 ⚡ 𝐀𝐔𝐑𝐀 𝐄𝐂𝐎𝐍𝐎𝐌𝐘 ⚡ 〕⬣`;
    return ctx.reply(text);
  },
};
