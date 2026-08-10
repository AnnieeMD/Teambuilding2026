/*
  db.js — Firebase Realtime Database helpers
  All reads use onValue() for live updates.
  All writes use set/update for atomic operations.

  DB structure:
  /registrations/{userId}  → { name, emoji, registeredAt }
  /choices/{userId}        → { roomId, carId, diet, allergies, note }
*/

import { initializeApp }                          from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getDatabase, ref, set, update, remove, onValue, get }
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

/* ── Registration ─────────────────────────────────────────── */
export async function registerUser(userId, name, emoji) {
  await set(ref(db, `registrations/${userId}`), {
    name,
    emoji,
    registeredAt: new Date().toISOString(),
  });
  saveSession({ userId, name, emoji });
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
