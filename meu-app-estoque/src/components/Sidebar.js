// src/components/Sidebar.js

import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaTachometerAlt, FaBoxOpen, FaExchangeAlt, FaChartLine, FaTruck, FaUsers, FaSignOutAlt } from 'react-icons/fa';
import './Sidebar.css'; // Vamos criar este arquivo de CSS a seguir

// O componente recebe 'username' e a função 'onLogout' como props do App.js
function Sidebar({ username, onLogout }) {
  return (
    <div className="sidebar-container">
      <div className="sidebar-header">
        <h3>Controle de Estoque</h3>
        <p>Bem-vindo(a), {username}!</p>
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li>
            {/* O 'end' na NavLink do Dashboard é importante para que ele não fique ativo em todas as outras rotas que começam com "/" */}
            <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} end>
              <FaTachometerAlt />
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/produtos" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              <FaBoxOpen />
              <span>Produtos</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/movimentacoes" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              <FaExchangeAlt />
              <span>Movimentações</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/fornecedores" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              <FaTruck />
              <span>Fornecedores</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/clientes" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              <FaUsers />
              <span>Clientes</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/relatorios/estoque-critico" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              <FaChartLine />
              <span>Relatório Crítico</span>
            </NavLink>
          </li>
        </ul>
      </nav>
      <div className="sidebar-footer">
        <button onClick={onLogout} className="logout-button">
          <FaSignOutAlt />
          <span>Sair (Logout)</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;