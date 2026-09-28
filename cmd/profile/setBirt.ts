import type { CommandContext } from "../../types/index.d.ts";
import { updateProfile } from "../../core/profileConfig.ts";
import { fytBold } from "./../../core/socketText.ts";

function validateDateFormat(dateStr: string): boolean {
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = dateStr.match(regex);
  
  if (!match) return false;
  
  const day = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const year = Number.parseInt(match[3], 10);
  
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > new Date().getFullYear()) return false;
  
  const date = new Date(year, month - 1, day);
  return date.getDate() === day && date.getMonth() === month - 1;
}

export default {
  name: ["setbirt", "setbirth", "cumple"],
  description: "Guarda tu cumpleaños.",
  category: "profile",
  async run(ctx: CommandContext) {
    let textInfo = `╭〔 ⚡ ${fytBold("AURA REED")}〕⬣\n`;
    textInfo += `┃ ${fytBold("🛠️ COMO DEFINIR TU CUMPLEAÑOS")}\n`;
    textInfo += `╰━━━━━━━━━━━━⬣\n\n`;
    textInfo += `┃ ${fytBold("🛠️ Uso:")} .setbirt DD/MM/AAAA\n`;
    textInfo += `┃ ${fytBold("🛠️ Ejemplo:")} .setbirt 07/04/2007\n`;
    textInfo += `\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`;

    if (!ctx.text) return ctx.reply(textInfo);

    const dateInput = ctx.text.trim();
    
    if (!validateDateFormat(dateInput)) {
      let textError = `╭〔 ⚠️ ${fytBold("AURA REED")}〕⬣\n`;
      textError += `┃ ❌ ${fytBold("FORMATO NO VÁLIDO")}\n`;
      textError += `╰━━━━━━━━━━━━⬣\n\n`;
      textError += `┃ Solo se permite el formato: *DD/MM/AAAA*\n`;
      textError += `┃ Ejemplo: ${ctx.usedPrefix ?? "."}setbirt 07/04/2007\n\n`;
      textError += `╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`;
      return ctx.reply(textError);
    }

    updateProfile(ctx.sender, { birthDate: dateInput });

    let text = `╭〔 ⚡ ${fytBold("AURA REED")}〕⬣\n`;
    text += `┃ ✅ ${fytBold("CUMPLE ACTUALIZADO")}\n`;
    text += `╰━━━━━━━━━━━━⬣\n\n`;
    text += `┃ 🎂 Tu cumple es el:\n`;
    text += `┃ 📝 *${dateInput}*\n\n`;
    text += `╰〔 ⚡ ${fytBold("AURA REED")}〕⬣`;

    return ctx.reply(text);
  },
};
