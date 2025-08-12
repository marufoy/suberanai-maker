// pages/_app.js
import 'modern-css-reset'; // ← リセットCSSを読み込み
import '../styles/globals.css';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { useEffect } from 'react';
import Script from 'next/script';
import { ensureAppCheck } from '../lib/firebase';

export default function App({ Component, pageProps }) {

  useEffect(() => {
    if (typeof window !== 'undefined') {
      ensureAppCheck();
    }
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