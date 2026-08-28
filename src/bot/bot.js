import { STATES } from "./states.js";

import {
  welcomeMessage,
  oficinaMessage,
  esteticaMessage,
  remapMessage,
  racingMessage,
  askDayMessage,
  askPeriodMessage,
  askDescriptionMessage,
  confirmationMessage,
  successMessage,
} from "./messages.js";

import {
  sendCompanyNotification,
} from "../services/companyNotification.js";


// ==========================================
// CLIENTES
// ==========================================

// Temporariamente armazenado em memória.
const clients = new Map();


// ==========================================
// PROCESSAMENTO PRINCIPAL
// ==========================================

export async function processMessage(
  sock,
  jid,
  text
) {

  let client = clients.get(jid);


  // ========================================
  // PRIMEIRO CONTATO
  // ========================================

  if (!client) {

    client = {
      state: STATES.MENU,

      setor: null,
      dia: null,
      diaISO: null,
      periodo: null,
      descricao: null,
    };

    clients.set(jid, client);

    await sendMessage(
      sock,
      jid,
      welcomeMessage()
    );

    return;
  }


  // ========================================
  // FLUXO
  // ========================================

  switch (client.state) {

    case STATES.MENU:

      await handleMenu(
        sock,
        jid,
        client,
        text
      );

      break;


    case STATES.CONFIRMACAO_SETOR:

      await handleConfirmacaoSetor(
        sock,
        jid,
        client,
        text
      );

      break;


    case STATES.DIA:

      await handleDia(
        sock,
        jid,
        client,
        text
      );

      break;


    case STATES.PERIODO:

      await handlePeriodo(
        sock,
        jid,
        client,
        text
      );

      break;


    case STATES.DESCRICAO:

      await handleDescricao(
        sock,
        jid,
        client,
        text
      );

      break;


    case STATES.CONFIRMACAO:

      await handleConfirmacao(
        sock,
        jid,
        client,
        text
      );

      break;


    default:

      clients.delete(jid);

      await sendMessage(
        sock,
        jid,
        welcomeMessage()
      );

      break;
  }
}


// ==========================================
// MENU PRINCIPAL
// ==========================================

async function handleMenu(
  sock,
  jid,
  client,
  text
) {

  switch (text) {

    case "1":

      client.setor = "OFICINA";
      client.state = STATES.CONFIRMACAO_SETOR;

      await sendMessage(
        sock,
        jid,
        oficinaMessage()
      );

      break;


    case "2":

      client.setor = "ESTÉTICA";
      client.state = STATES.CONFIRMACAO_SETOR;

      await sendMessage(
        sock,
        jid,
        esteticaMessage()
      );

      break;


    case "3":

      client.setor = "REMAP E PERFORMANCE";
      client.state = STATES.CONFIRMACAO_SETOR;

      await sendMessage(
        sock,
        jid,
        remapMessage()
      );

      break;


    case "4":

      client.setor = "W2V RACING";
      client.state = STATES.CONFIRMACAO_SETOR;

      await sendMessage(
        sock,
        jid,
        racingMessage()
      );

      break;


    default:

      await sendMessage(
        sock,
        jid,
        `Não entendi sua escolha.

Por favor, escolha uma opção:

1 - OFICINA
2 - ESTÉTICA
3 - REMAP E PERFORMANCE
4 - W2V RACING`
      );

      break;
  }
}


// ==========================================
// CONFIRMAÇÃO DO SETOR
// ==========================================

async function handleConfirmacaoSetor(
  sock,
  jid,
  client,
  text
) {

  if (text === "1") {

    client.state = STATES.DIA;

    await sendMessage(
      sock,
      jid,
      askDayMessage()
    );

    return;
  }


  if (text === "2") {

    client.setor = null;

    client.state = STATES.MENU;

    await sendMessage(
      sock,
      jid,
      welcomeMessage()
    );

    return;
  }


  await sendMessage(
    sock,
    jid,
    `Escolha uma opção:

1 - Continuar para o agendamento
2 - Voltar ao menu`
  );
}


// ==========================================
// DIA
// ==========================================

async function handleDia(
  sock,
  jid,
  client,
  text
) {

  const days = getNextAvailableDays();

  const selectedNumber = Number(text);

  const selectedDay =
    days.find(
      (day) => day.number === selectedNumber
    );


  if (!selectedDay) {

    await sendMessage(
      sock,
      jid,
      `Escolha um dia válido:

${days
  .map(
    (day) =>
      `${day.number} - ${day.label} (${day.date})`
  )
  .join("\n")}`
    );

    return;
  }


  client.dia = `${selectedDay.label} (${selectedDay.date})`;

  client.diaISO = selectedDay.isoDate;

  client.state = STATES.PERIODO;


  await sendMessage(
    sock,
    jid,
    askPeriodMessage(client.dia)
  );
}


// ==========================================
// PERÍODO
// ==========================================

async function handlePeriodo(
  sock,
  jid,
  client,
  text
) {

  const periodos = {
    "1": "Manhã (09h às 12h)",
    "2": "Tarde (13h às 17h)",
  };


  const periodo = periodos[text];


  if (!periodo) {

    await sendMessage(
      sock,
      jid,
      `Escolha uma opção:

1 - Manhã (09h às 12h)
2 - Tarde (13h às 17h)`
    );

    return;
  }


  client.periodo = periodo;

  client.state = STATES.DESCRICAO;


  await sendMessage(
    sock,
    jid,
    askDescriptionMessage()
  );
}


// ==========================================
// DESCRIÇÃO
// ==========================================

async function handleDescricao(
  sock,
  jid,
  client,
  text
) {

  if (!text || text.trim().length < 5) {

    await sendMessage(
      sock,
      jid,
      `Por favor, envie uma descrição um pouco mais detalhada.

Informe, se possível:

• Marca e modelo
• Ano
• Problema ou serviço desejado`
    );

    return;
  }


  // NÃO interpretamos a mensagem.
  // O cliente pode escrever livremente.

  client.descricao = text.trim();

  client.state = STATES.CONFIRMACAO;


  await sendMessage(
    sock,
    jid,
    confirmationMessage(client)
  );
}


// ==========================================
// CONFIRMAÇÃO FINAL
// ==========================================

async function handleConfirmacao(
  sock,
  jid,
  client,
  text
) {

  // ========================================
  // CONFIRMAR
  // ========================================

  if (text === "1") {

    await sendMessage(
      sock,
      jid,
      successMessage()
    );


    try {

      await sendCompanyNotification(
        sock,
        jid,
        client
      );

    } catch (error) {

      console.error(
        "Erro ao enviar notificação para empresa:",
        error
      );
    }


    // Finaliza atendimento

    clients.delete(jid);

    return;
  }


  // ========================================
  // VOLTAR AO MENU
  // ========================================

  if (text === "2") {

    clients.delete(jid);


    await sendMessage(
      sock,
      jid,
      welcomeMessage()
    );

    return;
  }


  // ========================================
  // OPÇÃO INVÁLIDA
  // ========================================

  await sendMessage(
    sock,
    jid,
    `Escolha uma opção:

1 - CONFIRMAR AGENDAMENTO
2 - VOLTAR AO MENU`
  );
}


// ==========================================
// ENVIO DE MENSAGEM
// ==========================================

async function sendMessage(
  sock,
  jid,
  text
) {

  await sock.sendMessage(
    jid,
    {
      text,
    }
  );
}


// ==========================================
// DATAS
// ==========================================

function getNextAvailableDays() {

  const result = [];

  const dayNames = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];


  const today = new Date();

  const current = new Date(today);


  while (result.length < 6) {

    current.setDate(
      current.getDate() + 1
    );


    const dayOfWeek =
      current.getDay();


    // Domingo não é atendido

    if (dayOfWeek === 0) {
      continue;
    }


    const day =
      String(
        current.getDate()
      ).padStart(2, "0");


    const month =
      String(
        current.getMonth() + 1
      ).padStart(2, "0");


    const year =
      current.getFullYear();


    result.push({

      number:
        result.length + 1,

      label:
        dayNames[dayOfWeek],

      date:
        `${day}/${month}`,

      isoDate:
        `${year}-${month}-${day}`,
    });
  }


  return result;
}