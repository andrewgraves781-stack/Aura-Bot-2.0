import type { CommandContext } from "../../types/index.d.ts";
import { fytBold } from "../../core/socketText.ts";
import { aiError, askAlya, getPrompt } from "./aiUtils.ts";

export default {
  name: ["grok", "kia", "gkai"],
  category: "AI",
  description: "Habla con Grok.",

  async run({ args, reply, react }: CommandContext) {
    const prompt = getPrompt(args);
    if (!prompt) {
      return reply({
        text: `╭〔 ⚠️ ${fytBold("AURA REED")} 〕⬣\n┃ ${fytBold("FALTA MENSAJE")}\n╰━━━━━━━━━━━━⬣\n\n┃ > Debes escribir un mensaje para\n┃ > que Gemini pueda responderte.\n\n╰〔 ⚡ ${fytBold("SYSTEM INFO")} 〕⬣`,
      });
    }

    await react("🤖");
    try {
      const response = await askAlya("/ai/grok", prompt);
      await reply({
        text: `╭〔 🤖 ${fytBold("GROK AI")} 〕⬣\n\n${response}\n\n╰〔 ⚡ ${fytBold("SYSTEM AI")} 〕⬣`,
      });
      await react("✅");
    } catch (error) {
      await react("❌");
      return reply({
        text: `❌ ${fytBold("ERROR AL OBTENER RESPUESTA")} ❌\n\n> ${aiError(error)}`,
      });
    }
  },
};
