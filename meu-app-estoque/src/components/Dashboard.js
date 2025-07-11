// src/components/Dashboard.js

import React, { useState, useEffect, useCallback } from 'react';
// CORREÇÃO: Importe o useNavigate para redirecionar o usuário se o token expirar
import { useNavigate } from 'react-router-dom';
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

  // CORREÇÃO: Inicializa o hook de navegação
  const navigate = useNavigate();

  // Função para obter headers de autenticação (seu código já estava perfeito aqui)
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    // Se não houver token, retorna null para ser tratado na chamada
    if (!token) {
      return null;
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, []);

  const fetchSummaryData = useCallback(async () => {
    setLoading(true);
    setError('');

    const headers = getAuthHeaders();
    
    // CORREÇÃO: Verifica se o token existe antes de fazer a chamada
    if (!headers) {
      toast.error("Sessão inválida. Por favor, faça login novamente.");
      navigate('/login'); // Redireciona para a página de login
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/resumo`, {
        headers: headers
      });

      // CORREÇÃO: Tratamento específico para token expirado ou inválido
      if (response.status === 401) {
        toast.error("Sua sessão expirou. Por favor, faça login novamente.");
        localStorage.removeItem('token'); // Limpa o token inválido
        navigate('/login'); // Redireciona para o login
        return; // Interrompe a execução
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSummaryData(data);
    } catch (err) {
      console.error("Erro ao buscar dados do dashboard:", err);
      setError("Não foi possível carregar os dados do dashboard. Verifique sua conexão ou tente novamente.");
      // A toast de erro já é mais específica acima, pode remover esta se preferir
      // toast.error("Erro ao carregar dashboard.");
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, navigate]); // Adiciona dependências

  useEffect(() => {
    fetchSummaryData();
  }, [fetchSummaryData]);

  if (loading) {
    return <div className={styles.container}><p>Carregando dashboard...</p></div>;
  }

  if (error) {
    return <div className={styles.container}><p className={styles.errorMessage}>{error}</p></div>;
  }

  // CORREÇÃO (BUG PRINCIPAL): Garante que summaryData não é nulo antes de renderizar
  if (!summaryData) {
    // Isso evita o crash caso a API retorne um erro e os dados não sejam carregados
    return <div className={styles.container}><p>Não foi possível exibir os dados.</p></div>;
  }

  // A partir daqui, seu código já era ótimo e não precisou de mudanças
  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Visão Geral do Estoque</h2>

      <div className={styles.section}>
        <h3 className={styles.sectionHeading}>Indicadores Chave</h3>
        <div className={styles.kpisGrid}>
          {/* ... (código dos cards KPI sem alteração) ... */}
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
            {/* ... (código da tabela sem alteração) ... */}
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
                  <td className={styles.tableCell}>{new Date(mov.data_hora).toLocaleDateString('pt-BR')}</td>
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
            {/* ... (código dos botões de gerenciamento sem alteração) ... */}
            <button onClick={onShowList} className={styles.moduleButton}>Gerenciar Produtos</button>
            <button onClick={onShowMovimentacaoForm} className={styles.moduleButton}>Registrar Movimentação</button>
            <button onClick={onShowMovimentacaoList} className={styles.moduleButton}>Ver Histórico de Movimentações</button>
            <button onClick={onShowRelatorioEstoqueCritico} className={styles.moduleButton}>Relatório Estoque Crítico</button>
            <button onClick={onShowFornecedorList} className={styles.moduleButton}>Gerenciar Fornecedores</button>
            <button onClick={onShowClienteList} className={styles.moduleButton}>Gerenciar Clientes</button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;