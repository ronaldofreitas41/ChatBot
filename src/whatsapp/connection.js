import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
} from "@whiskeysockets/baileys";

import P from "pino";

import { handleMessage } from "./messageHandler.js";

// QR atual
let currentQR = null;

// Status da conexão
let isConnected = false;


// ========================================
// CRIAR CONEXÃO
// ========================================

export async function createWhatsApp() {

  console.log("🔄 Iniciando WhatsApp...");

  const { state, saveCreds } =
    await useMultiFileAuthState("./auth_info");

  console.log("🔐 Auth carregado.");


  const sock = makeWASocket({

    auth: state,

    logger: P({
      level: "silent",
    }),

    // NÃO imprimir QR no terminal
    printQRInTerminal: false,

  });


  setupConnection(sock);

  setupMessages(sock);


  sock.ev.on(
    "creds.update",
    saveCreds
  );


  return sock;
}


// ========================================
// CONEXÃO
// ========================================

function setupConnection(sock) {

  sock.ev.on(
    "connection.update",
    (update) => {

      const {
        connection,
        lastDisconnect,
        qr,
      } = update;


      // ====================================
      // QR CODE
      // ====================================

      if (qr) {

        currentQR = qr;

        isConnected = false;

        console.log(
          "📱 Novo QR Code disponível."
        );

      }


      // ====================================
      // CONECTADO
      // ====================================

      if (connection === "open") {

        currentQR = null;

        isConnected = true;

        console.log(
          "✅ WhatsApp conectado!"
        );

      }


      // ====================================
      // DESCONECTADO
      // ====================================

      if (connection === "close") {

        isConnected = false;


        const statusCode =
          lastDisconnect
            ?.error
            ?.output
            ?.statusCode;


        // Usuário deslogou
        if (
          statusCode ===
          DisconnectReason.loggedOut
        ) {

          currentQR = null;

          console.log(
            "❌ WhatsApp deslogado."
          );

          return;
        }


        console.log(
          "🔄 WhatsApp desconectado. Reconectando..."
        );


        setTimeout(() => {

          createWhatsApp();

        }, 3000);

      }

    }
  );

}


// ========================================
// MENSAGENS
// ========================================

function setupMessages(sock) {

  sock.ev.on(
    "messages.upsert",
    async ({ messages }) => {

      const message = messages[0];


      if (!message?.message) {
        return;
      }


      // Ignora mensagens próprias
      if (message.key.fromMe) {
        return;
      }


      const jid =
        message.key.remoteJid;


      // Ignora grupos
      if (
        jid?.endsWith("@g.us")
      ) {

        return;

      }


      try {

        await handleMessage(
          sock,
          message
        );

      } catch (error) {

        console.error(
          "Erro ao processar mensagem:",
          error
        );

      }

    }
  );

}


// ========================================
// GET QR
// ========================================

export function getCurrentQR() {

  return currentQR;

}


// ========================================
// STATUS
// ========================================

export function getWhatsAppStatus() {

  return {

    connected: isConnected,

    qr: currentQR,

  };

}