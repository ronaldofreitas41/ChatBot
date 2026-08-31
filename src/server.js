import express from "express";
import cors from "cors";

import {
  createWhatsApp,
  getWhatsAppStatus,
} from "./whatsapp/connection.js";


const app = express();


// ========================================
// MIDDLEWARE
// ========================================

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());


// ========================================
// STATUS
// ========================================

app.get("/api/whatsapp/status", (req, res) => {

  const status =
    getWhatsAppStatus();


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

const PORT =
  process.env.PORT || 3000;


app.listen(
  PORT,
  () => {

    console.log(
      `🚀 Servidor rodando na porta ${PORT}`
    );

    createWhatsApp();

  }
);