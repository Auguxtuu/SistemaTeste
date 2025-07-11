// src/App.js

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppLayout from './AppLayout'; // Importa o novo componente
import './App.css';

function App() {
  // A ÚNICA responsabilidade deste componente é iniciar o roteador.
  // Sem estados, sem hooks, sem lógica.
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;