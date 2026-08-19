window.storage = {
  get: async (key, shared) => {
    const v = localStorage.getItem(key);
    return v ? { key, value: v, shared } : null;
  },
  set: async (key, value, shared) => {
    localStorage.setItem(key, value);
    return { key, value, shared };
  },
  delete: async (key, shared) => {
    localStorage.removeItem(key);
    return { key, deleted: true, shared };
  },
  list: async (prefix, shared) => ({ keys: Object.keys(localStorage).filter(k => !prefix || k.startsWith(prefix)), prefix, shared }),
};
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
