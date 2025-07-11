// src/pages/ProdutoDetalhes.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

function ProdutoDetalhes() {
  const [produto, setProduto] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams(); // Pega o ID da URL, ex: /produtos/15
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduto = async () => {
      const token = localStorage.getItem('authToken');
      try {
        const response = await fetch(`http://localhost:5000/produtos/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Produto não encontrado');
        const data = await response.json();
        setProduto(data);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduto();
  }, [id]); // Roda o efeito sempre que o ID na URL mudar

  if (loading) return <p>Carregando detalhes do produto...</p>;
  if (!produto) return <p>Produto não encontrado.</p>;

  return (
    <div className="detail-container">
      <h2>Detalhes do Produto: {produto.nome}</h2>
      <div className="detail-card">
        <p><strong>Código:</strong> {produto.codigo}</p>
        <p><strong>Estoque Atual:</strong> {produto.estoque_atual} {produto.unidade_medida}</p>
        <p><strong>Preço de Venda:</strong> R$ {produto.preco_venda.toFixed(2)}</p>
        {/* Adicione todos os outros campos aqui... */}
      </div>
      <button onClick={() => navigate('/produtos')} className="btn-secondary">
        Voltar para a Lista
      </button>
      <button onClick={() => navigate(`/produtos/editar/${id}`)} className="btn-edit">
        Editar Produto
      </button>
    </div>
  );
}

export default ProdutoDetalhes;