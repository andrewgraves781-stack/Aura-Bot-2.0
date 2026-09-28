import type { CommandContext } from "../../types/index.d.ts";
import {
  cooldownText,
  getEconomyUser,
  setEconomyUser,
  formatMoney,
} from "../../core/economyConfig.ts";
import { fytBold } from "../../core/socketText.ts";

export default {
  name: ["monthly", "mensual"],
  category: "economy",
  description: "Reclama tu recompensa mensual con sistema de racha.",
  async run(ctx: CommandContext) {
    const user = getEconomyUser(ctx.from, ctx.sender, {
      lastMonthly: 0,
      monthlyStreak: 0,
    });
    const now = Date.now();
    const cooldown = 30 * 24 * 60 * 60 * 1000;
    const gracePeriod = 45 * 24 * 60 * 60 * 1000;

    if (user.lastMonthly && now - user.lastMonthly < cooldown) {
      return ctx.reply(
        `⏳ Ya reclamaste tu sueldo mensual.\nVuelve en *${cooldownText(cooldown - (now - user.lastMonthly))}*.`,
      );
    }

    user.monthlyStreak =
      user.lastMonthly && now - user.lastMonthly > gracePeriod
        ? 1
        : (user.monthlyStreak || 0) + 1;

    const baseReward = 400000;
    const streakBonus =
      user.monthlyStreak > 1
        ? 50000 * Math.pow(2, Math.min(user.monthlyStreak - 2, 10))
        : 0;
    const totalReward = baseReward + streakBonus;
    user.bolsillo = Number(user.bolsillo || 0) + totalReward;
    user.lastMonthly = now;
    setEconomyUser(ctx.from, ctx.sender, user);

    let text = `╭〔 🎁 ${fytBold("SUELDO MENSUAL")} 〕⬣\n`;
    text += `┃ 🔥 ${fytBold("RACHA")}: *${user.monthlyStreak} Meses*\n`;
    text += `╰━━━━━━━━━━━━⬣\n\n`;
    text += `┃ 👋 Hola *@${ctx.sender.split("@")[0]}*\n`;
    text += `┃ 🎉 Base: ${formatMoney(baseReward, ctx)}\n`;
    text += `┃ ✨ Bono Racha: +${formatMoney(streakBonus, ctx)}\n`;
    text += `┃ 💰 Total Ganado: *${formatMoney(totalReward, ctx)}*\n`;
    text += `┃ 💵 Saldo actual: ${formatMoney(user.bolsillo, ctx)}\n\n`;
    text += `┃ ⏳ Próxima recompensa: En *30 días*\n\n`;
    text += `╰〔 ⚡ ${fytBold("AURA REED")} 〕⬣`;
    return ctx.reply({ text, mentions: [ctx.sender] });
  },
};
