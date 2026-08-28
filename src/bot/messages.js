// ==========================================
// SAUDAÇÃO
// ==========================================

export function welcomeMessage() {
  return `Olá! Seja bem-vindo à W2V Oficina. 🏍️

Estamos localizados na:

R. Marambaia, 651
Casa Verde
São Paulo - SP (Zona Norte)

Atendemos das 9h às 17h.

Para agilizar seu atendimento, nosso assistente virtual vai te ajudar a encontrar o serviço que precisa e realizar seu agendamento.

Ao finalizar, entraremos em contato.

Muito obrigado desde já!

Das pistas para você. 🏁

Como podemos ajudar?

1 - OFICINA
2 - ESTÉTICA
3 - REMAP E PERFORMANCE
4 - W2V RACING
    (PREPARAÇÃO PARA PISTA)

Digite o número da opção desejada.`;
}


// ==========================================
// RESUMO DOS SETORES
// ==========================================

export function oficinaMessage() {
  return `🔧 *OFICINA*

• Diagnóstico eletrônico TEXA
• Revisões e manutenção preventiva
• Motor e transmissão
• Freios
• Suspensão
• Elétrica e eletrônica
• Diagnóstico e scanner
• Pneus e rodas
• Relação (corrente, coroa e pinhão)
• Instalação de acessórios

Esses são alguns dos serviços que realizamos.

Deseja continuar para o agendamento?

1 - Continuar
2 - Voltar ao menu`;
}


export function esteticaMessage() {
  return `✨ *ESTÉTICA*

• Lavagem técnica detalhada
• Proteção de pintura e carenagens
• Higienização e hidratação de bancos
• Limpeza e detalhamento de motor
• Limpeza e proteção de rodas
• Limpeza e lubrificação da relação
• Revitalização de plásticos
• Polimento de metais e escapamento
• Remoção de manchas e marcas
• Polimento técnico

Esses são alguns dos serviços que realizamos.

Deseja continuar para o agendamento?

1 - Continuar
2 - Voltar ao menu`;
}


export function remapMessage() {
  return `🏍️ *REMAP E PERFORMANCE*

• Diagnóstico eletrônico TEXA
• REMAP
• Aumento de potência e torque
• Melhor resposta do acelerador
• Entrega de potência mais linear
• Otimização da mistura ar/combustível
• Otimização do ponto de ignição
• Ajuste de limitadores eletrônicos
• Melhor aproveitamento de escape e filtro esportivo
• Ajustes personalizados para rua ou pista
• Otimização do freio-motor
• Melhor desempenho geral da motocicleta

Esses são alguns dos serviços que realizamos.

Deseja continuar para o agendamento?

1 - Continuar
2 - Voltar ao menu`;
}


export function racingMessage() {
  return `🏁 *W2V RACING*

*PREPARAÇÃO PARA PISTA*

• Instalação de UPGRADES de corrida

Montamos sua moto de rua para você vencer nas pistas.

Venha fazer uma avaliação com nossa equipe.

Deseja continuar para o agendamento?

1 - Continuar
2 - Voltar ao menu`;
}


// ==========================================
// DATA
// ==========================================

export function askDayMessage() {
  const dates = getNextAvailableDays();

  return `📅 *AGENDAMENTO*

Qual dia você gostaria de agendar?

${dates.map((item) => `${item.number} - ${item.label} (${item.date})`).join("\n")}

Digite o número correspondente ao dia desejado.`;
}


// ==========================================
// PERÍODO
// ==========================================

export function askPeriodMessage(dia) {
  return `📅 Dia escolhido: *${dia}*

Qual período seria melhor para você?

1 - Manhã (09h às 12h)
2 - Tarde (13h às 17h)

Você poderá chegar dentro desse período.`;
}


// ==========================================
// DESCRIÇÃO
// ==========================================

export function askDescriptionMessage() {
  return `🏍️ *ÚLTIMA ETAPA*

Agora envie as informações da sua moto e do serviço que deseja realizar.

Informe, se possível:

• Marca e modelo
• Ano da moto
• Problema ou serviço desejado

Pode escrever livremente em uma única mensagem.`;
}


// ==========================================
// CONFIRMAÇÃO FINAL
// ==========================================

export function confirmationMessage(client) {
  return `📋 *CONFIRA SEU AGENDAMENTO*

🏢 Serviço:
${client.setor}

📅 Data:
${client.dia}

🕐 Período:
${client.periodo}

🏍️ Informações da moto e serviço:
${client.descricao}

Está tudo correto?

1 - CONFIRMAR AGENDAMENTO
2 - VOLTAR AO MENU`;
}


// ==========================================
// SUCESSO
// ==========================================

export function successMessage() {
  return `✅ *AGENDAMENTO RECEBIDO!*

Suas informações foram enviadas para nossa equipe.

Ao finalizar a análise, entraremos em contato para confirmar o atendimento.

Obrigado por escolher a W2V Oficina! 🏍️🏁`;
}


// ==========================================
// FUNÇÕES AUXILIARES
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

  let current = new Date(today);

  while (result.length < 6) {
    current.setDate(current.getDate() + 1);

    const dayOfWeek = current.getDay();

    // Não inclui domingo
    if (dayOfWeek === 0) {
      continue;
    }

    const date = formatDate(current);

    result.push({
      number: result.length + 1,
      label: dayNames[dayOfWeek],
      date,
      isoDate: formatISODate(current),
    });
  }

  return result;
}


function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  return `${day}/${month}`;
}


function formatISODate(date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}