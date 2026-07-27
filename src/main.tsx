import "@fontsource-variable/instrument-sans";
import "@fontsource/ibm-plex-mono/latin-500.css";

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  const lastReload = Number(sessionStorage.getItem('scrimstats-preload-reload') || 0);
  if (Date.now() - lastReload > 30_000) {
    sessionStorage.setItem('scrimstats-preload-reload', String(Date.now()));
    window.location.reload();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
