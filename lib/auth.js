// lib/auth.js
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { app } from "../lib/firebase";

const auth = getAuth(app);

export async function ensureAnonAuth() {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) await signInAnonymously(auth);
        resolve(auth.currentUser); // 匿名でもUIDが割り当てられる
      } catch (e) {
        reject(e);
      }
    });
  });
}