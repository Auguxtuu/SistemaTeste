import React from 'react';
import { useParams } from 'react-router-dom';

function ProdutoDetalhes() {
  const { id } = useParams(); // Pega o ID do produto da URL

  return (
    <div>
      <h2>Detalhes do Produto</h2>
      <p>Exibindo detalhes para o produto com ID: {id}</p>
      <p>A lógica para buscar e exibir os detalhes de um produto específico virá aqui.</p>
    </div>
  );
}

export default ProdutoDetalhes;