// src/pages/ProdutoList.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../CSSs/ProdutoList.css'; // Criaremos este arquivo de CSS a seguir

const API_BASE_URL = 'http://localhost:5000';

function ProdutoList() {
  // 1. ESTADOS: Toda a lógica de estado agora vive aqui, dentro deste componente.
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados dos filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('');
  const [unidadeMedidaFilter, setUnidadeMedidaFilter] = useState('');
  
  // Estados da paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  const navigate = useNavigate();

  // 2. FUNÇÃO DE BUSCA: Agora é responsabilidade deste componente buscar seus próprios dados.
  const fetchProdutos = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('authToken');

    if (!token) {
      toast.error("Sessão inválida. Por favor, faça login.");
      navigate('/login');
      return;
    }

    try {
      const params = new URLSearchParams({
        page: currentPage,
        per_page: perPage,
        search: searchTerm,
        stock_status: stockStatusFilter,
        unidade_medida: unidadeMedidaFilter,
      });

      const response = await fetch(`${API_BASE_URL}/produtos?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }
      if (!response.ok) {
        throw new Error('Erro ao buscar produtos.');
      }

      const data = await response.json();
      setProdutos(data.items);
      setTotalPages(data.total_pages);

    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      if (err.message.includes('Sessão expirada')) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm, stockStatusFilter, unidadeMedidaFilter, navigate]);

  // 3. useEffect: Dispara a busca de dados quando o componente monta ou quando um filtro/página muda.
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProdutos();
    }, 300); // Um pequeno delay para não fazer requests a cada letra digitada
    return () => clearTimeout(timer);
  }, [fetchProdutos]);

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;
    
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`${API_BASE_URL}/produtos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) throw new Error('Sessão expirada');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir produto');
      }

      toast.success('Produto excluído com sucesso!');
      fetchProdutos(); // Atualiza a lista após a exclusão

    } catch (error) {
      toast.error(error.message);
      if (error.message.includes('Sessão expirada')) navigate('/login');
    }
  };
  
  const handleApplyFilters = () => {
    setCurrentPage(1); // Volta para a primeira página ao aplicar filtros
    fetchProdutos();
  };

  // 4. RENDERIZAÇÃO: O JSX que estava no App.js, agora aqui.
  return (
    <div className="product-list-container">
      <h2>Produtos em Estoque</h2>
      
      <div className="action-bar-local">
        {/* O <Link> é a forma correta de criar um link de navegação */}
        <Link to="/produtos/novo" className="btn-primary">Adicionar Novo Produto</Link>
      </div>

      <div className="filters-container">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome ou código..."
        />
        <select value={stockStatusFilter} onChange={(e) => setStockStatusFilter(e.target.value)}>
          <option value="">Status do Estoque</option>
          <option value="disponivel">Disponível</option>
          <option value="baixo">Estoque Baixo</option>
          <option value="em_falta">Em Falta</option>
        </select>
        <input
          type="text"
          value={unidadeMedidaFilter}
          onChange={(e) => setUnidadeMedidaFilter(e.target.value)}
          placeholder="Unidade de Medida..."
        />
        <button onClick={handleApplyFilters} className="btn-filter">Buscar</button>
      </div>

      {loading && <p>Carregando produtos...</p>}
      {error && <p className="error-message">{error}</p>}
      
      {!loading && !error && (
        <>
          <table className="product-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Código</th>
                <th>Estoque</th>
                <th>Preço Venda</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.length > 0 ? produtos.map((produto) => (
                <tr key={produto.id}>
                  <td>{produto.nome}</td>
                  <td>{produto.codigo}</td>
                  <td>{produto.estoque_atual} {produto.unidade_medida}</td>
                  <td>R$ {produto.preco_venda.toFixed(2)}</td>
                  <td>
                    {/* O navigate() é usado para ações programáticas, como botões */}
                    <button onClick={() => navigate(`/produtos/${produto.id}`)} className="btn-secondary">Detalhes</button>
                    <button onClick={() => navigate(`/produtos/editar/${produto.id}`)} className="btn-edit">Editar</button>
                    <button onClick={() => handleDelete(produto.id)} className="btn-delete">Excluir</button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5">Nenhum produto encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination-controls">
              <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>Anterior</button>
              <span>Página {currentPage} de {totalPages}</span>
              <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>Próximo</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ProdutoList;