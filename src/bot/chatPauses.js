import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const pauseFile = fileURLToPath(
  new URL("../../data/chat-pauses.json", import.meta.url)
);

const pauses = new Map();
let loadPromise;
let writeQueue = Promise.resolve();

async function loadPauses() {
  if (!loadPromise) {
    loadPromise = readFile(pauseFile, "utf8")
      .then((content) => {
        const storedPauses = JSON.parse(content);

        for (const [jid, expiresAt] of Object.entries(storedPauses)) {
          if (Number.isFinite(expiresAt) && expiresAt > Date.now()) {
            pauses.set(jid, expiresAt);
          }
        }
      })
      .catch((error) => {
        if (error.code !== "ENOENT") {
          console.error("Erro ao carregar pausas do bot:", error);
        }
      });
  }

  await loadPromise;
}

function savePauses() {
  const content = JSON.stringify(Object.fromEntries(pauses), null, 2);
  const temporaryFile = `${pauseFile}.tmp`;

  writeQueue = writeQueue.then(async () => {
    await mkdir(dirname(pauseFile), { recursive: true });
    await writeFile(temporaryFile, content, "utf8");
    await rename(temporaryFile, pauseFile);
  });

  return writeQueue;
}

export async function pauseChat(jid) {
  await loadPauses();

  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  pauses.set(jid, expiresAt);
  await savePauses();

  return expiresAt;
}

export async function isChatPaused(jid) {
  await loadPauses();

  const expiresAt = pauses.get(jid);

  if (!expiresAt) {
    return false;
  }

  if (expiresAt <= Date.now()) {
    pauses.delete(jid);
    await savePauses();
    return false;
  }

  return true;
}