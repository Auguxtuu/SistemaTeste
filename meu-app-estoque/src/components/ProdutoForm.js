// src/components/ProdutoForm.js
import React, { useState, useEffect } from 'react';
import styles from '../CSSs/ProdutoForm.module.css';
import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:5000';

function ProdutoForm({ produtoParaEditar, onSaveSuccess, getAuthHeaders }) { // RECEBE getAuthHeaders
  const [formData, setFormData] = useState({
    nome: '',
    codigo: '',
    descricao: '',
    unidade_medida: 'Unidade',
    estoque_atual: 0,
    estoque_minimo: 0,
    localizacao: '',
    preco_compra: 0.00,
    preco_venda: 0.00,
    ncm: '',
    cst_csosn: '',
    cfop: '',
    origem_mercadoria: '0',
    icms_aliquota: 0.00,
    icms_valor: 0.00,
    ipi_aliquota: 0.00,
    ipi_valor: 0.00,
    pis_aliquota: 0.00,
    pis_valor: 0.00,
    cofins_aliquota: 0.00,
    cofins_valor: 0.00,
    info_adicionais_nf: '',
    fornecedor_id: ''
  });

  const [errors, setErrors] = useState({});
  const [fornecedores, setFornecedores] = useState([]);

  // Função para buscar fornecedores (AGORA USA getAuthHeaders)
  const fetchFornecedores = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/fornecedores?per_page=999`, { headers: getAuthHeaders() }); // <--- CORRIGIDO
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setFornecedores(data.items);
    } catch (err) {
      console.error("Erro ao buscar fornecedores:", err);
      toast.error("Erro ao carregar lista de fornecedores para o produto.");
    }
  };

  const calculateTaxValue = (price, aliquot) => {
    const p = parseFloat(price) || 0;
    const a = parseFloat(aliquot) || 0;
    if (a < 0) {
        return (0).toFixed(2);
    }
    return (p * (a / 100)).toFixed(2);
  };

  useEffect(() => {
    fetchFornecedores();
    if (produtoParaEditar) {
      setFormData({
        ...produtoParaEditar,
        preco_compra: parseFloat(produtoParaEditar.preco_compra || 0),
        preco_venda: parseFloat(produtoParaEditar.preco_venda || 0),
        estoque_atual: parseInt(produtoParaEditar.estoque_atual || 0),
        estoque_minimo: parseInt(produtoParaEditar.estoque_minimo || 0),
        icms_aliquota: parseFloat(produtoParaEditar.icms_aliquota || 0),
        icms_valor: parseFloat(produtoParaEditar.icms_valor || 0),
        ipi_aliquota: parseFloat(produtoParaEditar.ipi_aliquota || 0),
        ipi_valor: parseFloat(produtoParaEditar.ipi_valor || 0),
        pis_aliquota: parseFloat(produtoParaEditar.pis_aliquota || 0),
        pis_valor: parseFloat(produtoParaEditar.pis_valor || 0),
        cofins_aliquota: parseFloat(produtoParaEditar.cofins_aliquota || 0),
        cofins_valor: parseFloat(produtoParaEditar.cofins_valor || 0),
        fornecedor_id: produtoParaEditar.fornecedor_id || ''
      });
      setErrors({});
    } else {
      setFormData(prev => ({ ...prev, fornecedor_id: '' }));
    }
  }, [produtoParaEditar, getAuthHeaders]); // getAuthHeaders adicionado às dependências

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let newValue;

    if (name === 'fornecedor_id') {
      newValue = value === '' ? '' : parseInt(value);
    } else {
      newValue = type === 'number' ? parseFloat(value) || 0 : value;
    }

    const updatedFormData = {
      ...formData,
      [name]: newValue,
    };

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (name === 'preco_venda' || name.includes('_aliquota')) {
      const currentPrecoVenda = name === 'preco_venda' ? newValue : updatedFormData.preco_venda;
      const currentIcmsAliquota = name === 'icms_aliquota' ? newValue : updatedFormData.icms_aliquota;
      const currentIpiAliquota = name === 'ipi_aliquota' ? newValue : updatedFormData.ipi_aliquota;
      const currentPisAliquota = name === 'pis_aliquota' ? newValue : updatedFormData.pis_aliquota;
      const currentCofinsAliquota = name === 'cofins_aliquota' ? newValue : updatedFormData.cofins_aliquota;

      updatedFormData.icms_valor = calculateTaxValue(currentPrecoVenda, currentIcmsAliquota);
      updatedFormData.ipi_valor = calculateTaxValue(currentPrecoVenda, currentIpiAliquota);
      updatedFormData.pis_valor = calculateTaxValue(currentPrecoVenda, currentPisAliquota);
      updatedFormData.cofins_valor = calculateTaxValue(currentPrecoVenda, currentCofinsAliquota);
    }

    setFormData(updatedFormData);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nome) newErrors.nome = "Nome é obrigatório.";
    if (!formData.codigo) newErrors.codigo = "Código é obrigatório.";
    if (!formData.unidade_medida) newErrors.unidade_medida = "Unidade de Medida é obrigatória.";
    if (formData.preco_compra === null || isNaN(formData.preco_compra)) newErrors.preco_compra = "Preço de Compra é obrigatório e deve ser um número.";
    if (formData.preco_venda === null || isNaN(formData.preco_venda)) newErrors.preco_venda = "Preço de Venda é obrigatório e deve ser um número.";

    if (formData.preco_compra < 0) newErrors.preco_compra = "Preço de Compra não pode ser negativo.";
    if (formData.preco_venda < 0) newErrors.preco_venda = "Preço de Venda não pode ser negativo.";
    if (formData.estoque_atual < 0) newErrors.estoque_atual = "Estoque Atual não pode ser negativo.";
    if (formData.estoque_minimo < 0) newErrors.estoque_minimo = "Estoque Mínimo não pode ser negativo.";
    if (formData.ncm && formData.ncm.length !== 8) newErrors.ncm = "NCM deve ter 8 dígitos.";
    if (formData.icms_aliquota < 0 || formData.icms_aliquota > 100) newErrors.icms_aliquota = "Alíquota ICMS deve ser entre 0 e 100.";
    if (formData.ipi_aliquota < 0 || formData.ipi_aliquota > 100) newErrors.ipi_aliquota = "Alíquota IPI deve ser entre 0 e 100.";
    if (formData.pis_aliquota < 0 || formData.pis_aliquota > 100) newErrors.pis_aliquota = "Alíquota PIS deve ser entre 0 e 100.";
    if (formData.cofins_aliquota < 0 || formData.cofins_aliquota > 100) newErrors.cofins_aliquota = "Alíquota COFINS deve ser entre 0 e 100.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Por favor, corrija os erros no formulário.");
      return;
    }

    const method = produtoParaEditar ? 'PUT' : 'POST';
    const url = produtoParaEditar ? `${API_BASE_URL}/produtos/${produtoParaEditar.id}` : `${API_BASE_URL}/produtos`;

    try {
      const response = await fetch(url, {
        method: method,
        headers: getAuthHeaders(), // <--- CORRIGIDO
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar o produto');
      }

      const result = await response.json();
      toast.success(result.message);
      if (onSaveSuccess) { onSaveSuccess(); }
      if (!produtoParaEditar) {
        setFormData({
          nome: '', codigo: '', descricao: '', unidade_medida: 'Unidade',
          estoque_atual: 0, estoque_minimo: 0, localizacao: '',
          preco_compra: 0.00, preco_venda: 0.00,
          ncm: '', cst_csosn: '', cfop: '', origem_mercadoria: '0',
          icms_aliquota: 0.00, icms_valor: 0.00, ipi_aliquota: 0.00, ipi_valor: 0.00,
          pis_aliquota: 0.00, pis_valor: 0.00, cofins_aliquota: 0.00, cofins_valor: 0.00,
          info_adicionais_nf: '',
          fornecedor_id: ''
        });
        setErrors({});
      }

    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      toast.error("Erro: " + error.message);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>{produtoParaEditar ? 'Editar Produto' : 'Adicionar Novo Produto'}</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Informações Básicas */}
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
          <label className={styles.label}>Código:</label>
          <input
            type="text"
            name="codigo"
            value={formData.codigo}
            onChange={handleChange}
            className={`${styles.input} ${errors.codigo ? styles.inputError : ''}`}
          />
          {errors.codigo && <span className={styles.errorMessage}>{errors.codigo}</span>}
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Descrição:</label>
          <textarea name="descricao" value={formData.descricao} onChange={handleChange} rows="3" className={styles.textarea}></textarea>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Unidade de Medida:</label>
          <select
            name="unidade_medida"
            value={formData.unidade_medida}
            onChange={handleChange}
            className={`${styles.select} ${errors.unidade_medida ? styles.inputError : ''}`}
          >
            <option value="">Selecione</option>
            <option value="Unidade">Unidade</option>
            <option value="Kg">Kg</option>
            <option value="Metro">Metro</option>
            <option value="Litro">Litro</option>
            <option value="Caixa">Caixa</option>
          </select>
          {errors.unidade_medida && <span className={styles.errorMessage}>{errors.unidade_medida}</span>}
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Estoque Atual:</label>
          <input
            type="number"
            name="estoque_atual"
            value={formData.estoque_atual}
            onChange={handleChange}
            className={`${styles.input} ${errors.estoque_atual ? styles.inputError : ''}`}
          />
          {errors.estoque_atual && <span className={styles.errorMessage}>{errors.estoque_atual}</span>}
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Estoque Mínimo:</label>
          <input
            type="number"
            name="estoque_minimo"
            value={formData.estoque_minimo}
            onChange={handleChange}
            className={`${styles.input} ${errors.estoque_minimo ? styles.inputError : ''}`}
          />
          {errors.estoque_minimo && <span className={styles.errorMessage}>{errors.estoque_minimo}</span>}
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Localização:</label>
          <input type="text" name="localizacao" value={formData.localizacao} onChange={handleChange} className={styles.input} />
        </div>

        {/* Campo NOVO: Seleção de Fornecedor */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Fornecedor Principal:</label>
          <select
            name="fornecedor_id"
            value={formData.fornecedor_id}
            onChange={handleChange}
            className={`${styles.select} ${errors.fornecedor_id ? styles.inputError : ''}`}
          >
            <option value="">Selecione um fornecedor (Opcional)</option>
            {fornecedores.map(fornecedor => (
              <option key={fornecedor.id} value={fornecedor.id}>
                {fornecedor.nome} (ID: {fornecedor.id})
              </option>
            ))}
          </select>
          {errors.fornecedor_id && <span className={styles.errorMessage}>{errors.fornecedor_id}</span>}
        </div>


        {/* Preço de Compra */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Preço de Compra:</label>
          <div className={styles.inputWithPrefix}>
            <span className={styles.prefix}>R$</span>
            <input
              type="number"
              name="preco_compra"
              value={formData.preco_compra}
              onChange={handleChange}
              step="0.01"
              className={`${styles.input} ${errors.preco_compra ? styles.inputError : ''}`}
            />
          </div>
          {errors.preco_compra && <span className={styles.errorMessage}>{errors.preco_compra}</span>}
        </div>

        {/* Preço de Venda */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Preço de Venda:</label>
          <div className={styles.inputWithPrefix}>
            <span className={styles.prefix}>R$</span>
            <input
              type="number"
              name="preco_venda"
              value={formData.preco_venda}
              onChange={handleChange}
              step="0.01"
              className={`${styles.input} ${errors.preco_venda ? styles.inputError : ''}`}
            />
          </div>
          {errors.preco_venda && <span className={styles.errorMessage}>{errors.preco_venda}</span>}
        </div>

        {/* Informações Fiscais */}
        <h3 className={styles.subHeading}>Informações Fiscais</h3>
        <div className={styles.formGroup}>
          <label className={styles.label}>NCM:</label>
          <input
            type="text"
            name="ncm"
            value={formData.ncm}
            onChange={handleChange}
            maxLength="8"
            className={`${styles.input} ${errors.ncm ? styles.inputError : ''}`}
          />
          {errors.ncm && <span className={styles.errorMessage}>{errors.ncm}</span>}
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>CST/CSOSN:</label>
          <input type="text" name="cst_csosn" value={formData.cst_csosn} onChange={handleChange} maxLength="4" className={styles.input} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>CFOP:</label>
          <input type="text" name="cfop" value={formData.cfop} onChange={handleChange} maxLength="4" className={styles.input} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Origem Mercadoria:</label>
          <select name="origem_mercadoria" value={formData.origem_mercadoria} onChange={handleChange} className={styles.select}>
            <option value="0">0 - Nacional</option>
            <option value="1">1 - Estrangeira - Importação Direta</option>
            <option value="2">2 - Estrangeira - Adquirida no Mercado Interno</option>
            {/* Adicione outras opções conforme necessário */}
          </select>
        </div>

        {/* Impostos Detalhados */}
        <h4 className={styles.subHeading}>ICMS</h4>
        <div className={styles.formGroup}>
          <label className={styles.label}>Alíquota ICMS (%):</label>
          <input
            type="number"
            name="icms_aliquota"
            value={formData.icms_aliquota}
            onChange={handleChange}
            step="0.01"
            className={`${styles.input} ${errors.icms_aliquota ? styles.inputError : ''}`}
          />
          {errors.icms_aliquota && <span className={styles.errorMessage}>{errors.icms_aliquota}</span>}
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Valor ICMS:</label>
          <div className={styles.inputWithPrefix}>
            <span className={styles.prefix}>R$</span>
            <input
              type="number"
              name="icms_valor"
              value={formData.icms_valor}
              readOnly
              className={styles.input}
            />
          </div>
        </div>

        <h4 className={styles.subHeading}>IPI</h4>
        <div className={styles.formGroup}>
          <label className={styles.label}>Alíquota IPI (%):</label>
          <input
            type="number"
            name="ipi_aliquota"
            value={formData.ipi_aliquota}
            onChange={handleChange}
            step="0.01"
            className={`${styles.input} ${errors.ipi_aliquota ? styles.inputError : ''}`}
          />
          {errors.ipi_aliquota && <span className={styles.errorMessage}>{errors.ipi_aliquota}</span>}
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Valor IPI:</label>
          <div className={styles.inputWithPrefix}>
            <span className={styles.prefix}>R$</span>
            <input
              type="number"
              name="ipi_valor"
              value={formData.ipi_valor}
              readOnly
              className={styles.input}
            />
          </div>
        </div>

        <h4 className={styles.subHeading}>PIS</h4>
        <div className={styles.formGroup}>
          <label className={styles.label}>Alíquota PIS (%):</label>
          <input
            type="number"
            name="pis_aliquota"
            value={formData.pis_aliquota}
            onChange={handleChange}
            step="0.01"
            className={`${styles.input} ${errors.pis_aliquota ? styles.inputError : ''}`}
          />
          {errors.pis_aliquota && <span className={styles.errorMessage}>{errors.pis_aliquota}</span>}
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Valor PIS:</label>
          <div className={styles.inputWithPrefix}>
            <span className={styles.prefix}>R$</span>
            <input
              type="number"
              name="pis_valor"
              value={formData.pis_valor}
              readOnly
              className={styles.input}
            />
          </div>
        </div>

        <h4 className={styles.subHeading}>COFINS</h4>
        <div className={styles.formGroup}>
          <label className={styles.label}>Alíquota COFINS (%):</label>
          <input
            type="number"
            name="cofins_aliquota"
            value={formData.cofins_aliquota}
            onChange={handleChange}
            step="0.01"
            className={`${styles.input} ${errors.cofins_aliquota ? styles.inputError : ''}`}
          />
          {errors.cofins_aliquota && <span className={styles.errorMessage}>{errors.cofins_aliquota}</span>}
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Valor COFINS:</label>
          <div className={styles.inputWithPrefix}>
            <span className={styles.prefix}>R$</span>
            <input
              type="number"
              name="cofins_valor"
              value={formData.cofins_valor}
              readOnly
              className={styles.input}
            />
          </div>
        </div>

        {/* Informações Adicionais NF-e */}
        <div className={styles.formGroup} style={{ gridColumn: '1 / 3' }}>
          <label className={styles.label}>Informações Adicionais NF-e:</label>
          <textarea name="info_adicionais_nf" value={formData.info_adicionais_nf} onChange={handleChange} rows="3" className={styles.textarea}></textarea>
        </div>

        <div className={styles.buttonContainer}>
          <button type="submit" className={styles.button}>
            {produtoParaEditar ? 'Salvar Edição' : 'Adicionar Produto'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProdutoForm;