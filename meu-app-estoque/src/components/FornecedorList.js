// src/components/FornecedorList.js
import React, { useState, useEffect, useCallback } from 'react';
import styles from '../CSSs/FornecedorList.module.css';
import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:5000';

function FornecedorList({ onEditFornecedor, onCancel, onShowAddFornecedorForm }) {
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchFornecedores = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let url = `${API_BASE_URL}/fornecedores`;
      const params = new URLSearchParams();

      if (searchTerm) {
        params.append('search', searchTerm);
      }
      params.append('page', currentPage);
      params.append('per_page', perPage);

      if (params.toString()) {
        url = `${API_BASE_URL}/fornecedores?${params.toString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setFornecedores(data.items);
      setTotalPages(data.total_pages);
      setTotalItems(data.total_items);
    } catch (err) {
      console.error("Erro ao buscar fornecedores:", err);
      setError("Erro ao carregar lista de fornecedores. Tente novamente.");
      toast.error("Erro ao carregar fornecedores.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, currentPage, perPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFornecedores();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchFornecedores]);

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita e pode falhar se houver produtos vinculados.')) {
      return;
    }
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/fornecedores/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao excluir.');
      }
      toast.success(data.message);
      fetchFornecedores(); // Recarrega a lista
    } catch (err) {
      console.error("Erro ao excluir fornecedor:", err);
      toast.error(err.message || "Erro ao excluir fornecedor.");
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


  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Gerenciar Fornecedores</h2>

      <div className={styles.filterControls}>
        <div className={styles.filterGroup}>
          <label htmlFor="searchFornecedor" className={styles.label}>Buscar (Nome/CNPJ):</label>
          <input
            type="text"
            id="searchFornecedor"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.input}
            placeholder="Buscar por nome ou CNPJ..."
          />
        </div>
        <button onClick={fetchFornecedores} className={styles.buttonPrimary}>Aplicar Filtros</button>
        <button onClick={onShowAddFornecedorForm} className={styles.buttonSecondary}>Adicionar Novo Fornecedor</button>
        <button onClick={onCancel} className={styles.buttonSecondary}>Voltar</button>
      </div>

      {loading ? (
        <p>Carregando fornecedores...</p>
      ) : error ? (
        <p className={styles.errorMessage}>{error}</p>
      ) : fornecedores.length === 0 ? (
        <p>Nenhum fornecedor encontrado.</p>
      ) : (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.tableHeader}>ID</th>
                <th className={styles.tableHeader}>Nome</th>
                <th className={styles.tableHeader}>CNPJ</th>
                <th className={styles.tableHeader}>Email</th>
                <th className={styles.tableHeader}>Telefone</th>
                <th className={styles.tableHeader}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {fornecedores.map(fornecedor => (
                <tr key={fornecedor.id}>
                  <td className={styles.tableCell}>{fornecedor.id}</td>
                  <td className={styles.tableCell}>{fornecedor.nome}</td>
                  <td className={styles.tableCell}>{fornecedor.cnpj || 'N/A'}</td>
                  <td className={styles.tableCell}>{fornecedor.email || 'N/A'}</td>
                  <td className={styles.tableCell}>{fornecedor.telefone || 'N/A'}</td>
                  <td className={styles.tableCell}>
                    <button onClick={() => onEditFornecedor(fornecedor)} className={styles.buttonEdit}>Editar</button>
                    <button onClick={() => handleDelete(fornecedor.id)} className={styles.buttonDelete}>Excluir</button>
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

export default FornecedorList;