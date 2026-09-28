import type { CommandContext } from "../../types/index.d.ts";
import { updateProfile } from "../../core/profileConfig.ts";
import { fytBold } from "./../../core/socketText.ts";

const VALID_GENDERS = ["hombre", "mujer", "masculino", "femenino"];

export default {
  name: ["setgenre", "genero"],
  description: "Cambia tu género.",
  category: "profile",
  async run(ctx: CommandContext) {
    const genderInput = ctx.text?.toLowerCase().trim();
    
    if (!genderInput) {
      let textInfo = `╭〔 ⚡ ${fytBold("AURA REED")}〕⬣\n`;
      textInfo += `┃ ${fytBold("🛠️ COMO DEFINIR TU GÉNERO")}\n`;
      textInfo += `╰━━━━━━━━━━━━⬣\n\n`;
      textInfo += `┃ ${fytBold("🛠️ Uso:")} .setgenre <género>\n`;
      textInfo += `┃ ${fytBold("🛠️ Opciones:")} hombre, mujer\n`;
      textInfo += `┃ ${fytBold("🛠️ Ejemplo:")} .setgenre hombre\n`;
      textInfo += `\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`;
      return ctx.reply(textInfo);
    }

    if (!VALID_GENDERS.includes(genderInput)) {
      let textError = `╭〔 ⚠️ ${fytBold("AURA REED")}〕⬣\n`;
      textError += `┃ ❌ ${fytBold("GÉNERO NO VÁLIDO")}\n`;
      textError += `╰━━━━━━━━━━━━⬣\n\n`;
      textError += `┃ Solo se permiten: *hombre* o *mujer*\n`;
      textError += `┃ Ejemplo: ${ctx.usedPrefix ?? "."}setgenre hombre\n\n`;
      textError += `╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`;
      return ctx.reply(textError);
    }

    updateProfile(ctx.sender, { gender: genderInput });

    let text = `╭〔 ⚡ ${fytBold("AURA REED")}〕⬣\n`;
    text += `┃ ✅ ${fytBold("GÉNERO ACTUALIZADO")}\n`;
    text += `╰━━━━━━━━━━━━⬣\n\n`;
    text += `┃ 👋 Tu género es:\n`;
    text += `┃ 📝 *${genderInput}*\n\n`;
    text += `╰〔 ⚡ ${fytBold("AURA REED")}〕⬣`;

    return ctx.reply(text);
  },
};
