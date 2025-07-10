import React, { useState, useEffect, useCallback } from 'react';
import ProdutoForm from './components/ProdutoForm';
import MovimentacaoForm from './components/MovimentacaoForm';
import MovimentacaoList from './components/MovimentacaoList';
import RelatorioEstoqueCritico from './components/RelatorioEstoqueCritico';
import Dashboard from './components/Dashboard';
import FornecedorList from './components/FornecedorList';
import FornecedorForm from './components/FornecedorForm';
import ClienteList from './components/ClienteList';
import ClienteForm from './components/ClienteForm';
import Sidebar from './components/Sidebar';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

const API_BASE_URL = 'http://localhost:5000';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('authToken') ? true : false);
  const [showLoginForm, setShowLoginForm] = useState(!isAuthenticated);
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken') || null);
  const [loggedInUser, setLoggedInUser] = useState(localStorage.getItem('username') || null);

  const [produtos, setProdutos] = useState([]);
  const [produtoSelecionadoParaEditar, setProdutoSelecionadoParaEditar] = useState(null);
  const [produtoSelecionadoParaVisualizar, setProdutoSelecionadoParaVisualizar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('');
  const [unidadeMedidaFilter, setUnidadeMedidaFilter] = useState('');
  const [showMovimentacaoForm, setShowMovimentacaoForm] = useState(false);
  const [showMovimentacaoList, setShowMovimentacaoList] = useState(false);
  const [showRelatorioEstoqueCritico, setShowRelatorioEstoqueCritico] = useState(false);
  const [showDashboard, setShowDashboard] = useState(isAuthenticated);

  const [showFornecedorList, setShowFornecedorList] = useState(false);
  const [fornecedorSelecionadoParaEditar, setFornecedorSelecionadoParaEditar] = useState(null);

  const [showClienteList, setShowClienteList] = useState(false);
  const [clienteSelecionadoParaEditar, setClienteSelecionadoParaEditar] = useState(null);

  const [currentPageProdutos, setCurrentPageProdutos] = useState(1);
  const [perPageProdutos, setPerPageProdutos] = useState(10);
  const [totalPagesProdutos, setTotalPagesProdutos] = useState(1);
  const [totalItemsProdutos, setTotalItemsProdutos] = useState(0);

  const getAuthHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    };
  }, [authToken]);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setAuthToken(null);
    setLoggedInUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    setShowLoginForm(true); // Volta para a tela de login
    toast.info("Você foi desconectado.");
  }, []);

  const fetchProdutos = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/produtos`;
      const params = new URLSearchParams();

      if (searchTerm) { params.append('search', searchTerm); }
      if (stockStatusFilter) { params.append('stock_status', stockStatusFilter); }
      if (unidadeMedidaFilter) { params.append('unidade_medida', unidadeMedidaFilter); }
      params.append('page', currentPageProdutos);
      params.append('per_page', perPageProdutos);

      if (params.toString()) { url = `${API_BASE_URL}/produtos?${params.toString()}`; }

      const response = await fetch(url, { headers: getAuthHeaders() });
      if (!response.ok) {
        if (response.status === 401 || response.status === 422) {
          handleLogout();
          toast.error("Sessão expirada ou inválida. Por favor, faça login novamente.");
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProdutos(data.items);
      setTotalPagesProdutos(data.total_pages);
      setTotalItemsProdutos(data.total_items);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      toast.error("Erro ao carregar produtos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, stockStatusFilter, unidadeMedidaFilter, currentPageProdutos, perPageProdutos,
      isAuthenticated, getAuthHeaders, handleLogout]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const isProductListActive = !produtoSelecionadoParaEditar && !produtoSelecionadoParaVisualizar &&
                                  !showMovimentacaoForm && !showMovimentacaoList && !showRelatorioEstoqueCritico &&
                                  !showDashboard && !showFornecedorList && !fornecedorSelecionadoParaEditar &&
                                  !showClienteList && !clienteSelecionadoParaEditar;
      
      if (isAuthenticated && isProductListActive) {
         fetchProdutos();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchProdutos, isAuthenticated, produtoSelecionadoParaEditar, produtoSelecionadoParaVisualizar,
      showMovimentacaoForm, showMovimentacaoList, showRelatorioEstoqueCritico,
      showDashboard, showFornecedorList, fornecedorSelecionadoParaEditar,
      showClienteList, clienteSelecionadoParaEditar]);

  const resetAllViews = useCallback(() => {
    setProdutoSelecionadoParaEditar(null);
    setProdutoSelecionadoParaVisualizar(null);
    setShowMovimentacaoForm(false);
    setShowMovimentacaoList(false);
    setShowRelatorioEstoqueCritico(false);
    setShowFornecedorList(false);
    setFornecedorSelecionadoParaEditar(null);
    setShowClienteList(false);
    setClienteSelecionadoParaEditar(null);
    setShowDashboard(true);
  }, []);

  const handleAuthSuccess = (token, username) => { // AGORA RECEBE TOKEN E USERNAME
    setIsAuthenticated(true);
    setAuthToken(token);
    setLoggedInUser(username);
    localStorage.setItem('authToken', token);
    localStorage.setItem('username', username);
    setShowLoginForm(false);
    setShowDashboard(true);
    toast.success("Login realizado com sucesso!");
  };

  const handleShowLoginForm = () => { setShowLoginForm(true); };
  const handleShowRegisterForm = () => { setShowLoginForm(false); };
  const handleSaveSuccess = () => { resetAllViews(); setCurrentPageProdutos(1); toast.success("Operação realizada com sucesso!"); };

  const handleEdit = (produto) => { if (!isAuthenticated) { toast.error("Por favor, faça login para acessar esta funcionalidade."); return; } resetAllViews(); setShowDashboard(false); setProdutoSelecionadoParaEditar(produto); };
  const handleViewDetails = (produto) => { if (!isAuthenticated) { toast.error("Por favor, faça login para acessar esta funcionalidade."); return; } resetAllViews(); setShowDashboard(false); setProdutoSelecionadoParaVisualizar(produto); };
  const handleCloseDetailView = () => { resetAllViews(); };

  const handleDelete = async (id) => {
    if (!isAuthenticated) { toast.error("Por favor, faça login para acessar esta funcionalidade."); return; }
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) { return; }
    try {
      const response = await fetch(`${API_BASE_URL}/produtos/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (!response.ok) {
        if (response.status === 401 || response.status === 422) { handleLogout(); toast.error("Sessão expirada ou inválida. Faça login novamente."); return; }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir produto');
      }
      toast.success('Produto excluído com sucesso!');
      setCurrentPageProdutos(1);
      fetchProdutos();
    } catch (error) { console.error("Erro ao excluir produto:", error); toast.error("Erro: " + (error.message || "Não foi possível excluir o produto.")); }
  };

  const handleShowMovimentacaoForm = () => { if (!isAuthenticated) { toast.error("Por favor, faça login para acessar esta funcionalidade."); return; } resetAllViews(); setShowDashboard(false); setShowMovimentacaoForm(true); };
  const handleCancelMovimentacaoForm = () => { setShowMovimentacaoForm(false); setShowDashboard(true); };

  const handleShowMovimentacaoList = (filterTipo = '') => { if (!isAuthenticated) { toast.error("Por favor, faça login para acessar esta funcionalidade."); return; } resetAllViews(); setShowDashboard(false); setShowMovimentacaoList(true); };
  const handleShowRelatorioEstoqueCritico = (reportType = 'baixo') => { if (!isAuthenticated) { toast.error("Por favor, faça login para acessar esta funcionalidade."); return; } resetAllViews(); setShowDashboard(false); setShowRelatorioEstoqueCritico(true); };
  const handleCancelRelatorioEstoqueCritico = () => { setShowRelatorioEstoqueCritico(false); setShowDashboard(true); };
  const handleShowProductList = () => { if (!isAuthenticated) { toast.error("Por favor, faça login para acessar esta funcionalidade."); return; } resetAllViews(); setShowDashboard(false); };
  const handleShowFornecedorList = () => { if (!isAuthenticated) { toast.error("Por favor, faça login para acessar esta funcionalidade."); return; } resetAllViews(); setShowDashboard(false); setShowFornecedorList(true); };
  const handleEditFornecedor = (fornecedor) => { if (!isAuthenticated) { toast.error("Por favor, faça login para acessar esta funcionalidade."); return; } resetAllViews(); setShowDashboard(false); setShowFornecedorList(false); setFornecedorSelecionadoParaEditar(fornecedor); };
  const handleCancelFornecedorForm = () => { setFornecedorSelecionadoParaEditar(null); setShowFornecedorList(true); };
  const handleFornecedorSaveSuccess = () => { setFornecedorSelecionadoParaEditar(null); setShowFornecedorList(true); toast.success("Fornecedor salvo com sucesso!"); };
  const handleShowClienteList = () => { if (!isAuthenticated) { toast.error("Por favor, faça login para acessar esta funcionalidade."); return; } resetAllViews(); setShowDashboard(false); setShowClienteList(true); };
  const handleEditCliente = (cliente) => { if (!isAuthenticated) { toast.error("Por favor, faça login para acessar esta funcionalidade."); return; } resetAllViews(); setShowDashboard(false); setShowClienteList(false); setClienteSelecionadoParaEditar(cliente); };
  const handleCancelClienteForm = () => { setClienteSelecionadoParaEditar(null); setShowClienteList(true); };
  const handleClienteSaveSuccess = () => { setClienteSelecionadoParaEditar(null); setShowClienteList(true); toast.success("Cliente salvo com sucesso!"); };

  const handleProdutoClickFromOtherComponents = useCallback(async (produtoId) => {
    if (!isAuthenticated) { toast.error("Por favor, faça login para acessar esta funcionalidade."); return; }
    try {
      const response = await fetch(`${API_BASE_URL}/produtos/${produtoId}`, { headers: getAuthHeaders() });
      if (!response.ok) {
        if (response.status === 401 || response.status === 422) { handleLogout(); toast.error("Sessão expirada ou inválida. Faça login novamente."); return; }
        throw new Error('Produto não encontrado.');
      }
      const data = await response.json();
      handleViewDetails(data);
    } catch (err) { console.error("Erro ao buscar produto: " + err.message); toast.error("Erro ao buscar produto: " + err.message); }
  }, [handleViewDetails, isAuthenticated, getAuthHeaders, handleLogout]);

  const handlePageChangeProdutos = (newPage) => {
    if (!isAuthenticated) { toast.error("Por favor, faça login para acessar esta funcionalidade."); return; }
    if (newPage > 0 && newPage <= totalPagesProdutos) { setCurrentPageProdutos(newPage); }
  };
  const handlePerPageChangeProdutos = (e) => {
    if (!isAuthenticated) { toast.error("Por favor, faça login para acessar esta funcionalidade."); return; }
    setPerPageProdutos(parseInt(e.target.value));
    setCurrentPageProdutos(1);
  };

  const shouldShowList = !produtoSelecionadoParaEditar && !produtoSelecionadoParaVisualizar &&
                         !showMovimentacaoForm && !showMovimentacaoList && !showRelatorioEstoqueCritico &&
                         !showDashboard && !showFornecedorList && !fornecedorSelecionadoParaEditar &&
                         !showClienteList && !clienteSelecionadoParaEditar;


  return (
    <div className="App">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      
      {!isAuthenticated ? (
        <div className="auth-flow-container">
          <h1>Controle de Estoque</h1>
          {showLoginForm ? (
            <LoginForm onLoginSuccess={handleAuthSuccess} onRegisterClick={handleShowRegisterForm} />
          ) : (
            <RegisterForm onRegistrationSuccess={handleAuthSuccess} onLoginClick={handleShowLoginForm} />
          )}
        </div>
      ) : (
        <>
          <Sidebar
            onNavigate={(target, param = null) => {
              resetAllViews();
              setShowDashboard(false);

              switch (target) {
                case 'showDashboard': setShowDashboard(true); break;
                case 'showProductList': handleShowProductList(); break;
                case 'showMovimentacaoForm': handleShowMovimentacaoForm(); break;
                case 'showMovimentacaoList': handleShowMovimentacaoList(param); break;
                case 'showRelatorioEstoqueCritico': handleShowRelatorioEstoqueCritico(param); break;
                case 'showFornecedorList': handleShowFornecedorList(); break;
                case 'showClienteList': handleShowClienteList(); break;
                default: setShowDashboard(true); break;
              }
            }}
          />

          <div className="main-content">
            <h1>Controle de Estoque</h1>

            <div className="back-to-dashboard-container">
              {!showDashboard && (
                <button onClick={handleCloseDetailView} className="btn-secondary">Voltar ao Dashboard</button>
              )}
              {isAuthenticated && (
                <button onClick={handleLogout} className="btn-danger" style={{marginLeft: '10px'}}>Logout ({loggedInUser})</button>
              )}
            </div>
            
            {showDashboard && (
              <Dashboard
                onShowList={handleShowProductList}
                onShowMovimentacaoForm={handleShowMovimentacaoForm}
                onShowMovimentacaoList={handleShowMovimentacaoList}
                onShowRelatorioEstoqueCritico={handleShowRelatorioEstoqueCritico}
                onViewProductDetails={handleProdutoClickFromOtherComponents}
                onShowFornecedorList={handleShowFornecedorList}
                onShowClienteList={handleShowClienteList}
                getAuthHeaders={getAuthHeaders} // PASSA getAuthHeaders como prop
              />
            )}

            {produtoSelecionadoParaEditar && !showDashboard && (
              <div className="form-section">
                <ProdutoForm
                  produtoParaEditar={produtoSelecionadoParaEditar && produtoSelecionadoParaEditar.id ? produtoSelecionadoParaEditar : null}
                  onSaveSuccess={handleSaveSuccess}
                  getAuthHeaders={getAuthHeaders} // PASSA getAuthHeaders como prop
                />
              </div>
            )}

            {showMovimentacaoForm && !showDashboard && (
              <div className="form-section">
                <MovimentacaoForm
                  onSaveSuccess={handleSaveSuccess}
                  onCancel={handleCancelMovimentacaoForm}
                  getAuthHeaders={getAuthHeaders} // PASSA getAuthHeaders como prop
                />
              </div>
            )}

            {showMovimentacaoList && !showDashboard && (
              <div className="list-section">
                <MovimentacaoList 
                  onProdutoClick={handleProdutoClickFromOtherComponents} 
                  onCancel={handleCloseDetailView}
                  getAuthHeaders={getAuthHeaders} // PASSA getAuthHeaders como prop
                />
              </div>
            )}

            {showRelatorioEstoqueCritico && !showDashboard && (
              <div className="report-section">
                <RelatorioEstoqueCritico
                  onProdutoClick={handleProdutoClickFromOtherComponents}
                  onCancel={handleCloseDetailView}
                  getAuthHeaders={getAuthHeaders} // PASSA getAuthHeaders como prop
                />
              </div>
            )}

            {produtoSelecionadoParaVisualizar && !showDashboard && (
              <div className="detail-section">
                <h2>Detalhes do Produto</h2>
                <div className="detail-card">
                  <p><strong>ID:</strong> {produtoSelecionadoParaVisualizar.id}</p>
                  <p><strong>Nome:</strong> {produtoSelecionadoParaVisualizar.nome}</p>
                  <p><strong>Código:</strong> {produtoSelecionadoParaVisualizar.codigo}</p>
                  <p><strong>Descrição:</strong> {produtoSelecionadoParaVisualizar.descricao || 'N/A'}</p>
                  <p><strong>Unidade de Medida:</strong> {produtoSelecionadoParaVisualizar.unidade_medida}</p>
                  <p><strong>Estoque Atual:</strong> {produtoSelecionadoParaVisualizar.estoque_atual}</p>
                  <p><strong>Estoque Mínimo:</strong> {produtoSelecionadoParaVisualizar.estoque_minimo}</p>
                  <p><strong>Localização:</strong> {produtoSelecionadoParaVisualizar.localizacao || 'N/A'}</p>
                  <p><strong>Preço de Compra:</strong> R$ {produtoSelecionadoParaVisualizar.preco_compra ? produtoSelecionadoParaVisualizar.preco_compra.toFixed(2) : '0.00'}</p>
                  <p><strong>Preço de Venda:</strong> R$ {produtoSelecionadoParaVisualizar.preco_venda ? produtoSelecionadoParaVisualizar.preco_venda.toFixed(2) : '0.00'}</p>

                  <p><strong>Fornecedor:</strong> {produtoSelecionadoParaVisualizar.fornecedor_nome || 'N/A'} {produtoSelecionadoParaVisualizar.fornecedor_id ? `(ID: ${produtoSelecionadoParaVisualizar.fornecedor_id})` : ''}</p>


                  <h3 className="detail-sub-heading">Informações Fiscais</h3>
                  <p><strong>NCM:</strong> {produtoSelecionadoParaVisualizar.ncm || 'N/A'}</p>
                  <p><strong>CST/CSOSN:</strong> {produtoSelecionadoParaVisualizar.cst_csosn || 'N/A'}</p>
                  <p><strong>CFOP:</strong> {produtoSelecionadoParaVisualizar.cfop || 'N/A'}</p>
                  <p><strong>Origem Mercadoria:</strong> {produtoSelecionadoParaVisualizar.origem_mercadoria || 'N/A'}</p>

                  <h4 className="detail-sub-heading">ICMS</h4>
                  <p><strong>Alíquota:</strong> {produtoSelecionadoParaVisualizar.icms_aliquota ? produtoSelecionadoParaVisualizar.icms_aliquota.toFixed(2) : '0.00'}%</p>
                  <p><strong>Valor:</strong> R$ {produtoSelecionadoParaVisualizar.icms_valor ? produtoSelecionadoParaVisualizar.icms_valor.toFixed(2) : '0.00'}</p>

                  <h4 className="detail-sub-heading">IPI</h4>
                  <p><strong>Alíquota:</strong> {produtoSelecionadoParaVisualizar.ipi_aliquota ? produtoSelecionadoParaVisualizar.ipi_aliquota.toFixed(2) : '0.00'}%</p>
                  <p><strong>Valor:</strong> R$ {produtoSelecionadoParaVisualizar.ipi_valor ? produtoSelecionadoParaVisualizar.ipi_valor.toFixed(2) : '0.00'}</p>

                  <h4 className="detail-sub-heading">PIS</h4>
                  <p><strong>Alíquota:</strong> {produtoSelecionadoParaVisualizar.pis_aliquota ? produtoSelecionadoParaVisualizar.pis_aliquota.toFixed(2) : '0.00'}%</p>
                  <p><strong>Valor:</strong> R$ {produtoSelecionadoParaVisualizar.pis_valor ? produtoSelecionadoParaVisualizar.pis_valor.toFixed(2) : '0.00'}</p>

                  <h4 className="detail-sub-heading">COFINS</h4>
                  <p><strong>Alíquota:</strong> {produtoSelecionadoParaVisualizar.cofins_aliquota ? produtoSelecionadoParaVisualizar.cofins_aliquota.toFixed(2) : '0.00'}%</p>
                  <p><strong>Valor:</strong> R$ {produtoSelecionadoParaVisualizar.cofins_valor ? produtoSelecionadoParaVisualizar.cofins_valor.toFixed(2) : '0.00'}</p>

                  <p><strong>Informações Adicionais NF-e:</strong> {produtoSelecionadoParaVisualizar.info_adicionais_nf || 'N/A'}</p>

                  <div className="detail-actions">
                    <button onClick={() => handleEdit(produtoSelecionadoParaVisualizar)} className="btn-edit">Editar Produto</button>
                    <button onClick={() => handleDelete(produtoSelecionadoParaVisualizar.id)} className="btn-delete">Excluir Produto</button>
                  </div>
                </div>
              </div>
            )}

            {showFornecedorList && !showDashboard && (
              <div className="list-section">
                <FornecedorList
                  onEditFornecedor={handleEditFornecedor}
                  onCancel={handleCloseDetailView}
                  onShowAddFornecedorForm={() => handleEditFornecedor({})}
                  getAuthHeaders={getAuthHeaders} // PASSA getAuthHeaders como prop
                />
              </div>
            )}

            {fornecedorSelecionadoParaEditar && !showDashboard && (
              <div className="form-section">
                <FornecedorForm
                  fornecedorParaEditar={fornecedorSelecionadoParaEditar.id ? fornecedorSelecionadoParaEditar : null}
                  onSaveSuccess={handleFornecedorSaveSuccess}
                  onCancel={handleCancelFornecedorForm}
                  getAuthHeaders={getAuthHeaders} // PASSA getAuthHeaders como prop
                />
              </div>
            )}

            {showClienteList && !showDashboard && (
              <div className="list-section">
                <ClienteList
                  onEditCliente={handleEditCliente}
                  onCancel={handleCloseDetailView}
                  onShowAddClienteForm={() => handleEditCliente({})}
                  getAuthHeaders={getAuthHeaders} // PASSA getAuthHeaders como prop
                />
              </div>
            )}

            {clienteSelecionadoParaEditar && !showDashboard && (
              <div className="form-section">
                <ClienteForm
                  clienteParaEditar={clienteSelecionadoParaEditar.id ? clienteSelecionadoParaEditar : null}
                  onSaveSuccess={handleClienteSaveSuccess}
                  onCancel={handleCancelClienteForm}
                  getAuthHeaders={getAuthHeaders} // PASSA getAuthHeaders como prop
                />
              </div>
            )}


            {shouldShowList && (
              <div className="list-section">
                <h2>Produtos em Estoque</h2>
                <div className="action-bar-local">
                  <button onClick={() => handleEdit({})} className="btn-primary">Adicionar Novo Produto</button>
                </div>
                <div className="filters-container">
                  <label htmlFor="search">Buscar (Nome/Código):</label>
                  <input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome ou código..."
                  />
                  <label htmlFor="stockStatus">Status do Estoque:</label>
                  <select
                    id="stockStatus"
                    value={stockStatusFilter}
                    onChange={(e) => setStockStatusFilter(e.target.value)}
                  >
                    <option value="">Todos</option>
                    <option value="disponivel">Disponível</option>
                    <option value="baixo">Estoque Baixo</option>
                    <option value="em_falta">Em Falta</option>
                  </select>
                  <label htmlFor="unidadeMedida">Unidade de Medida:</label>
                  <input
                    type="text"
                    id="unidadeMedida"
                    value={unidadeMedidaFilter}
                    onChange={(e) => setUnidadeMedidaFilter(e.target.value)}
                    placeholder="Ex: UN, KG, M..."
                  />
                  <button onClick={fetchProdutos} className="btn-filter">Aplicar Filtros</button>
                </div>

                {loading ? (
                  <p>Carregando produtos...</p>
                ) : (
                  <>
                    {produtos.length === 0 && <p>Nenhum produto encontrado com os filtros aplicados.</p>}
                    {produtos.length > 0 && (
                      <table className="product-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>Código</th>
                            <th>Estoque</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {produtos.map((produto) => (
                            <tr key={produto.id}>
                              <td>{produto.id}</td>
                              <td>{produto.nome}</td>
                              <td>{produto.codigo}</td>
                              <td>{produto.estoque_atual} {produto.unidade_medida}</td>
                              <td>
                                <button onClick={() => handleViewDetails(produto)} className="btn-secondary">Ver Detalhes</button>
                                <button onClick={() => handleDelete(produto.id)} className="btn-delete">Excluir</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {/* Controles de Paginação de Produtos */}
                    {totalPagesProdutos > 1 && (
                      <div className="pagination-controls">
                        <button onClick={() => handlePageChangeProdutos(currentPageProdutos - 1)} disabled={currentPageProdutos === 1} className="btn-pagination">Anterior</button>
                        <span>Página {currentPageProdutos} de {totalPagesProdutos}</span>
                        <button onClick={() => handlePageChangeProdutos(currentPageProdutos + 1)} disabled={currentPageProdutos === totalPagesProdutos} className="btn-pagination">Próximo</button>
                        <select onChange={handlePerPageChangeProdutos} value={perPageProdutos} className="pagination-select">
                          <option value="5">5 por página</option>
                          <option value="10">10 por página</option>
                          <option value="20">20 por página</option>
                        </select>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;