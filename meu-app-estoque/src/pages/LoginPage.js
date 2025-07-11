// src/pages/LoginPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm'; // Importa o componente do formulário

function LoginPage({ onAuthSuccess }) {
  const navigate = useNavigate();

  return (
    <div className="auth-container">
      <h1>Login</h1>
      <p>Acesse o painel com suas credenciais.</p>
      
      {/* O componente de formulário é usado aqui */}
      <LoginForm onAuthSuccess={onAuthSuccess} />
      
      <button onClick={() => navigate('/register')} className="btn-link">
        Não tem uma conta? Registre-se
      </button>
    </div>
  );
}

export default LoginPage;