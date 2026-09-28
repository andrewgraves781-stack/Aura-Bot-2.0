import {
  addEconomyXp,
  economyUser,
  saveEconomy,
  formatMoney,
} from "./economyRuntime.ts";
import { cooldownText } from "./economyConfig.ts";
import { economyTexts } from "./economyTexts.ts";
import type { CommandContext } from "../types/commands.d.ts";

type EconomyTextsKey = keyof typeof economyTexts;

type ActivityOptions = {
  names: string[];
  description: string;
  title: string;
  icon: string;
  cooldown: number;
  reward: [number, number];
  xp: [number, number];
  success: string[];
  fail: string[];
};

const randomBetween = ([min, max]: [number, number]) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export function createEconomyActivity(options: ActivityOptions) {
  const key = options.names[0];
  const lastKey = `last${key.charAt(0).toUpperCase()}${key.slice(1)}`;
  return {
    name: options.names,
    category: "economy",
    description: options.description,
    async run(ctx: CommandContext) {
      const user = economyUser(ctx);
      const now = Date.now();
      const last = Number(user[lastKey] ?? 0);
      if (last && now - last < options.cooldown) {
        return ctx.reply(
          `⏳ Estás cansado. Vuelve en *${cooldownText(options.cooldown - (now - last))}*.`,
        );
      }

      const xp = randomBetween(options.xp);
      const success = Math.random() > 0.3;
      const reward = success ? randomBetween(options.reward) : 0;
      user[lastKey] = now;
      user.bolsillo += reward;
      saveEconomy(ctx, ctx.sender, user);
      addEconomyXp(ctx.sender, xp);

      const configuredTexts = (
        economyTexts as Record<
          string,
          string[] | { success?: string[]; fail?: string[] }
        >
      )[key];
      const isTextArray = Array.isArray(configuredTexts);
      const successTexts = isTextArray
        ? configuredTexts
        : configuredTexts?.success;
      const failTexts = isTextArray ? undefined : configuredTexts?.fail;
      const successMessage = successTexts?.length
        ? successTexts
        : options.success;
      const failMessage = failTexts?.length ? failTexts : options.fail;

      let text = `╭〔 ${options.icon} 𝐀𝐔𝐑𝐀 𝐑𝐄𝐄𝐃 〕⬣\n┃ ${options.title}\n╰━━━━━━━━━━━━⬣\n\n`;
      text += `┃ 👋 Hola *@${ctx.sender.split("@")[0]}*\n┃ ✨ Aura Ganado: +${xp}\n`;
      text += success
        ? `┃ ${successMessage[Math.floor(Math.random() * successMessage.length)]} *${formatMoney(reward, ctx)}*\n`
        : `┃ ${failMessage[Math.floor(Math.random() * failMessage.length)]}\n`;
      text += `┃ 💵 Saldo actual: ${formatMoney(user.bolsillo, ctx)}\n\n╰〔 ⚡ 𝐀𝐔𝐑𝐀 𝐑𝐄𝐄𝐃 〕⬣`;
      return ctx.reply({ text, mentions: [ctx.sender] });
    },
  };
}
