// lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAI, GoogleAIBackend, getGenerativeModel } from "firebase/ai";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// ローカル開発用デバッグ（本番では無効）
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_APPCHECK_DEBUG === "true") {
  // eslint-disable-next-line no-undef
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = "f3332bb0-59ac-4bf0-8246-5e283754814a";
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ★ デフォルトApp（[DEFAULT]）で初期化
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// App Check 初期化（クライアントのみ）
export const ensureAppCheck = () => {
  if (typeof window === "undefined") return;
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_CLIENT_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  } catch {
    // 二重初期化回避
  }
};

// 共有インスタンス
const db = getFirestore(app);
const auth = getAuth(app);
const ai = getAI(app, { backend: new GoogleAIBackend() });
const model = getGenerativeModel(ai, { model: "gemini-2.0-flash-lite-001" });

// （一時デバッグ用。揃ったら消してOK）
console.log("[Firebase] APP_ID:", app.options.appId);

export { app, db, auth, model };