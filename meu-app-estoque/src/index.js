// JEITO NOVO E CORRETO - USE ESTE CÓDIGO
import React from 'react';
import ReactDOM from 'react-dom/client'; // Note a mudança para 'react-dom/client'
import './index.css';
import App from './App';

// Cria a "raiz" da aplicação
const root = ReactDOM.createRoot(document.getElementById('root'));

// Renderiza a aplicação dentro da raiz
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);