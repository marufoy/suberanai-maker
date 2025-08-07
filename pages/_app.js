// pages/_app.js
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import Script from 'next/script';
import '../styles/globals.css';

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