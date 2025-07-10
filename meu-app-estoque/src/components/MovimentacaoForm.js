// src/components/MovimentacaoForm.js
import React, { useState, useEffect } from 'react';
import styles from '...CSSs/MovimentacaoForm.module.css';
import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:5000';

function MovimentacaoForm({ onSaveSuccess, onCancel, getAuthHeaders }) { // RECEBE getAuthHeaders
  const [formData, setFormData] = useState({
    produto_id: '',
    tipo_movimentacao: 'entrada',
    quantidade: 1,
    observacao: '',
    numero_nota_fiscal: '',
    cliente_id: ''
  });
  const [errors, setErrors] = useState({});
  const [clientes, setClientes] = useState([]);

  // Função para buscar clientes (AGORA USA getAuthHeaders)
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/clientes?per_page=999`, { headers: getAuthHeaders() }); // <--- CORRIGIDO
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setClientes(data.items);
      } catch (err) {
        console.error("Erro ao buscar clientes:", err);
        toast.error("Erro ao carregar lista de clientes.");
      }
    };
    fetchClientes();
  }, [getAuthHeaders]); // getAuthHeaders adicionado às dependências


  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let newValue;

    if (name === 'cliente_id') {
      newValue = value === '' ? '' : parseInt(value);
    } else {
      newValue = type === 'number' ? parseInt(value) || 0 : value;
    }

    setFormData({
      ...formData,
      [name]: newValue,
    });

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
    if (!formData.produto_id || formData.produto_id <= 0) {
        newErrors.produto_id = "ID do Produto é obrigatório e deve ser maior que zero.";
    }
    if (formData.quantidade <= 0) {
        newErrors.quantidade = "Quantidade deve ser maior que zero.";
    }
    if (!formData.tipo_movimentacao) {
        newErrors.tipo_movimentacao = "Tipo de movimentação é obrigatório.";
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

    try {
      const response = await fetch(`${API_BASE_URL}/movimentacoes`, {
        method: 'POST',
        headers: getAuthHeaders(), // <--- CORRIGIDO
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(result.message || 'Erro ao registrar movimentação.');
      }

      toast.success(result.message);
      setFormData({
        produto_id: '',
        tipo_movimentacao: 'entrada',
        quantidade: 1,
        observacao: '',
        numero_nota_fiscal: '',
        cliente_id: ''
      });
      setErrors({});
      if (onSaveSuccess) {
        onSaveSuccess();
      }

    } catch (error) {
      console.error("Erro ao registrar movimentação:", error);
      toast.error(error.message);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Registrar Movimentação de Estoque</h2>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>ID do Produto:</label>
          <input
            type="number"
            name="produto_id"
            value={formData.produto_id}
            onChange={handleChange}
            className={`${styles.input} ${errors.produto_id ? styles.inputError : ''}`}
            min="1"
          />
          {errors.produto_id && <span className={styles.errorMessage}>{errors.produto_id}</span>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Tipo de Movimentação:</label>
          <select
            name="tipo_movimentacao"
            value={formData.tipo_movimentacao}
            onChange={handleChange}
            className={`${styles.select} ${errors.tipo_movimentacao ? styles.inputError : ''}`}
          >
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
          {errors.tipo_movimentacao && <span className={styles.errorMessage}>{errors.tipo_movimentacao}</span>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Quantidade:</label>
          <input
            type="number"
            name="quantidade"
            value={formData.quantidade}
            onChange={handleChange}
            className={`${styles.input} ${errors.quantidade ? styles.inputError : ''}`}
            min="1"
          />
          {errors.quantidade && <span className={styles.errorMessage}>{errors.quantidade}</span>}
        </div>

        {/* Campo: Seleção de Cliente (visível apenas para 'saida') */}
        {formData.tipo_movimentacao === 'saida' && (
            <div className={styles.formGroup}>
            <label className={styles.label}>Cliente (Saída):</label>
            <select
                name="cliente_id"
                value={formData.cliente_id}
                onChange={handleChange}
                className={`${styles.select} ${errors.cliente_id ? styles.inputError : ''}`}
            >
                <option value="">Selecione um cliente (Opcional)</option>
                {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>
                    {cliente.nome} (ID: {cliente.id})
                </option>
                ))}
            </select>
            {errors.cliente_id && <span className={styles.errorMessage}>{errors.cliente_id}</span>}
            </div>
        )}

        <div className={styles.formGroup}>
          <label className={styles.label}>Número da Nota Fiscal (Opcional):</label>
          <input
            type="text"
            name="numero_nota_fiscal"
            value={formData.numero_nota_fiscal}
            onChange={handleChange}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
          <label className={styles.label}>Observação:</label>
          <textarea
            name="observacao"
            value={formData.observacao}
            onChange={handleChange}
            className={styles.textarea}
            rows="3"
          ></textarea>
        </div>

        <div className={styles.buttonContainer}>
          <button type="submit" className={styles.buttonPrimary}>Registrar Movimentação</button>
          <button type="button" onClick={onCancel} className={styles.buttonSecondary}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}

export default MovimentacaoForm;