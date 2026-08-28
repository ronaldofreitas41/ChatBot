import "dotenv/config";


async function sendCompanyNotification(
  sock,
  clientJid,
  client
) {

  const phones = [
    process.env.EMPRESA_1,
    process.env.EMPRESA_2,
  ].filter(Boolean);


  const clientPhone =
    clientJid.replace(
      "@s.whatsapp.net",
      ""
    );


  const message = `
🚨 *NOVO AGENDAMENTO*

📱 Cliente:
+${clientPhone}

📅 Dia:
${client.dia}

🕐 Período:
${client.periodo}

🏢 Setor:
${client.setor}

🏍️ Descrição:
${client.descricao}

O cliente confirmou o agendamento pelo WhatsApp.
`;


  for (const phone of phones) {

    const jid =
      `${phone}@s.whatsapp.net`;

    try {

      await sock.sendMessage(jid, {
        text: message,
      });

      console.log(
        `Agendamento enviado para ${phone}`
      );

    } catch (error) {

      console.error(
        `Erro ao enviar para ${phone}`,
        error
      );
    }
  }
}


export {
  sendCompanyNotification,
};