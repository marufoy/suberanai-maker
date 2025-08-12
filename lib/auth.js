// lib/auth.js
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";

export async function ensureAnonAuth() {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (u) => {
      try {
        if (!u) await signInAnonymously(auth);
        resolve(auth.currentUser);
      } catch (e) { reject(e); }
    });
  });
}