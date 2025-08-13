// pages/_app.js
import "modern-css-reset";
import "../styles/globals.css";
import { useEffect } from "react";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import { ensureAppCheck } from "../lib/firebase";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // クライアントでだけ App Check を初期化
    if (typeof window !== "undefined") {
      ensureAppCheck();
    }
  }, []);

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_CLIENT_KEY}
      language="ja"
      // recommended: scriptProps={{ async: true, defer: true }}
    >
      <Component {...pageProps} />
    </GoogleReCaptchaProvider>
  );
}