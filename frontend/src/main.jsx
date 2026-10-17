import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { LibraryProvider } from './context/LibraryContext.jsx';
import './index.css';

// Punto de entrada de la plataforma
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LibraryProvider>
        <App />
      </LibraryProvider>
    </BrowserRouter>
  </StrictMode>
);
