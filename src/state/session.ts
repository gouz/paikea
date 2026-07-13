import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Message } from "../types";

const SESSION_DIR = join(process.env.HOME ?? "~", ".paikea", "sessions");

export interface Session {
  id: string;
  date: string;
  model: string;
  messages: Message[];
}

function ensureSessionDir() {
  mkdirSync(SESSION_DIR, { recursive: true });
}

export function saveSession(session: Session) {
  ensureSessionDir();
  const filePath = join(SESSION_DIR, `${session.id}.json`);
  writeFileSync(filePath, JSON.stringify(session, null, 2));
}

export function createSessionId(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}
