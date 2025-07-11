// src/components/LoginForm.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
// Se você tiver um CSS para formulários, importe aqui
// import '../CSSs/Form.css'; 

const API_BASE_URL = 'http://localhost:5000';

function LoginForm({ onAuthSuccess }) {
  // 1. Estados locais para controlar os inputs e o estado de carregamento
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // 2. Função de envio do formulário completa
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.warn('Por favor, preencha o email e a senha.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Login bem-sucedido!');
        // Chama a função do App.js para atualizar o estado global de autenticação
        onAuthSuccess(data.token, data.username);
        // Navega para o Dashboard após o sucesso
        navigate('/');
      } else {
        // Mostra a mensagem de erro que vem da API
        toast.error(data.message || 'Falha no login. Verifique suas credenciais.');
      }
    } catch (error) {
      console.error('Erro de conexão:', error);
      toast.error('Não foi possível conectar ao servidor. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. JSX completo do formulário
  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="form-group">
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seuemail@exemplo.com"
          required
          disabled={isLoading}
        />
      </div>
      <div className="form-group">
        <label htmlFor="login-password">Senha</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Sua senha"
          required
          disabled={isLoading}
        />
      </div>
      <button type="submit" className="btn-primary" disabled={isLoading}>
        {isLoading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}

export default LoginForm;