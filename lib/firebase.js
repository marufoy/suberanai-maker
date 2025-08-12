// lib/firebase.js
import { initializeApp, getApps, getApp, deleteApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAI, GoogleAIBackend, getGenerativeModel } from "firebase/ai";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const APP_NAME = "suberanai-web";

// デバッグトークン（ローカルのみ）
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


const existingApps = getApps();

// ★ デフォルトAppには触れず、“名前付き”だけ使う
let app = existingApps.find(a => a.name === APP_NAME);
if (!app) {
  app = initializeApp(firebaseConfig, APP_NAME);
} else if (app.options.appId !== firebaseConfig.appId) {
  // HMRで古い設定が残っていたら入れ替え
  // top-level await が使えないので即時IIFEで同期化
  (async () => {
    await deleteApp(app);
    app = initializeApp(firebaseConfig, APP_NAME);
  })();
}

// App Check はこの“名前付きapp”に対して初期化
export const ensureAppCheck = () => {
  if (typeof window === "undefined") return;
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_CLIENT_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  } catch {}
};

const db = getFirestore(app);
const ai = getAI(app, { backend: new GoogleAIBackend() });
const model = getGenerativeModel(ai, { model: "gemini-2.0-flash-lite-001" });

export { app, db, model };