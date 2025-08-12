// lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";                // ★ 追加
import { getAI, GoogleAIBackend, getGenerativeModel } from "firebase/ai";
import { initializeAppCheck, ReCaptchaV3Provider, getToken } from "firebase/app-check";

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

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);                               // ★ 追加

let _ai, _model, _appCheckInit;

export const ensureAppCheck = async () => {
  if (typeof window === "undefined") return;
  if (!_appCheckInit) {
    _appCheckInit = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_CLIENT_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  }
  try { await getToken(_appCheckInit, false); } catch (e) {
    console.warn("App Check token取得に失敗:", e);
  }
};

export const getModel = async () => {
  await ensureAppCheck();
  if (!_ai) _ai = getAI(app, { backend: new GoogleAIBackend() });
  if (!_model) _model = getGenerativeModel(_ai, { model: "gemini-2.0-flash-lite-001" });
  return _model;
};

export { app, db, auth };                               