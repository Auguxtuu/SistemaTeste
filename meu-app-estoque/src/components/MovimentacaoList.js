// src/components/MovimentacaoList.js
import React, { useState, useEffect, useCallback } from 'react';
import styles from '..CSSs/MovimentacaoList.module.css';
import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:5000';

function MovimentacaoList({ onProdutoClick, onCancel, getAuthHeaders }) { // RECEBE getAuthHeaders
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para os filtros
  const [filterTipo, setFilterTipo] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterProdutoId, setFilterProdutoId] = useState('');
  const [filterClientId, setFilterClientId] = useState('');

  // Estados para Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchMovimentacoes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let url = `${API_BASE_URL}/movimentacoes`;
      const params = new URLSearchParams();

      if (filterProdutoId) {
        params.append('produto_id', filterProdutoId);
      }
      if (filterTipo) {
        params.append('tipo', filterTipo);
      }
      if (filterStartDate) {
        params.append('start_date', filterStartDate);
      }
      if (filterEndDate) {
        params.append('end_date', filterEndDate);
      }
      if (filterClientId) {
        params.append('cliente_id', filterClientId);
      }

      params.append('page', currentPage);
      params.append('per_page', perPage);

      if (params.toString()) {
        url = `${API_BASE_URL}/movimentacoes?${params.toString()}`;
      }

      const response = await fetch(url, { headers: getAuthHeaders() }); // <--- CORRIGIDO
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMovimentacoes(data.items);
      setTotalPages(data.total_pages);
      setTotalItems(data.total_items);
    } catch (err) {
      console.error("Erro ao buscar movimentações:", err);
      setError("Erro ao carregar o histórico de movimentações. Tente novamente.");
      toast.error("Erro ao carregar histórico de movimentações.");
    } finally {
      setLoading(false);
    }
  }, [filterTipo, filterStartDate, filterEndDate, filterProdutoId, filterClientId, currentPage, perPage, getAuthHeaders]); // getAuthHeaders como dependência

  useEffect(() => {
    fetchMovimentacoes();
  }, [fetchMovimentacoes]);

  // Funções de Paginação
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePerPageChange = (e) => {
    setPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Volta para a primeira página ao mudar itens por página
  };

  // Função para formatar CPF para exibição
  const formatCpfDisplay = (cpf) => {
    if (!cpf) return 'N/A';
    const digits = cpf.replace(/[^\d]/g, '');
    if (digits.length === 11) {
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
    }
    return cpf;
  };


  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Histórico de Movimentações</h2>

      <div className={styles.filterControls}>
        <div className={styles.filterGroup}>
            <label htmlFor="filterProdutoId" className={styles.label}>ID Produto:</label>
            <input
                type="number"
                id="filterProdutoId"
                value={filterProdutoId}
                onChange={(e) => setFilterProdutoId(e.target.value)}
                className={styles.input}
                placeholder="Ex: 1"
                min="1"
            />
        </div>
        <div className={styles.filterGroup}>
            <label htmlFor="filterTipo" className={styles.label}>Tipo:</label>
            <select
                id="filterTipo"
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className={styles.select}
            >
                <option value="">Todos</option>
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
            </select>
        </div>
        <div className={styles.filterGroup}>
            <label htmlFor="filterClientId" className={styles.label}>ID Cliente:</label>
            <input
                type="number"
                id="filterClientId"
                value={filterClientId}
                onChange={(e) => setFilterClientId(e.target.value)}
                className={styles.input}
                placeholder="Ex: 1"
                min="1"
            />
        </div>
        <div className={styles.filterGroup}>
            <label htmlFor="filterStartDate" className={styles.label}>Data Início:</label>
            <input
                type="date"
                id="filterStartDate"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className={styles.input}
            />
        </div>
        <div className={styles.filterGroup}>
            <label htmlFor="filterEndDate" className={styles.label}>Data Fim:</label>
            <input
                type="date"
                id="filterEndDate"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className={styles.input}
            />
        </div>
        <button onClick={fetchMovimentacoes} className={styles.buttonPrimary}>Aplicar Filtros</button>
        <button onClick={onCancel} className={styles.buttonSecondary}>Voltar</button>
      </div>

      {loading ? (
        <p>Carregando histórico de movimentações...</p>
      ) : error ? (
        <p className={styles.errorMessage}>{error}</p>
      ) : movimentacoes.length === 0 ? (
        <p>Nenhuma movimentação encontrada com os filtros aplicados.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.tableHeader}>ID Mov.</th>
              <th className={styles.tableHeader}>ID Prod.</th>
              <th className={styles.tableHeader}>Código Prod.</th>
              <th className={styles.tableHeader}>Nome Prod.</th>
              <th className={styles.tableHeader}>Tipo</th>
              <th className={styles.tableHeader}>Qtd</th>
              <th className={styles.tableHeader}>Data/Hora</th>
              <th className={styles.tableHeader}>Nº NF</th>
              <th className={styles.tableHeader}>Cliente</th>
              <th className={styles.tableHeader}>Observação</th>
            </tr>
          </thead>
          <tbody>
            {movimentacoes.map(mov => (
              <tr key={mov.id}>
                <td className={styles.tableCell}>{mov.id}</td>
                <td className={styles.tableCell}>
                  <button
                    onClick={() => onProdutoClick(mov.produto_id)}
                    className={styles.productLinkButton}
                  >
                    {mov.produto_id}
                  </button>
                </td>
                <td className={styles.tableCell}>{mov.produto_codigo || 'N/A'}</td>
                <td className={styles.tableCell}>{mov.produto_nome || 'N/A'}</td>
                <td className={styles.tableCell}>
                  <span className={`${styles.typeBadge} ${mov.tipo_movimentacao === 'entrada' ? styles.badgeEntry : styles.badgeExit}`}>
                    {mov.tipo_movimentacao.toUpperCase()}
                  </span>
                </td>
                <td className={styles.tableCell}>{mov.quantidade}</td>
                <td className={styles.tableCell}>
                  {mov.data_hora ? new Date(mov.data_hora).toLocaleString() : 'N/A'}
                </td>
                <td className={styles.tableCell}>{mov.numero_nota_fiscal || 'N/A'}</td>
                <td className={styles.tableCell}>{mov.cliente_nome || 'N/A'}</td>
                <td className={styles.tableCell}>{mov.observacao || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Controles de Paginação de Movimentações */}
      {totalPages > 1 && (
        <div className={styles.paginationControls}>
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className={styles.buttonPagination}>Anterior</button>
          <span>Página {currentPage} de {totalPages}</span>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className={styles.buttonPagination}>Próximo</button>
          <select onChange={handlePerPageChange} value={perPage} className={styles.paginationSelect}>
            <option value="5">5 por página</option>
            <option value="10">10 por página</option>
            <option value="20">20 por página</option>
          </select>
        </div>
      )}
    </div>
  );
}

export default MovimentacaoList;