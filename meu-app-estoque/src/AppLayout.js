// src/AppLayout.js

import React, { useState, useCallback } from 'react';
// BrowserRouter não é importado aqui, mas os outros componentes do roteador sim.
import { Routes, Route, Navigate } from 'react-router-dom';

// Seus imports de páginas e componentes
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard.js';
import ProdutoList from './pages/ProdutoList.js';
import ProdutoForm from './components/ProdutoForm';
import MovimentacaoForm from './components/MovimentacaoForm';
import MovimentacaoList from './components/MovimentacaoList';
import RelatorioEstoqueCritico from './components/RelatorioEstoqueCritico';
import FornecedorPage from './pages/FornecedorPage';
import ClientePage from './pages/ClientePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProdutoDetalhes from './pages/ProdutoDetalhes';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// O App.css pode ser importado aqui ou no App.js, ambos funcionam.
// import './App.css'; 

// Componente para proteger rotas que exigem login
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('authToken');
  // Se não houver token, redireciona o usuário para a página de login
  return token ? children : <Navigate to="/login" />;
};

// A função principal deste arquivo, que contém toda a lógica
function AppLayout() {
  // Estados globais de autenticação
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('authToken'));
  const [loggedInUser, setLoggedInUser] = useState(localStorage.getItem('username') || null);
  
  // Função para fazer logout
  const handleLogout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    setLoggedInUser(null);
    setIsAuthenticated(false);
    toast.info("Você foi desconectado.");
    // O redirecionamento para /login acontecerá automaticamente por causa do PrivateRoute
  }, []);

  // Função para lidar com o sucesso do login/registro
  const handleAuthSuccess = (token, username) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('username', username);
    setLoggedInUser(username);
    setIsAuthenticated(true);
    // Não precisa mais do toast aqui, pois o LoginForm já o exibe.
  };

  return (
    // A div className="App" é o container principal
    <div className="App">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />

      {/* O Sidebar só aparece se o usuário estiver autenticado */}
      {isAuthenticated && (
        <Sidebar onLogout={handleLogout} username={loggedInUser} />
      )}
      
      <div className="main-content">
        {/* As rotas da aplicação */}
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<LoginPage onAuthSuccess={handleAuthSuccess} />} />
          <Route path="/register" element={<RegisterPage onAuthSuccess={handleAuthSuccess} />} />

          {/* Rotas Privadas (só acessíveis se logado) */}
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          
          <Route path="/produtos" element={<PrivateRoute><ProdutoList /></PrivateRoute>} />
          <Route path="/produtos/:id" element={<PrivateRoute><ProdutoDetalhes /></PrivateRoute>} />
          <Route path="/produtos/novo" element={<PrivateRoute><ProdutoForm /></PrivateRoute>} />
          <Route path="/produtos/editar/:id"element={<PrivateRoute><ProdutoForm /></PrivateRoute>} />
          
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
  );
}

// Exporta o componente com o nome correto
export default AppLayout;