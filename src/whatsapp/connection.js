import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
} from "@whiskeysockets/baileys";

import P from "pino";
import qrcode from "qrcode-terminal";

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
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.clear();

      console.log("\n");
      console.log("========================================");
      console.log("       ESCANEIE O QR CODE");
      console.log("       WHATSAPP - W2V OFICINA");
      console.log("========================================");
      console.log("\n");

      qrcode.generate(qr, {
        small: true,
      });

      console.log("\n");
      console.log("========================================");
      console.log(" Abra o WhatsApp > Dispositivos conectados");
      console.log(" e escaneie o código acima.");
      console.log("========================================");
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
