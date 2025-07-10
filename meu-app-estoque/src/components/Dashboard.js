// src/components/Dashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import styles from '../CSSs/Dashboard.module.css';
import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:5000';

function Dashboard({
  onShowList,
  onShowMovimentacaoForm,
  onShowMovimentacaoList,
  onShowRelatorioEstoqueCritico,
  onViewProductDetails,
  onShowFornecedorList,
  onShowClienteList
}) {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 🔐 Função de headers com token do localStorage
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'x-access-token': token
    };
  };

  const fetchSummaryData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/resumo`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSummaryData(data);
    } catch (err) {
      console.error("Erro ao buscar dados do dashboard:", err);
      setError("Erro ao carregar dados do dashboard. Tente novamente.");
      toast.error("Erro ao carregar dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummaryData();
  }, [fetchSummaryData]);

  if (loading) {
    return <div className={styles.container}><p>Carregando dashboard...</p></div>;
  }

  if (error) {
    return <div className={styles.container}><p className={styles.errorMessage}>{error}</p></div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Visão Geral do Estoque</h2>

      <div className={styles.section}>
        <h3 className={styles.sectionHeading}>Indicadores Chave</h3>
        <div className={styles.kpisGrid}>
          <div className={styles.kpiCard}>
            <h3>Total de Produtos</h3>
            <p className={styles.kpiValue}>{summaryData.total_produtos}</p>
            <button onClick={onShowList} className={styles.kpiButton}>Ver Produtos</button>
          </div>
          <div className={styles.kpiCard}>
            <h3>Estoque Baixo</h3>
            <p className={`${styles.kpiValue} ${styles.kpiDanger}`}>{summaryData.produtos_estoque_baixo}</p>
            <button onClick={() => onShowRelatorioEstoqueCritico('baixo')} className={`${styles.kpiButton} ${styles.dangerKpiButton}`}>Ver Relatório</button>
          </div>
          <div className={styles.kpiCard}>
            <h3>Em Falta</h3>
            <p className={`${styles.kpiValue} ${styles.kpiDanger}`}>{summaryData.produtos_em_falta}</p>
            <button onClick={() => onShowRelatorioEstoqueCritico('em_falta')} className={`${styles.kpiButton} ${styles.dangerKpiButton}`}>Ver Relatório</button>
          </div>
          <div className={styles.kpiCard}>
            <h3>Entradas Totais</h3>
            <p className={styles.kpiValue}>{summaryData.total_entradas}</p>
            <button onClick={() => onShowMovimentacaoList('entrada')} className={styles.kpiButton}>Ver Histórico</button>
          </div>
          <div className={styles.kpiCard}>
            <h3>Saídas Totais</h3>
            <p className={styles.kpiValue}>{summaryData.total_saidas}</p>
            <button onClick={() => onShowMovimentacaoList('saida')} className={styles.kpiButton}>Ver Histórico</button>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionHeading}>Últimas Movimentações</h3>
        {summaryData.ultimas_movimentacoes.length === 0 ? (
          <p>Nenhuma movimentação recente.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.tableHeader}>Data</th>
                <th className={styles.tableHeader}>Produto</th>
                <th className={styles.tableHeader}>Tipo</th>
                <th className={styles.tableHeader}>Qtd</th>
                <th className={styles.tableHeader}>NF</th>
                <th className={styles.tableHeader}>Cliente</th>
              </tr>
            </thead>
            <tbody>
              {summaryData.ultimas_movimentacoes.map(mov => (
                <tr key={mov.id}>
                  <td className={styles.tableCell}>{new Date(mov.data_hora).toLocaleDateString()}</td>
                  <td className={styles.tableCell}>
                    <button onClick={() => onViewProductDetails(mov.produto_id)} className={styles.productLinkButton}>
                      {mov.produto_nome || mov.produto_codigo || `ID: ${mov.produto_id}`}
                    </button>
                  </td>
                  <td className={styles.tableCell}>
                    <span className={`${styles.typeBadge} ${mov.tipo_movimentacao === 'entrada' ? styles.badgeEntry : styles.badgeExit}`}>
                      {mov.tipo_movimentacao.toUpperCase()}
                    </span>
                  </td>
                  <td className={styles.tableCell}>{mov.quantidade}</td>
                  <td className={styles.tableCell}>{mov.numero_nota_fiscal || 'N/A'}</td>
                  <td className={styles.tableCell}>{mov.cliente_nome || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionHeading}>Gerenciamento</h3>
        <div className={styles.moduleButtonsGrid}>
          <button onClick={onShowList} className={styles.moduleButton}>
            Gerenciar Produtos
          </button>
          <button onClick={onShowMovimentacaoForm} className={styles.moduleButton}>
            Registrar Movimentação
          </button>
          <button onClick={onShowMovimentacaoList} className={styles.moduleButton}>
            Ver Histórico de Movimentações
          </button>
          <button onClick={onShowRelatorioEstoqueCritico} className={styles.moduleButton}>
            Relatório Estoque Crítico
          </button>
          <button onClick={onShowFornecedorList} className={styles.moduleButton}>
            Gerenciar Fornecedores
          </button>
          <button onClick={onShowClienteList} className={styles.moduleButton}>
            Gerenciar Clientes
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
