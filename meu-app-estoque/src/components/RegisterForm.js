// src/components/RegisterForm.js
import React, { useState } from 'react';
import styles from '..CSSs/RegisterForm.module.css';
import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:5000';

// RegisterForm NÃO RECEBE getAuthHeaders (não precisa, pois não faz requisição protegida)
function RegisterForm({ onRegistrationSuccess, onLoginClick }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
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
    if (!formData.username) newErrors.username = "Nome de usuário é obrigatório.";
    if (!formData.email) {
      newErrors.email = "Email é obrigatório.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido.";
    }
    if (!formData.password) {
      newErrors.password = "Senha é obrigatória.";
    } else if (formData.password.length < 6) {
      newErrors.password = "A senha deve ter no mínimo 6 caracteres.";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem.";
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
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // Não precisa de getAuthHeaders aqui, pois não é rota protegida
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao registrar usuário.');
      }

      toast.success(result.message);
      if (onRegistrationSuccess) {
        onRegistrationSuccess();
      }
    } catch (error) {
      console.error("Erro no registro:", error);
      toast.error("Erro no registro: " + (error.message || "Tente novamente."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Registrar Novo Usuário</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Nome de Usuário:</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className={`${styles.input} ${errors.username ? styles.inputError : ''}`}
          />
          {errors.username && <span className={styles.errorMessage}>{errors.username}</span>}
        </div>
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
        <div className={styles.formGroup}>
          <label className={styles.label}>Confirmar Senha:</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
          />
          {errors.confirmPassword && <span className={styles.errorMessage}>{errors.confirmPassword}</span>}
        </div>

        <div className={styles.buttonContainer}>
          <button type="submit" className={styles.buttonPrimary} disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar'}
          </button>
          <p className={styles.loginLink}>
            Já tem uma conta?{' '}
            <button type="button" onClick={onLoginClick} className={styles.linkButton}>
              Faça login aqui
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}

export default RegisterForm;