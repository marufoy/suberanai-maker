// lib/auth.js
import { auth } from "../lib/firebase";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";

/** 匿名サインインを保証。完了して user が入るまで resolve しない */
export function ensureAnonAuth() {
  return new Promise((resolve, reject) => {
    if (auth.currentUser) return resolve(auth.currentUser);

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) { unsub(); resolve(user); }
    });

    signInAnonymously(auth).catch((err) => {
      unsub();
      reject(err);
    });
  });
}