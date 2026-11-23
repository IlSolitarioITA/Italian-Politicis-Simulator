import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  !window.AndroidNative
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Fail silently in unsupported or restricted iframe environments
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
