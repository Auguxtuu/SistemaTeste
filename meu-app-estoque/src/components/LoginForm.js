// src/components/LoginForm.js
import React, { useState } from 'react';
import styles from '../CSSs/LoginForm.module.css';
import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:5000';

function LoginForm({ onLoginSuccess, onRegisterClick }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "Email é obrigatório.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido.";
    }
    if (!formData.password) {
      newErrors.password = "Senha é obrigatória.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Por favor, corrija os erros no formulário.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao fazer login.');
      }

      toast.success(result.message);
      if (onLoginSuccess) {
        onLoginSuccess(result.token, result.username); // PASSA O TOKEN E O USERNAME
      }
    } catch (error) {
      console.error("Erro no login:", error);
      toast.error("Erro no login: " + (error.message || "Credenciais inválidas."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Login</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
          />
          {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Senha:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
          />
          {errors.password && <span className={styles.errorMessage}>{errors.password}</span>}
        </div>

        <div className={styles.buttonContainer}>
          <button type="submit" className={styles.buttonPrimary} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
          <p className={styles.registerLink}>
            Não tem uma conta?{' '}
            <button type="button" onClick={onRegisterClick} className={styles.linkButton}>
              Registre-se aqui
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}

export default LoginForm;