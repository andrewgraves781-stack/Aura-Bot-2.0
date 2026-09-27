import type { CommandContext } from "../types/index.d.ts";
import type { DatabaseGroup } from "../types/index.d.ts";

export function cleanJid(value: unknown): string {
  return String(value || "")
    .trim()
    .split(":")[0];
}

export function getTargetJids(ctx: CommandContext): string[] {
  const context = Object.values(ctx.msg?.message ?? {})
    .map((value) => (value as Record<string, unknown>)?.contextInfo)
    .find(Boolean) as Record<string, unknown> | undefined;
  const mentioned = Array.isArray(context?.mentionedJid)
    ? (context.mentionedJid as string[])
    : [];
  const quoted = context?.participant ? [String(context.participant)] : [];
  return [...new Set([...mentioned, ...quoted].filter(Boolean))];
}

export function groupStatus(value: unknown): string {
  return value ? "✅ Activado" : "❌ Desactivado";
}

export function parseToggle(value: unknown): boolean | null {
  const normalized = String(value || "").toLowerCase();
  if (["on", "1", "true", "activar", "enable"].includes(normalized))
    return true;
  if (["off", "0", "false", "desactivar", "disable"].includes(normalized))
    return false;
  return null;
}

export function getGroupData(ctx: CommandContext): DatabaseGroup {
  return ctx.db.getGroup(ctx.from);
}

export function saveGroupData(
  ctx: CommandContext,
  data: Record<string, unknown>,
): DatabaseGroup {
  ctx.db.setGroup(ctx.from, data);
  return ctx.db.getGroup(ctx.from);
}

export function groupFrame(title: string, icon = "⚙️"): string {
  return `╭〔 ${icon} ${title} 〕⬣\n╰━━━━━━━━━━━━⬣\n\n`;
}

export function groupFooter(label = "SYSTEM INFO"): string {
  return `\n╰〔 ⚡ ${label} 〕⬣`;
}
