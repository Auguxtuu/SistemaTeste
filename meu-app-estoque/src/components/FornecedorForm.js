// src/components/FornecedorForm.js
import React, { useState, useEffect } from 'react';
import styles from '../CSSs/FornecedorForm.module.css';
import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:5000';

function FornecedorForm({ fornecedorParaEditar, onSaveSuccess, onCancel, getAuthHeaders }) { // RECEBE getAuthHeaders
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    endereco: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (fornecedorParaEditar && fornecedorParaEditar.id) {
      setFormData({
        nome: fornecedorParaEditar.nome || '',
        cnpj: fornecedorParaEditar.cnpj || '',
        email: fornecedorParaEditar.email || '',
        telefone: fornecedorParaEditar.telefone || '',
        endereco: fornecedorParaEditar.endereco || ''
      });
      setErrors({});
    } else {
      setFormData({
        nome: '', cnpj: '', email: '', telefone: '', endereco: ''
      });
      setErrors({});
    }
  }, [fornecedorParaEditar]);

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

  const validateCnpj = (cnpj) => {
    cnpj = cnpj.replace(/[^\d]+/g, '');

    if (cnpj === '') return true;
    if (cnpj.length !== 14) return false;

    if (cnpj === "00000000000000" ||
        cnpj === "11111111111111" ||
        cnpj === "22222222222222" ||
        cnpj === "33333333333333" ||
        cnpj === "44444444444444" ||
        cnpj === "55555555555555" ||
        cnpj === "66666666666666" ||
        cnpj === "77777777777777" ||
        cnpj === "88888888888888" ||
        cnpj === "99999999999999")
        return false;

    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
        soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
        if (pos < 2) pos = 9;
    }
    let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado !== parseInt(digitos.charAt(0))) return false;

    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
        soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
        if (pos < 2) pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado !== parseInt(digitos.charAt(1))) return false;

    return true;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nome) newErrors.nome = "Nome é obrigatório.";
    
    if (formData.cnpj) {
      if (!validateCnpj(formData.cnpj)) {
        newErrors.cnpj = "CNPJ inválido.";
      }
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido.";
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

    const method = fornecedorParaEditar && fornecedorParaEditar.id ? 'PUT' : 'POST';
    const url = fornecedorParaEditar && fornecedorParaEditar.id ? `${API_BASE_URL}/fornecedores/${fornecedorParaEditar.id}` : `${API_BASE_URL}/fornecedores`;

    try {
      const dataToSend = { ...formData };
      if (dataToSend.cnpj) {
        dataToSend.cnpj = dataToSend.cnpj.replace(/[^\d]/g, '');
      }

      const response = await fetch(url, {
        method: method,
        headers: getAuthHeaders(), // USA getAuthHeaders
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar o fornecedor');
      }

      const result = await response.json();
      toast.success(result.message);
      if (onSaveSuccess) { onSaveSuccess(); }
      if (!(fornecedorParaEditar && fornecedorParaEditar.id)) {
        setFormData({ nome: '', cnpj: '', email: '', telefone: '', endereco: '' });
        setErrors({});
      }

    } catch (error) {
      console.error("Erro ao salvar fornecedor:", error);
      toast.error("Erro: " + error.message);
    }
  };

  const formatCnpj = (value) => {
    if (!value) return value;
    const digits = value.replace(/[^\d]/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
  };


  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>{fornecedorParaEditar && fornecedorParaEditar.id ? 'Editar Fornecedor' : 'Adicionar Novo Fornecedor'}</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Nome:</label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            className={`${styles.input} ${errors.nome ? styles.inputError : ''}`}
          />
          {errors.nome && <span className={styles.errorMessage}>{errors.nome}</span>}
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>CNPJ:</label>
          <input
            type="text"
            name="cnpj"
            value={formatCnpj(formData.cnpj)}
            onChange={handleChange}
            className={`${styles.input} ${errors.cnpj ? styles.inputError : ''}`}
            maxLength="18"
          />
          {errors.cnpj && <span className={styles.errorMessage}>{errors.cnpj}</span>}
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
          <label className={styles.label}>Telefone:</label>
          <input
            type="text"
            name="telefone"
            value={formData.telefone}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
          <label className={styles.label}>Endereço:</label>
          <textarea
            name="endereco"
            value={formData.endereco}
            onChange={handleChange}
            rows="3"
            className={styles.textarea}
          ></textarea>
        </div>

        <div className={styles.buttonContainer}>
          <button type="submit" className={styles.buttonPrimary}>
            {fornecedorParaEditar && fornecedorParaEditar.id ? 'Salvar Edição' : 'Adicionar Fornecedor'}
          </button>
          <button type="button" onClick={onCancel} className={styles.buttonSecondary}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}

export default FornecedorForm;