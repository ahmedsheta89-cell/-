import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { testFirestoreConnection } from './infrastructure/firebase/firebaseClient.ts';

// Test Firebase connection on boot
testFirestoreConnection();

// Clear legacy caches from v1/v2 immediately
if (typeof window !== 'undefined' && 'caches' in window) {
  const CURRENT_VERSION = 'v3.2.0';
  caches.keys().then((keys) => {
    keys.forEach((key) => {
      if (!key.includes(CURRENT_VERSION)) {
        console.log('[App] Evicting stale cache:', key);
        caches.delete(key);
      }
    });
  });
}

// Register and aggressively update Service Worker for seamless live deployments
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        // Force check for fresh service worker on server
        reg.update();
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                newWorker.postMessage('SKIP_WAITING');
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn('PWA Service Worker registration failed:', err);
      });

    // Auto-reload once when a new service worker takes over
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
