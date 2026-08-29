import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export type AuthRole = 'patient' | 'doctor';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: AuthRole;
  passwordHash: string;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: AuthRole;
  createdAt: string;
}

interface AuthSession {
  token: string;
  userId: string;
  expiresAt: number;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'auth-sessions.json');
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

function writeJson(filePath: string, data: unknown) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const next = crypto.scryptSync(password, salt, 64);
  const prev = Buffer.from(hash, 'hex');
  if (next.length !== prev.length) return false;
  return crypto.timingSafeEqual(next, prev);
}

function toPublicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function loadUsers(): StoredUser[] {
  return readJson<StoredUser[]>(USERS_FILE, []);
}

function saveUsers(users: StoredUser[]) {
  writeJson(USERS_FILE, users);
}

function loadSessions(): AuthSession[] {
  const sessions = readJson<AuthSession[]>(SESSIONS_FILE, []);
  const now = Date.now();
  const active = sessions.filter((s) => s.expiresAt > now);
  if (active.length !== sessions.length) writeJson(SESSIONS_FILE, active);
  return active;
}

function saveSessions(sessions: AuthSession[]) {
  writeJson(SESSIONS_FILE, sessions);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function findUserByEmail(email: string): StoredUser | undefined {
  return loadUsers().find((u) => u.email === normalizeEmail(email));
}

export function findUserById(id: string): StoredUser | undefined {
  return loadUsers().find((u) => u.id === id);
}

export function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: AuthRole;
  phone?: string;
}): PublicUser {
  const users = loadUsers();
  const email = normalizeEmail(input.email);
  if (users.some((u) => u.email === email)) {
    const err = new Error('An account with this email already exists.');
    (err as Error & { status: number }).status = 409;
    throw err;
  }

  const user: StoredUser = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email,
    phone: input.phone?.trim() || undefined,
    role: input.role,
    passwordHash: hashPassword(input.password),
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);
  return toPublicUser(user);
}

export function authenticateUser(email: string, password: string): PublicUser | null {
  const user = findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) return null;
  return toPublicUser(user);
}

export function createAuthSession(userId: string): string {
  const sessions = loadSessions();
  const token = crypto.randomBytes(32).toString('hex');
  sessions.push({
    token,
    userId,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  saveSessions(sessions);
  return token;
}

export function getUserFromToken(token: string | undefined | null): PublicUser | null {
  if (!token) return null;
  const sessions = loadSessions();
  const session = sessions.find((s) => s.token === token && s.expiresAt > Date.now());
  if (!session) return null;
  const user = findUserById(session.userId);
  return user ? toPublicUser(user) : null;
}

export function destroyAuthSession(token: string | undefined | null): void {
  if (!token) return;
  const sessions = loadSessions().filter((s) => s.token !== token);
  saveSessions(sessions);
}
