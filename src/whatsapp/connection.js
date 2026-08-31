import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
} from "@whiskeysockets/baileys";

import P from "pino";
import QRCode from "qrcode";

import { handleMessage } from "./messageHandler.js";

export async function createWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");

  const sock = makeWASocket({
    auth: state,

    logger: P({
      level: "silent",
    }),

    printQRInTerminal: false,
  });

  setupConnection(sock);

  setupMessages(sock);

  sock.ev.on("creds.update", saveCreds);

  return sock;
}

// ========================================
// CONEXÃO
// ========================================

function setupConnection(sock) {
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("\n========== QR CODE ==========\n");

      const qrString = await QRCode.toString(qr, {
        type: "terminal",
        small: true,
      });

      console.log(qrString);

      console.log("\n=============================\n");
    }

    // CONECTADO
    if (connection === "open") {
      console.log("\nWhatsApp conectado com sucesso! ✅\n");
    }

    // DESCONECTADO
    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;

      if (statusCode !== DisconnectReason.loggedOut) {
        console.log("Conexão perdida. Reconectando...");

        createWhatsApp();
      } else {
        console.log("WhatsApp desconectado. ❌");
      }
    }
  });
}

// ========================================
// MENSAGENS
// ========================================

function setupMessages(sock) {
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const message = messages[0];

    if (!message?.message) {
      return;
    }

    // Ignora mensagens enviadas pelo próprio bot
    if (message.key.fromMe) {
      return;
    }

    const jid = message.key.remoteJid;

    // Ignora grupos
    if (jid?.endsWith("@g.us")) {
      return;
    }

    await handleMessage(sock, message);
  });
}
