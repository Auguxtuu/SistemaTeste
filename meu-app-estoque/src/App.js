// src/App.js <-- SEU ARQUIVO PRINCIPAL

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppLayout from './AppLayout'; // Importa o componente com toda a lógica
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;