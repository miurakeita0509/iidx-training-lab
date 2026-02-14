import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { InputProvider } from './contexts/InputContext';
import App from './App';
import './global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <InputProvider>
      <App />
    </InputProvider>
  </StrictMode>,
);
