// src/App.js

import React, { useState, useCallback } from 'react';
// 1. IMPORTAÇÕES DO ROTEADOR
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importe seus componentes/páginas
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard.js';
import ProdutoList from './pages/ProdutoList.js'; // Você precisará criar este componente
import ProdutoForm from './components/ProdutoForm';
import MovimentacaoForm from './components/MovimentacaoForm';
import MovimentacaoList from './components/MovimentacaoList';
import RelatorioEstoqueCritico from './components/RelatorioEstoqueCritico';
import FornecedorPage from './pages/FornecedorPage'; // Você precisará criar este
import ClientePage from './pages/ClientePage';     // Você precisará criar este
import LoginPage from './pages/LoginPage';         // Você precisará criar este
import RegisterPage from './pages/RegisterPage';   // Você precisará criar este
import ProdutoDetalhes from './pages/ProdutoDetalhes'; // Você precisará criar este
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Componente para proteger rotas que exigem login
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('authToken');
  // Se não houver token, redireciona o usuário para a página de login
  return token ? children : <Navigate to="/login" />;
};


function App() {
  // Mantemos apenas os estados globais de autenticação
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('authToken'));
  const [loggedInUser, setLoggedInUser] = useState(localStorage.getItem('username') || null);
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));

  // Função para fazer logout
  const handleLogout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    setAuthToken(null);
    setLoggedInUser(null);
    setIsAuthenticated(false);
    toast.info("Você foi desconectado.");
    // O roteador se encarregará de redirecionar
  }, []);

  // Função para lidar com o sucesso do login/registro
  const handleAuthSuccess = (token, username) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('username', username);
    setAuthToken(token);
    setLoggedInUser(username);
    setIsAuthenticated(true);
    toast.success("Login realizado com sucesso!");
  };

  return (
    // 2. ENVOLVA TODA A APLICAÇÃO COM O BrowserRouter
    <BrowserRouter>
      <div className="App">
        <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />

        {/* O Sidebar só aparece se o usuário estiver autenticado */}
        {isAuthenticated && (
          <Sidebar onLogout={handleLogout} username={loggedInUser} />
        )}
        
        <div className="main-content">
          {/* 3. DEFINA AS ROTAS DENTRO DO <Routes> */}
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/login" element={<LoginPage onAuthSuccess={handleAuthSuccess} />} />
            <Route path="/register" element={<RegisterPage onAuthSuccess={handleAuthSuccess} />} />

            {/* Rotas Privadas (só acessíveis se logado) */}
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            
            {/* ATENÇÃO: Você precisará criar estes componentes de página, movendo a lógica que estava no App.js para dentro deles */}
            <Route path="/produtos" element={<PrivateRoute><ProdutoList /></PrivateRoute>} />
            <Route path="/produtos/:id" element={<PrivateRoute><ProdutoDetalhes /></PrivateRoute>} />
            <Route path="/produtos/novo" element={<PrivateRoute><ProdutoForm /></PrivateRoute>} />
            <Route path="/produtos/editar/:id" element={<PrivateRoute><ProdutoForm /></PrivateRoute>} />
            
            <Route path="/movimentacoes" element={<PrivateRoute><MovimentacaoList /></PrivateRoute>} />
            <Route path="/movimentacoes/nova" element={<PrivateRoute><MovimentacaoForm /></PrivateRoute>} />

            <Route path="/fornecedores" element={<PrivateRoute><FornecedorPage /></PrivateRoute>} />
            <Route path="/clientes" element={<PrivateRoute><ClientePage /></PrivateRoute>} />

            <Route path="/relatorios/estoque-critico" element={<PrivateRoute><RelatorioEstoqueCritico /></PrivateRoute>} />

            {/* Rota de fallback - se não achar nenhuma rota, volta para a principal */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default AppLayout;