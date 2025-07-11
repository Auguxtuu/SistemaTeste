// src/pages/RegisterPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm'; // Importa o componente do formulário

function RegisterPage({ onAuthSuccess }) {
  const navigate = useNavigate();

  return (
    <div className="auth-container">
      <h1>Crie sua Conta</h1>
      <p>Preencha os dados para se registrar.</p>

      {/* O componente de formulário é usado aqui */}
      <RegisterForm onAuthSuccess={onAuthSuccess} />

      <button onClick={() => navigate('/login')} className="btn-link">
        Já tem uma conta? Faça login
      </button>
    </div>
  );
}

export default RegisterPage;