// pages/_app.js（抜粋）
import { useEffect } from "react";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import { ensureAppCheck } from "../lib/firebase";
import { ensureAnonAuth } from "../lib/auth";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    ensureAppCheck();
    ensureAnonAuth().catch(() => {/* noop */});
  }, []);

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_CLIENT_KEY}
      language="ja"
    >
      <Component {...pageProps} />
    </GoogleReCaptchaProvider>
  );
}