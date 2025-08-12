// pages/_app.js
import 'modern-css-reset'; // ← リセットCSSを読み込み
import '../styles/globals.css';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import Script from 'next/script';

export default function App({ Component, pageProps }) {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_CLIENT_KEY}
      language="ja"
    >
      <Component {...pageProps} />
    </GoogleReCaptchaProvider>
  );
}