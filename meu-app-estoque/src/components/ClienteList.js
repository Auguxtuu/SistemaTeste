// src/components/ClienteList.js
import React, { useState, useEffect, useCallback } from 'react';
import styles from '../CSSs/ClienteList.module.css'; // Novo CSS Module
import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:5000';

// ClienteList AGORA RECEBE getAuthHeaders como prop
function ClienteList({ onEditCliente, onCancel, onShowAddClienteForm, getAuthHeaders }) {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let url = `${API_BASE_URL}/clientes`;
      const params = new URLSearchParams();

      if (searchTerm) {
        params.append('search', searchTerm);
      }
      params.append('page', currentPage);
      params.append('per_page', perPage);

      if (params.toString()) {
        url = `${API_BASE_URL}/clientes?${params.toString()}`;
      }

      const response = await fetch(url, { headers: getAuthHeaders() }); // USA getAuthHeaders
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setClientes(data.items);
      setTotalPages(data.total_pages);
      setTotalItems(data.total_items);
    } catch (err) {
      console.error("Erro ao buscar clientes:", err);
      setError("Erro ao carregar lista de clientes. Tente novamente.");
      toast.error("Erro ao carregar clientes.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, currentPage, perPage, getAuthHeaders]); // getAuthHeaders como dependência

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClientes();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchClientes]);

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita e pode falhar se houver movimentações de saída vinculadas.')) {
      return;
    }
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders() // USA getAuthHeaders
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao excluir.');
      }
      toast.success(data.message);
      fetchClientes(); // Recarrega a lista
    } catch (err) {
      console.error("Erro ao excluir cliente:", err);
      toast.error(err.message || "Erro ao excluir cliente.");
    }
  };

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
      <h2 className={styles.heading}>Gerenciar Clientes</h2>

      <div className={styles.filterControls}>
        <div className={styles.filterGroup}>
          <label htmlFor="searchCliente" className={styles.label}>Buscar (Nome/CPF):</label>
          <input
            type="text"
            id="searchCliente"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.input}
            placeholder="Buscar por nome ou CPF..."
          />
        </div>
        <button onClick={fetchClientes} className={styles.buttonPrimary}>Aplicar Filtros</button>
        <button onClick={onShowAddClienteForm} className={styles.buttonSecondary}>Adicionar Novo Cliente</button>
        <button onClick={onCancel} className={styles.buttonSecondary}>Voltar</button>
      </div>

      {loading ? (
        <p>Carregando clientes...</p>
      ) : error ? (
        <p className={styles.errorMessage}>{error}</p>
      ) : clientes.length === 0 ? (
        <p>Nenhum cliente encontrado.</p>
      ) : (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.tableHeader}>ID</th>
                <th className={styles.tableHeader}>Nome</th>
                <th className={styles.tableHeader}>CPF</th>
                <th className={styles.tableHeader}>Email</th>
                <th className={styles.tableHeader}>Telefone</th>
                <th className={styles.tableHeader}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map(cliente => (
                <tr key={cliente.id}>
                  <td className={styles.tableCell}>{cliente.id}</td>
                  <td className={styles.tableCell}>{cliente.nome}</td>
                  <td className={styles.tableCell}>{formatCpfDisplay(cliente.cpf)}</td>
                  <td className={styles.tableCell}>{cliente.email || 'N/A'}</td>
                  <td className={styles.tableCell}>{cliente.telefone || 'N/A'}</td>
                  <td className={styles.tableCell}>
                    <button onClick={() => onEditCliente(cliente)} className={styles.buttonEdit}>Editar</button>
                    <button onClick={() => handleDelete(cliente.id)} className={styles.buttonDelete}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Controles de Paginação */}
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
        </>
      )}
    </div>
  );
}

export default ClienteList;