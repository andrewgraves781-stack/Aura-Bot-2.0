import type { CommandContext, CommandPlugin } from "../../types/index.d.ts";
import { forgetActiveSubBot } from "../../core/subbotManager.ts";

export default {
  name: ["logout", "cerrar", "cerrarsesion", "desconectar"],
  description: "Cierra la sesión del bot desde su propio número.",
  category: "socket",
  botUserOnly: true,
  privateOnly: true,

  async run({ reply, sock, db }: CommandContext) {
    await reply({ text: "⏳ Cerrando la sesión de este bot..." });
    sock.manualLogout = true;
    forgetActiveSubBot(String(sock.sessionName || ""));

    try {
      await sock.logout();
    } catch (error: unknown) {
      sock.manualLogout = false;
      db.setBot(String(sock.user?.id || sock.sessionName || ""), {
        status: "offline",
      });
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      await reply({
        text: `❌ No se pudo cerrar la sesión: ${message}`,
      });
    }
  },
} satisfies CommandPlugin;
