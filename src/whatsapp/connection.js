import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
} from "@whiskeysockets/baileys";

import { rm } from "node:fs/promises";
import P from "pino";

import { handleMessage } from "./messageHandler.js";

let currentQR = null;
let connected = false;
let isStarting = false;


// ========================================
// STATUS
// ========================================

export function getWhatsAppStatus() {
  return {
    connected,
    qr: currentQR,
  };
}


// ========================================
// CRIAR WHATSAPP
// ========================================

export async function createWhatsApp() {

  if (isStarting) {
    console.log("⚠️ WhatsApp já está iniciando...");
    return;
  }

  isStarting = true;

  try {

    console.log("📱 Iniciando conexão com WhatsApp...");

    const { state, saveCreds } =
      await useMultiFileAuthState("./auth_info");


    const sock = makeWASocket({

      auth: state,

      logger: P({
        level: "silent",
      }),

      printQRInTerminal: false,

    });


    setupConnection(sock);

    setupMessages(sock);

    sock.ev.on(
      "creds.update",
      saveCreds
    );


    console.log("✅ Socket do WhatsApp criado.");

    return sock;

  } catch (error) {

    console.error(
      "❌ Erro ao criar conexão WhatsApp:"
    );

    console.error(error);

  } finally {

    isStarting = false;

  }
}


// ========================================
// CONEXÃO
// ========================================

function setupConnection(sock) {

  sock.ev.on(
    "connection.update",
    async (update) => {

      const {
        connection,
        lastDisconnect,
        qr,
      } = update;


      // ==================================
      // QR CODE
      // ==================================

      if (qr) {

        console.log(
          "📲 QR CODE RECEBIDO!"
        );

        currentQR = qr;

        connected = false;

      }


      // ==================================
      // CONECTADO
      // ==================================

      if (connection === "open") {

        connected = true;

        currentQR = null;

        console.log(
          "✅ WhatsApp conectado com sucesso!"
        );

      }


      // ==================================
      // DESCONECTADO
      // ==================================

      if (connection === "close") {

        connected = false;


        const error =
          lastDisconnect?.error;


        const statusCode =
          error?.output?.statusCode;


        console.log(
          "\n================================"
        );

        console.log(
          "❌ WHATSAPP DESCONECTADO"
        );

        console.log(
          "Status:",
          statusCode
        );

        console.log(
          "Erro:",
          error
        );

        console.log(
          "================================\n"
        );


        // ==================================
        // LOGOUT
        // ==================================

        if (
          statusCode ===
          DisconnectReason.loggedOut
        ) {

          currentQR = null;

          console.log(
            "🚫 Sessão do WhatsApp foi encerrada."
          );

          await rm("./auth_info", { recursive: true, force: true });

          console.log(
            "🧹 Dados de autenticação removidos."
          );

          return;
        }


        // ==================================
        // RECONEXÃO
        // ==================================

        console.log(
          "🔄 Tentando reconectar em 3 segundos..."
        );


        currentQR = null;


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


      if (message.key.fromMe) {
        return;
      }


      const jid =
        message.key.remoteJid;


      if (jid?.endsWith("@g.us")) {
        return;
      }


      try {

        await handleMessage(
          sock,
          message
        );

      } catch (error) {

        console.error(
          "❌ Erro ao processar mensagem:",
          error
        );

      }

    }
  );

}