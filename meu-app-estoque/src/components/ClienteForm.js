// src/components/ClienteForm.js
import React, { useState, useEffect } from 'react';
import styles from '../CSSs/ClienteForm.module.css'; // Novo CSS Module
import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:5000';

// ClienteForm AGORA RECEBE getAuthHeaders como prop
function ClienteForm({ clienteParaEditar, onSaveSuccess, onCancel, getAuthHeaders }) {
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    email: '',
    telefone: '',
    endereco: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (clienteParaEditar && clienteParaEditar.id) {
      setFormData({
        nome: clienteParaEditar.nome || '',
        cpf: clienteParaEditar.cpf || '',
        email: clienteParaEditar.email || '',
        telefone: clienteParaEditar.telefone || '',
        endereco: clienteParaEditar.endereco || ''
      });
      setErrors({});
    } else {
      setFormData({
        nome: '', cpf: '', email: '', telefone: '', endereco: ''
      });
      setErrors({});
    }
  }, [clienteParaEditar]);

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

  // NOVO: Função para validar CPF (dígitos verificadores)
  const validateCpf = (cpf) => {
    cpf = cpf.replace(/[^\d]+/g, ''); // Remove caracteres não numéricos

    if (cpf === '') return true; // CPF vazio é válido se não for obrigatório
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false; // Verifica tamanho e CPFs com todos os dígitos iguais

    let soma = 0;
    let resto;
    // Valida primeiro dígito verificador
    for (let i = 1; i <= 9; i++) {
        soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;

    soma = 0;
    // Valida segundo dígito verificador
    for (let i = 1; i <= 10; i++) {
        soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;

    return true;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nome) newErrors.nome = "Nome é obrigatório.";
    
    // Validação de CPF
    if (formData.cpf) {
      if (!validateCpf(formData.cpf)) {
        newErrors.cpf = "CPF inválido.";
      }
    }
    // Validação de email simples
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

    const method = clienteParaEditar && clienteParaEditar.id ? 'PUT' : 'POST';
    const url = clienteParaEditar && clienteParaEditar.id ? `${API_BASE_URL}/clientes/${clienteParaEditar.id}` : `${API_BASE_URL}/clientes`;

    try {
      const dataToSend = { ...formData };
      if (dataToSend.cpf) {
        dataToSend.cpf = dataToSend.cpf.replace(/[^\d]/g, ''); // Remove não dígitos do CPF antes de enviar
      }

      const response = await fetch(url, {
        method: method,
        headers: getAuthHeaders(), // USA getAuthHeaders
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar o cliente');
      }

      const result = await response.json();
      toast.success(result.message);
      if (onSaveSuccess) {
        onSaveSuccess();
      }
      if (!(clienteParaEditar && clienteParaEditar.id)) {
        setFormData({ nome: '', cpf: '', email: '', telefone: '', endereco: '' });
        setErrors({});
      }

    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      toast.error("Erro: " + error.message);
    }
  };

  // Função para formatar CPF enquanto digita (para UX)
  const formatCpf = (value) => {
    if (!value) return value;
    const digits = value.replace(/[^\d]/g, '');
    // Aplica a máscara XXX.XXX.XXX-XX
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  };


  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>{clienteParaEditar && clienteParaEditar.id ? 'Editar Cliente' : 'Adicionar Novo Cliente'}</h2>
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
          <label className={styles.label}>CPF:</label>
          <input
            type="text"
            name="cpf"
            value={formatCpf(formData.cpf)}
            onChange={handleChange}
            className={`${styles.input} ${errors.cpf ? styles.inputError : ''}`}
            maxLength="14"
          />
          {errors.cpf && <span className={styles.errorMessage}>{errors.cpf}</span>}
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
            {clienteParaEditar && clienteParaEditar.id ? 'Salvar Edição' : 'Adicionar Cliente'}
          </button>
          <button type="button" onClick={onCancel} className={styles.buttonSecondary}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}

export default ClienteForm;