import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { Toaster } from './components/shell/Toaster';
import './components/shell/shell.css';
import "@fontsource/tiro-devanagari-hindi/400.css";
import "@fontsource/tiro-bangla/400.css";
import "@fontsource/mukta/400.css";
import "@fontsource/mukta/500.css";
import "@fontsource/mukta/600.css";
import "@fontsource/hind-siliguri/400.css";
import "@fontsource/hind-siliguri/500.css";
import "@fontsource/hind-siliguri/600.css";
import './index.css';
import { LangProvider } from './i18n/lang';
import './lib/install';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LangProvider>
      <App />
      <Toaster />
    </LangProvider>
  </StrictMode>,
);

// Offline support on the published site (see public/sw.js)
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}
