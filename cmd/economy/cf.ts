import type { CommandContext } from "../../types/index.d.ts";
import {
  cooldownText,
  getEconomyUser,
  setEconomyUser,
  formatMoney,
} from "../../core/economyConfig.ts";

export default {
  name: ["cf", "caraocruz", "coinflip"],
  category: "economy",
  description: "Apuesta monedas a cara o cruz.",
  async run(ctx: CommandContext) {
    const user = getEconomyUser(ctx.from, ctx.sender, { lastCf: 0 });
    const amount = Number.parseInt(ctx.args?.[0] ?? "", 10);
    const choice = String(ctx.args?.[1] ?? "").toLowerCase();
    const now = Date.now();
    const cooldown = 60 * 1000;

    if (
      !Number.isInteger(amount) ||
      amount <= 0 ||
      !["cara", "cruz"].includes(choice)
    ) {
      return ctx.reply(
        `⚠️ Usa: *${ctx.usedPrefix ?? "."}cf [cantidad] [cara|cruz]*`,
      );
    }
    if (user.bolsillo < amount)
      return ctx.reply(
        `❌ No tienes suficientes monedas. Tienes *${formatMoney(user.bolsillo, ctx)}*.`,
      );
    if (user.lastCf && now - user.lastCf < cooldown) {
      return ctx.reply(
        `⏳ Espera *${cooldownText(cooldown - (now - user.lastCf))}* para volver a jugar.`,
      );
    }

    user.lastCf = now;
    const result = Math.random() < 0.5 ? "cara" : "cruz";
    user.bolsillo -= amount;
    const won = result === choice;
    if (won) user.bolsillo += amount * 2;
    setEconomyUser(ctx.from, ctx.sender, user);

    let text = `╭〔 🪙 𝐂𝐀𝐑𝐀 𝐎 𝐂𝐑𝐔𝐙 〕⬣\n`;
    text += `┃ 🎲 Resultado: *${result.toUpperCase()}*\n`;
    text += `┃ 🎯 Elegiste: *${choice.toUpperCase()}*\n`;
    text += `┃ ${won ? `✅ Ganaste ${formatMoney(amount, ctx)}` : `❌ Perdiste ${formatMoney(amount, ctx)}`}\n`;
    text += `┃ 💵 Cartera: ${formatMoney(user.bolsillo, ctx)}\n\n`;
    text += `╰〔 ⚡ 𝐀𝐔𝐑𝐀 𝐑𝐄𝐄𝐃 〕⬣`;
    return ctx.reply({ text, mentions: [ctx.sender] });
  },
};
