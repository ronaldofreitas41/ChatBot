import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  generateMessageID,
} from "@whiskeysockets/baileys";

import { rm } from "node:fs/promises";
import P from "pino";

import { handleMessage } from "./messageHandler.js";
import { pauseChat, untilEndOfDay } from "../bot/chatPauses.js";

// IDs das mensagens enviadas pelo próprio bot, para não
// confundi-las com respostas manuais do atendente.
const botMessageIds = new Set();

function trackBotMessages(sock) {

  const originalSendMessage =
    sock.sendMessage.bind(sock);

  sock.sendMessage = (jid, content, options = {}) => {

    const messageId =
      options.messageId ?? generateMessageID();

    botMessageIds.add(messageId);

    // Evita crescimento indefinido do conjunto.
    setTimeout(
      () => botMessageIds.delete(messageId),
      60 * 1000
    );

    return originalSendMessage(
      jid,
      content,
      { ...options, messageId }
    );
  };
}

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

      // A presença é controlada em bot.js: online durante o
      // atendimento (sem push no celular), offline fora dele.
      markOnlineOnConnect: false,

    });


    trackBotMessages(sock);

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


      const jid =
        message.key.remoteJid;


      if (
        !jid ||
        jid.endsWith("@g.us") ||
        jid.endsWith("@broadcast")
      ) {
        return;
      }


      if (message.key.fromMe) {

        // Mensagem enviada manualmente pelo atendente:
        // pausa o bot nesta conversa por 1 hora.

        if (botMessageIds.delete(message.key.id)) {
          return;
        }

        await pauseChat(jid, untilEndOfDay());

        console.log(
          `⏸️ Bot pausado até o fim do dia em ${jid} (resposta manual).`
        );

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