// lib/auth.js
import { auth } from "./firebase";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";

let _signedIn = false;

/**
 * 匿名ログインを保証する（未ログインなら匿名でログイン）
 * SSR では動かさないこと（呼ぶ側でクライアント限定に）
 */
export const ensureAnonAuth = () =>
  new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve(); // SSR回避

    if (_signedIn && auth.currentUser) return resolve(auth.currentUser);

    const unsub = onAuthStateChanged(
      auth,
      async (user) => {
        if (user) {
          _signedIn = true;
          unsub();
          resolve(user);
        } else {
          try {
            await signInAnonymously(auth);
          } catch (e) {
            console.error("匿名ログイン失敗:", e);
            unsub();
            reject(e);
          }
        }
      },
      (err) => {
        console.error("onAuthStateChanged エラー:", err);
        unsub();
        reject(err);
      }
    );
  });