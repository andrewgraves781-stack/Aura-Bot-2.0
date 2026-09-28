import type { CommandContext } from "../../types/index.d.ts";
import {
  cooldownText,
  getEconomyUser,
  setEconomyUser,
  formatMoney,
} from "../../core/economyConfig.ts";

export default {
  name: ["daily", "diario"],
  category: "economy",
  description: "Reclama tu recompensa diaria.",
  async run(ctx: CommandContext) {
    const user = getEconomyUser(ctx.from, ctx.sender, {
      lastDaily: 0,
      dailyStreak: 0,
    });
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;
    const gracePeriod = 48 * 60 * 60 * 1000;

    if (user.lastDaily && now - user.lastDaily < cooldown) {
      return ctx.reply(
        `⏳ Ya reclamaste tu recompensa diaria.\nVuelve en *${cooldownText(cooldown - (now - user.lastDaily))}*.`,
      );
    }

    user.dailyStreak =
      user.lastDaily && now - user.lastDaily > gracePeriod
        ? 1
        : (user.dailyStreak || 0) + 1;

    const baseReward = 12000;
    const streakBonus =
      user.dailyStreak > 1
        ? 12500 * Math.pow(2, Math.min(user.dailyStreak - 2, 10))
        : 0;
    const totalReward = baseReward + streakBonus;
    user.bolsillo = Number(user.bolsillo || 0) + totalReward;
    user.lastDaily = now;
    setEconomyUser(ctx.from, ctx.sender, user);

    let text = `╭〔 🎁 𝐑𝐄𝐂𝐎𝐌𝐏𝐄𝐍𝐒𝐀 𝐃𝐈𝐀𝐑𝐈𝐀 〕⬣\n`;
    text += `┃ 🔥 𝐑𝐀𝐂𝐇𝐀: *${user.dailyStreak} Días*\n`;
    text += `╰━━━━━━━━━━━━⬣\n\n`;
    text += `┃ 👋 Hola *@${ctx.sender.split("@")[0]}*\n`;
    text += `┃ 🎉 Base: ${formatMoney(baseReward, ctx)}\n`;
    text += `┃ ✨ Bono Racha: +${formatMoney(streakBonus, ctx)}\n`;
    text += `┃ 💰 Total Ganado: *${formatMoney(totalReward, ctx)}*\n`;
    text += `┃ 💵 Saldo actual: ${formatMoney(user.bolsillo, ctx)}\n\n`;
    text += `╰〔 ⚡ 𝐀𝐔𝐑𝐀 𝐑𝐄𝐄𝐃 〕⬣`;
    return ctx.reply({ text, mentions: [ctx.sender] });
  },
};
