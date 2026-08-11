/*
  db.js — Firebase Realtime Database helpers
  All reads use onValue() for live updates.
  All writes use set/update for atomic operations.

  DB structure:
  /registrations/{userId}  → { name, emoji, passwordHash, registeredAt }
  /choices/{userId}        → { roomId, carId, diet, allergyNote }
  /cars/{carId}            → { id, name, capacity, departure, from, note, ownerId, ownerName, addedAt }
*/

import { initializeApp }                          from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getDatabase, ref, set, update, remove, onValue, get, push }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';

const app = initializeApp(FIREBASE_CONFIG);   // FIREBASE_CONFIG loaded from firebase-config.js
const db  = getDatabase(app);

/* ── Session helpers (localStorage) ───────────────────────── */
const SESSION_KEY = 'tb_user';

export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}

export function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/* ── Password hashing (SHA-256 via Web Crypto) ────────────────
   We never store the raw password — only its hash. Note: with
   public read rules the hashes are visible, so this stops casual
   impersonation, not a determined attacker. Don't reuse a real
   password here. */
async function hashPassword(password) {
  const data   = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/* ── Registration ─────────────────────────────────────────── */
export async function registerUser(userId, name, emoji, password) {
  await set(ref(db, `registrations/${userId}`), {
    name,
    emoji,
    passwordHash: await hashPassword(password),
    registeredAt: new Date().toISOString(),
  });
  saveSession({ userId, name, emoji });
}

/* ── Login ────────────────────────────────────────────────────
   Find the registration by name and verify the password against
   the stored hash. Accounts created before passwords existed
   (no passwordHash) are allowed in with name only, so nobody is
   locked out. Return codes let the UI show the right message:
     { ok: true, session }
     { ok: false, reason: 'not_found' | 'wrong_password' } */
export async function loginUser(name, password) {
  const snap = await get(ref(db, 'registrations'));
  const all  = snap.exists() ? snap.val() : {};
  const wanted = name.trim().toLowerCase();

  const match = Object.entries(all).find(
    ([, reg]) => reg.name && reg.name.trim().toLowerCase() === wanted
  );
  if (!match) return { ok: false, reason: 'not_found' };

  const [userId, reg] = match;

  // Legacy account with no password set — allow name-only login.
  if (reg.passwordHash) {
    const attempt = await hashPassword(password || '');
    if (attempt !== reg.passwordHash) return { ok: false, reason: 'wrong_password' };
  }

  const session = { userId, name: reg.name, emoji: reg.emoji };
  saveSession(session);
  return { ok: true, session };
}

/* Returns a snapshot of all registrations once */
export async function getRegistrations() {
  const snap = await get(ref(db, 'registrations'));
  return snap.exists() ? snap.val() : {};
}

/* Live subscription — cb called immediately + on every change */
export function onRegistrations(cb) {
  return onValue(ref(db, 'registrations'), snap => cb(snap.exists() ? snap.val() : {}));
}

/* ── Choices ──────────────────────────────────────────────── */
export async function saveChoices(userId, choices) {
  await update(ref(db, `choices/${userId}`), choices);
}

/* Remove specific fields from a user's choices (pass an object with null values)
   or wipe only the meal-related fields */
export async function clearMealChoice(userId) {
  await update(ref(db, `choices/${userId}`), { diet: null, allergyNote: null });
}

/* ── User-added cars ──────────────────────────────────────────
   Demo cars live in data/cars.json; these are cars volunteers add
   live. Stored under /cars/{carId} with an ownerId so only the
   person who added a car can remove it. */
export async function addCar(car) {
  // carId: stable, unique per push
  const carId = push(ref(db, 'cars')).key;
  await set(ref(db, `cars/${carId}`), { ...car, id: carId, addedAt: new Date().toISOString() });
  return carId;
}

/* Remove a car and detach any passengers who had joined it. */
export async function removeCar(carId) {
  // Clear carId from anyone seated in it
  const snap = await get(ref(db, 'choices'));
  const choices = snap.exists() ? snap.val() : {};
  const updates = {};
  Object.entries(choices).forEach(([uid, c]) => {
    if (c && c.carId === carId) updates[`choices/${uid}/carId`] = null;
  });
  updates[`cars/${carId}`] = null;
  await update(ref(db), updates);
}

/* Live subscription to user-added cars → array (may be empty) */
export function onCars(cb) {
  return onValue(ref(db, 'cars'), snap => {
    const val = snap.exists() ? snap.val() : {};
    cb(Object.values(val));
  });
}

export function onChoices(cb) {
  return onValue(ref(db, 'choices'), snap => cb(snap.exists() ? snap.val() : {}));
}

export function onAllData(cb) {
  // Fires whenever registrations OR choices change
  let regs = {}, choices = {};
  const merge = () => cb(regs, choices);
  onValue(ref(db, 'registrations'), s => { regs    = s.exists() ? s.val() : {}; merge(); });
  onValue(ref(db, 'choices'),       s => { choices = s.exists() ? s.val() : {}; merge(); });
}

/* ── Derived helpers ─────────────────────────────────────── */

/** Returns array of { userId, name, emoji } for everyone in a room */
export function occupantsOfRoom(roomId, regs, choices) {
  return Object.entries(choices)
    .filter(([, c]) => c.roomId === roomId)
    .map(([uid]) => regs[uid])
    .filter(Boolean);
}

/** Returns array of { userId, name, emoji } for everyone in a car */
export function occupantsOfCar(carId, regs, choices) {
  return Object.entries(choices)
    .filter(([, c]) => c.carId === carId)
    .map(([uid]) => regs[uid])
    .filter(Boolean);
}

/** Returns meal choice object for a userId */
export function mealOf(userId, choices) {
  return choices[userId] || {};
}
