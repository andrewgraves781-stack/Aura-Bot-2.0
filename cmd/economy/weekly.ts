import type { CommandContext } from "../../types/index.d.ts";
import {
  cooldownText,
  getEconomyUser,
  setEconomyUser,
  formatMoney,
} from "../../core/economyConfig.ts";
import { fytBold } from "../../core/socketText.ts";

export default {
  name: ["weekly", "semanal", "memanal"],
  category: "economy",
  description: "Reclama tu recompensa semanal con sistema de racha.",
  async run(ctx: CommandContext) {
    const user = getEconomyUser(ctx.from, ctx.sender, {
      lastWeekly: 0,
      weeklyStreak: 0,
    });
    const now = Date.now();
    const cooldown = 7 * 24 * 60 * 60 * 1000;
    const gracePeriod = 11 * 24 * 60 * 60 * 1000;

    if (user.lastWeekly && now - user.lastWeekly < cooldown) {
      return ctx.reply(
        `⏳ Ya reclamaste tu recompensa semanal.\nVuelve en *${cooldownText(cooldown - (now - user.lastWeekly))}*.`,
      );
    }

    user.weeklyStreak =
      user.lastWeekly && now - user.lastWeekly > gracePeriod
        ? 1
        : (user.weeklyStreak || 0) + 1;

    const baseReward = 100000;
    const streakBonus =
      user.weeklyStreak > 1
        ? 12500 * Math.pow(2, Math.min(user.weeklyStreak - 2, 10))
        : 0;
    const totalReward = baseReward + streakBonus;
    user.bolsillo = Number(user.bolsillo || 0) + totalReward;
    user.lastWeekly = now;
    setEconomyUser(ctx.from, ctx.sender, user);

    let text = `╭〔 🎁 ${fytBold("BONO SEMANAL")} 〕⬣\n`;
    text += `┃ 🔥 ${fytBold("RACHA")}: *${user.weeklyStreak} Semanas*\n`;
    text += `╰━━━━━━━━━━━━⬣\n\n`;
    text += `┃ 👋 Hola *@${ctx.sender.split("@")[0]}*\n`;
    text += `┃ 🎉 Base: ${formatMoney(baseReward, ctx)}\n`;
    text += `┃ ✨ Bono Racha: +${formatMoney(streakBonus, ctx)}\n`;
    text += `┃ 💰 Total Ganado: *${formatMoney(totalReward, ctx)}*\n`;
    text += `┃ 💵 Saldo actual: ${formatMoney(user.bolsillo, ctx)}\n\n`;
    text += `┃ ⏳ Próxima recompensa: En *7 días*\n\n`;
    text += `╰〔 ⚡ ${fytBold("AURA REED")} 〕⬣`;
    return ctx.reply({ text, mentions: [ctx.sender] });
  },
};
