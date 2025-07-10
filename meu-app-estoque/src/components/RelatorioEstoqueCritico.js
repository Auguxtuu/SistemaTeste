// src/components/RelatorioEstoqueCritico.js
import React, { useState, useEffect, useCallback } from 'react';
import styles from '../CSSs/RelatorioEstoqueCritico.module.css';
import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:5000';

function RelatorioEstoqueCritico({ onProdutoClick, onCancel, getAuthHeaders }) { // RECEBE getAuthHeaders
  const [produtosCriticos, setProdutosCriticos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportType, setReportType] = useState('baixo');

  const fetchEstoqueCritico = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/relatorios/estoque_critico?tipo=${reportType}`, { headers: getAuthHeaders() }); // <--- CORRIGIDO
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProdutosCriticos(data);
    } catch (err) {
      console.error("Erro ao buscar relatório de estoque crítico:", err);
      setError("Erro ao carregar o relatório de estoque crítico. Tente novamente.");
      toast.error("Erro ao carregar relatório de estoque crítico.");
    } finally {
      setLoading(false);
    }
  }, [reportType, getAuthHeaders]); // getAuthHeaders como dependência

  useEffect(() => {
    fetchEstoqueCritico();
  }, [fetchEstoqueCritico]);

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Relatório de Estoque Crítico</h2>

      <div className={styles.filterControls}>
        <label htmlFor="reportType" className={styles.label}>Tipo de Relatório:</label>
        <select
          id="reportType"
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className={styles.select}
        >
          <option value="baixo">Estoque Baixo (Atual &lt;= Mínimo)</option>
          <option value="em_falta">Em Falta (Estoque = 0)</option>
        </select>
        <button onClick={onCancel} className={styles.buttonSecondary}>Voltar</button>
      </div>

      {loading ? (
        <p>Carregando relatório...</p>
      ) : error ? (
        <p className={styles.errorMessage}>{error}</p>
      ) : produtosCriticos.length === 0 ? (
        <p>Nenhum produto encontrado com o status "{reportType}" de estoque.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.tableHeader}>ID</th>
              <th className={styles.tableHeader}>Nome</th>
              <th className={styles.tableHeader}>Código</th>
              <th className={styles.tableHeader}>Estoque Atual</th>
              <th className={styles.tableHeader}>Estoque Mínimo</th>
              <th className={styles.tableHeader}>Localização</th>
              <th className={styles.tableHeader}>Preço Venda</th>
              <th className={styles.tableHeader}>Fornecedor</th>
            </tr>
          </thead>
          <tbody>
            {produtosCriticos.map(produto => (
              <tr key={produto.id}>
                <td className={styles.tableCell}>
                  <button onClick={() => onProdutoClick(produto.id)} className={styles.productLinkButton}>
                    {produto.id}
                  </button>
                </td>
                <td className={styles.tableCell}>{produto.nome}</td>
                <td className={styles.tableCell}>{produto.codigo}</td>
                <td className={`${styles.tableCell} ${produto.estoque_atual <= produto.estoque_minimo ? styles.lowStock : ''} ${produto.estoque_atual === 0 ? styles.outOfStock : ''}`}>
                    {produto.estoque_atual} {produto.unidade_medida}
                </td>
                <td className={styles.tableCell}>{produto.estoque_minimo} {produto.unidade_medida}</td>
                <td className={styles.tableCell}>{produto.localizacao || 'N/A'}</td>
                <td className={styles.tableCell}>R$ {produto.preco_venda ? produto.preco_venda.toFixed(2) : '0.00'}</td>
                <td className={styles.tableCell}>{produto.fornecedor_nome || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default RelatorioEstoqueCritico;