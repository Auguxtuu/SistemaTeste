// Arquivo: src/components/Dashboard.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Importa o hook para navegação
import styles from '../CSSs/Dashboard.module.css'; // Verifique se o caminho do CSS está correto
import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:5000';

// Removi as props de navegação que não são mais necessárias, pois o roteador cuida disso.
// O componente agora é mais independente.
function Dashboard() {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate(); // Inicializa o hook de navegação

  const fetchSummaryData = useCallback(async () => {
    const token = localStorage.getItem('authToken'); // Nome da chave que usamos no App.js refatorado
    if (!token) {
      toast.error("Sessão inválida. Faça login.");
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/resumo`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        toast.error("Sua sessão expirou. Por favor, faça login novamente.");
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSummaryData(data);
    } catch (err) {
      console.error("Erro ao buscar dados do dashboard:", err);
      setError("Não foi possível carregar os dados do dashboard.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchSummaryData();
  }, [fetchSummaryData]);

  // Funções de navegação usando o roteador
  const navigateTo = (path) => navigate(path);

  if (loading) {
    return <div className={styles.container}><p>Carregando dashboard...</p></div>;
  }

  if (error) {
    return <div className={styles.container}><p className={styles.errorMessage}>{error}</p></div>;
  }

  if (!summaryData) {
    return <div className={styles.container}><p>Não foi possível exibir os dados.</p></div>;
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
            <button onClick={() => navigateTo('/produtos')} className={styles.kpiButton}>Ver Produtos</button>
          </div>
          <div className={styles.kpiCard}>
            <h3>Estoque Baixo</h3>
            <p className={`${styles.kpiValue} ${styles.kpiDanger}`}>{summaryData.produtos_estoque_baixo}</p>
            <button onClick={() => navigateTo('/relatorios/estoque-critico')} className={`${styles.kpiButton} ${styles.dangerKpiButton}`}>Ver Relatório</button>
          </div>
          {/* Continue para os outros cards, usando navigate('/caminho-da-rota') */}
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
                <th>Data</th>
                <th>Produto</th>
                <th>Tipo</th>
                <th>Qtd</th>
              </tr>
            </thead>
            <tbody>
              {summaryData.ultimas_movimentacoes.map(mov => (
                <tr key={mov.id}>
                  <td>{new Date(mov.data_hora).toLocaleDateString('pt-BR')}</td>
                  <td>
                    {/* O link agora leva para a página de detalhes do produto */}
                    <button onClick={() => navigateTo(`/produtos/${mov.produto_id}`)} className={styles.productLinkButton}>
                      {mov.produto_nome || `ID: ${mov.produto_id}`}
                    </button>
                  </td>
                  <td>
                    <span className={`${styles.typeBadge} ${mov.tipo_movimentacao === 'entrada' ? styles.badgeEntry : styles.badgeExit}`}>
                      {mov.tipo_movimentacao.toUpperCase()}
                    </span>
                  </td>
                  <td>{mov.quantidade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
       {/* Adapte o resto do seu JSX conforme necessário */}
    </div>
  );
}

export default Dashboard;