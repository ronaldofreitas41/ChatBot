import { createWhatsApp } from "./whatsapp/connection.js";

async function main() {
  await createWhatsApp();
}

main();