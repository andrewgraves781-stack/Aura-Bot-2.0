import { connectToWhatsApp, type ConnectionOptions } from "./conection.ts";
import { db } from "./db.ts";
import { connectionLog } from "./logger.ts";
import fs from "fs";
import path from "path";
import type { ExtendedWASocket, SubBotLinkRequest } from "../types/index.d.ts";

export type LinkRequest = SubBotLinkRequest;

const activeSubBots = new Map<string, ExtendedWASocket>();

function normalizePhone(value: unknown): string {
  return String(value || "").replace(/\D/g, "");
}

function sessionNameFor(requester: string): string {
  return `sub-${String(requester).split("@")[0].replace(/\D/g, "") || "bot"}`;
}

export function getActiveSubBots(): ExtendedWASocket[] {
  return [...activeSubBots.values()];
}

function cleanSubBot(sessionName: string) {
  const socket = activeSubBots.get(sessionName);
  if (socket) {
    try {
      (socket.ev as unknown as { destroy?: () => void })?.destroy?.();
      void socket.end?.(undefined);
    } catch {
      // Ignorar errores al cerrar socket del subbot
    }
  }
  activeSubBots.delete(sessionName);
}

export function forgetActiveSubBot(sessionName: string) {
  cleanSubBot(sessionName);
}

export async function requestSubBotLink(request: LinkRequest) {
  const storedUser = db.getUser(request.requester);
  const storedPhone = normalizePhone(storedUser?.phone_number);
  const manualPhone = normalizePhone(request.phoneNumber);

  if (request.method === "code" && !storedPhone && !manualPhone) {
    throw new Error(
      "No tienes un teléfono guardado. Usa .code <número con código de país>.",
    );
  }

  const sessionName = sessionNameFor(request.requester);
  if (activeSubBots.has(sessionName)) {
    throw new Error(
      "Ya hay una vinculación de subbot en curso para este usuario.",
    );
  }

  const options: ConnectionOptions = {
    pairingMethod: request.method,
    allowPairing: true,
    pairingPhone: storedPhone || manualPhone,
    onSocketCreated: (socket) => {
      activeSubBots.set(sessionName, socket);
    },
    pairingTimeoutMs: 60_000,
    onQr: request.onQr,
    onPairingCode: request.onPairingCode,
    onConnected: request.onConnected,
    onPairingError: async (error) => {
      cleanSubBot(sessionName);
      db.deleteBot(sessionName);
      await request.onPairingError?.(error);
    },
    onPairingExpired: () => {
      cleanSubBot(sessionName);
      db.deleteBot(sessionName);
      return request.onPairingExpired?.();
    },
    onDisconnected: () => {
      cleanSubBot(sessionName);
    },
  };

  const connection = await connectToWhatsApp(sessionName, true, options);
  if (connection) activeSubBots.set(sessionName, connection);

  return sessionName;
}

function getSessionDirs(basePath: string): string[] {
  try {
    if (!fs.existsSync(basePath)) return [];
    
    const entries = fs.readdirSync(basePath, { withFileTypes: true });
    const sessionDirs: string[] = [];
    
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== "main") {
        const sessionPath = path.join(basePath, entry.name);
        // Verificar que tenga sesión SQLite válida
        const sessionDbPath = path.join(sessionPath, "session.db");
        if (fs.existsSync(sessionDbPath)) {
          sessionDirs.push(entry.name);
        }
      }
    }
    
    return sessionDirs;
  } catch (error) {
    connectionLog(
      `Error al escanear carpeta de sesiones ${basePath}: ${String(error)}`,
      "warn",
    );
    return [];
  }
}

export async function startSavedSubBots() {
  const subBotSessionBase = globalThis.subBotSession ?? "./sessions/subs";
  
  // Escanear carpeta de sesiones directamente
  const sessionDirs = getSessionDirs(subBotSessionBase);
  connectionLog(`Encontradas ${sessionDirs.length} sesiones en carpeta`, "info");
  
  // También obtener bots de DB para sincronización
  let dbBots: ReturnType<typeof db.getAllBots> = [];
  try {
    dbBots = db.getAllBots();
    connectionLog(`Encontrados ${dbBots.length} bots en base de datos`, "info");
  } catch (dbError) {
    connectionLog(
      `Error al obtener bots de la base de datos: ${String(dbError)}`,
      "warn",
    );
  }
  
  // Crear mapa de sesiones registradas en DB
  const registeredSessions = new Set<string>();
  for (const bot of dbBots) {
    if (String(bot.jid || "").startsWith("sub-")) {
      void (async () => {
        try {
          db.deleteBot(bot.jid);
        } catch (dbError) {
          connectionLog(
            `Error al limpiar bot obsoleto ${bot.jid}: ${String(dbError)}`,
            "warn",
          );
        }
      })();
      continue;
    }

    const sessionName = (bot.data as Record<string, unknown> | undefined)
      ?.sessionName as string | undefined;
    if (bot.isMain || !sessionName) continue;
    registeredSessions.add(sessionName);
  }
  
  // Iniciar todas las sesiones encontradas en carpeta
  for (const sessionName of sessionDirs) {
    if (activeSubBots.has(sessionName)) {
      connectionLog(`Sesión ${sessionName} ya está activa, omitiendo`, "info");
      continue;
    }
    
    // Iniciar conexión sin depender de que la DB esté completamente operativa
    void (async () => {
      try {
        const connection = await connectToWhatsApp(sessionName, true, {
          allowPairing: false,
          onSocketCreated: (socket) => {
            activeSubBots.set(sessionName, socket);
          },
          onDisconnected: () => {
            cleanSubBot(sessionName);
          },
        });
        if (connection) activeSubBots.set(sessionName, connection);
        connectionLog(`Subbot ${sessionName} iniciado correctamente`, "info");
      } catch (connectionError) {
        connectionLog(
          `Error al iniciar subbot ${sessionName}: ${String(connectionError)}`,
          "warn",
        );
      }
    })();
  }
  
  connectionLog(
    `Proceso de inicio de subbots completado. Total sesiones: ${sessionDirs.length}, Activas: ${activeSubBots.size}`,
    "info",
  );
}
