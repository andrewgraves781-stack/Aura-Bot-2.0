import type { CommandContext } from "../../types/index.d.ts";
import {
  DEFAULT_BOT_CURRENCY,
  formatMoney,
  getBotCurrency,
  setBotCurrency,
} from "../../core/economyConfig.ts";
import { fytBold } from "../../core/socketText.ts";

export default {
  name: ["setcurrency", "setmoneda", "currency", "setbotcurrency"],
  category: "socket",
  description: "Cambia el nombre y el símbolo de la moneda del bot.",
  botUserOnly: true,
  async run(ctx: CommandContext) {
    const prefix = ctx.usedPrefix ?? ".";
    const raw = ctx.args.join(" ").trim();
    const current = getBotCurrency(ctx);

    if (!raw) {
      return ctx.reply(
        `╭〔 💱 ${fytBold("SETCURRENCY")} 〕⬣\n` +
        `┃ ${fytBold("DEFINIR MONEDA")}\n` +
        `╰━━━━━━━━━━━━⬣\n\n` +
        `┃ Nombre: *${current.name}*\n` +
        `┃ Símbolo: *${current.symbol}*\n` +
        `┃ Ejemplo: ${formatMoney(1500, current)}\n` +
        `┣━━━━━━━━━━━━⬣\n` +
        `┃ > ${fytBold("Uso")}\n` +
        `┃ • ${prefix}setcurrency <nombre>\n` +
        `┃ • ${prefix}setcurrency <nombre> <símbolo>\n` +
        `┃ • ${prefix}setcurrency reset\n` + 
        `┃ > ${fytBold("Ejemplo")} › ${prefix}setcurrency Diamantes 💎\n`+
        `\n╰━━〔 ${fytBold("SYSTEM INFO")} 〕━━⬣`
      );
    }

    if (["reset", "default", "aura", "auracoins"].includes(raw.toLowerCase())) {
      const restored = setBotCurrency(
        ctx.botJid,
        DEFAULT_BOT_CURRENCY.name,
        DEFAULT_BOT_CURRENCY.symbol,
      );
      let currency = `╭〔 ${fytBold("AURA REED")} 〕━⬣\n`
      currency += `┃ ${fytBold("✅ MODEDA DEFINIDA")}\n`
      currency += `╰━━━━━━━━━━━━⬣\n\n`
      currency += `┃ > ${fytBold("Modena")} › *${restored.name}*\n`
      currency += `┃ > ${fytBold("Simbolo")} › *${restored.symbol}*\n`
      currency += `┣━━━━━━━━━━━━⬣\n`
      currency += `┃ > ${fytBold("Ejemplo")} › ${formatMoney(1500, restored)}\n\n`
      currency += `╰━━〔 ${fytBold("SYSTEM INFO")} 〕━━⬣`
      return ctx.reply(
        `✅ Moneda restablecida a *${restored.symbol} ${restored.name}*.\nEjemplo: ${formatMoney(1500, restored)}`,
      );
    }

    const parts = raw.split(/\s+/);
    const maybeSymbol = parts.length > 1 ? parts[parts.length - 1] : "";
    const looksLikeSymbol =
      maybeSymbol.length > 0 &&
      maybeSymbol.length <= 4 &&
      !/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]{5,}$/.test(maybeSymbol) &&
      (parts.length > 1 || /[^\p{L}\p{N}]/u.test(maybeSymbol));
    const symbol = looksLikeSymbol ? maybeSymbol : current.symbol;
    const name = looksLikeSymbol ? parts.slice(0, -1).join(" ") : raw;

    if (name.length < 2 || name.length > 24) {
      return ctx.reply(
        "⚠️ El nombre de la moneda debe tener entre 2 y 24 caracteres.",
      );
    }
    if (/[\r\n]/.test(name) || /[\r\n]/.test(symbol)) {
      return ctx.reply("⚠️ El nombre o el símbolo no pueden incluir saltos de línea.");
    }
    if (symbol.length < 1 || symbol.length > 4) {
      return ctx.reply("⚠️ El símbolo debe tener entre 1 y 4 caracteres.");
    }

    const next = setBotCurrency(ctx.botJid, name, symbol);
    let textCurrency = `╭〔 ${fytBold("AURA REED")} 〕━⬣\n`
    textCurrency += `┃ ${fytBold("✅ MODEDA DEFINIDA")}\n`
    textCurrency += `╰━━━━━━━━━━━━⬣\n\n`
    textCurrency += `┃ > ${fytBold("Modena")} › *${next.name}*\n`
    textCurrency += `┃ > ${fytBold("Simbolo")} › *${next.symbol}*\n`
    textCurrency += `┣━━━━━━━━━━━━⬣\n`
    textCurrency += `┃ > ${fytBold("Ejemplo")} › ${formatMoney(1500, next)}\n\n`
    textCurrency += `╰━━〔 ${fytBold("SYSTEM INFO")} 〕━━⬣`
    return ctx.reply(textCurrency);
  },
};

