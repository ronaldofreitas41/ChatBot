import express from "express";
import cors from "cors";

import {
  createWhatsApp,
  getWhatsAppStatus,
} from "./whatsapp/connection.js";

const app = express();

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());


// ========================================
// STATUS DO WHATSAPP
// ========================================

app.get("/api/whatsapp/status", (req, res) => {

  const status = getWhatsAppStatus();

  res.json({
    connected: status.connected,
    qr: status.qr,
  });

});


// ========================================
// HOME
// ========================================

app.get("/", (req, res) => {

  res.json({
    status: "online",
    service: "W2V WhatsApp Bot",
  });

});


// ========================================
// SERVIDOR
// ========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {

  console.log(
    `🚀 Servidor rodando na porta ${PORT}`
  );

  try {

    await createWhatsApp();

  } catch (error) {

    console.error(
      "❌ Erro ao iniciar WhatsApp:",
      error
    );

  }

});