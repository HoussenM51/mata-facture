import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // <--- AJOUTE CETTE LIGNE ICI
import App from './App';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initSettings, requestPersistence, populateTestData } from './db';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");

const initApp = async () => {
  try {
    await initSettings();
    await populateTestData();
    await requestPersistence();
    
    // Utilisation d'un chemin relatif pour le Service Worker (important pour GitHub Pages)
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js', { scope: './' })
          .then(registration => console.log('SW MadaFacture registered:', registration))
          .catch(error => console.log('SW registration failed:', error));
      });
    }

    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Failed to initialize app:", error);
  }
};

initApp();
