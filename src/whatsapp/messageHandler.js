import { getMessageText } from "../utils/messageutils.js";
import { processMessage } from "../bot/bot.js";

export async function handleMessage(sock, message) {
  const jid = message.key.remoteJid;

  const text = getMessageText(message);

  if (!text) {
    return;
  }

  console.log(
    `Mensagem recebida de ${jid}: ${text}`
  );

  await processMessage(
    sock,
    jid,
    text
  );
}