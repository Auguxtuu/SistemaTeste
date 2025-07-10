// src/components/Sidebar.js
import React, { useState } from 'react';
import styles from '../CSSs/Sidebar.module.css';

// Sidebar NÃO FAZ chamadas fetch diretamente, mas as funções onNavigate acionam
// as funções do App.js que usam getAuthHeaders.
function Sidebar({ onNavigate }) {
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <h2>Menu</h2>
      </div>
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          <li className={styles.navItem}>
            <button
              className={`${styles.navButton} ${openSection === 'gerenciamento' ? styles.activeSection : ''}`}
              onClick={() => toggleSection('gerenciamento')}
            >
              Gerenciamento
              <span className={styles.arrow}>{openSection === 'gerenciamento' ? '▼' : '▶'}</span>
            </button>
            {openSection === 'gerenciamento' && (
              <ul className={styles.subList}>
                <li className={styles.subItem}>
                  <button onClick={() => onNavigate('showProductList')} className={styles.subButton}>
                    Produtos
                  </button>
                </li>
                <li className={styles.subItem}>
                  <button onClick={() => onNavigate('showMovimentacaoForm')} className={styles.subButton}>
                    Registrar Movimentação
                  </button>
                </li>
                <li className={styles.subItem}>
                  <button onClick={() => onNavigate('showMovimentacaoList')} className={styles.subButton}>
                    Histórico de Movimentações
                  </button>
                </li>
                <li className={styles.subItem}>
                  <button onClick={() => onNavigate('showFornecedorList')} className={styles.subButton}>
                    Fornecedores
                  </button>
                </li>
                <li className={styles.subItem}>
                  <button onClick={() => onNavigate('showClienteList')} className={styles.subButton}>
                    Clientes
                  </button>
                </li>
              </ul>
            )}
          </li>

          <li className={styles.navItem}>
            <button
              className={`${styles.navButton} ${openSection === 'relatorios' ? styles.activeSection : ''}`}
              onClick={() => toggleSection('relatorios')}
            >
              Relatórios
              <span className={styles.arrow}>{openSection === 'relatorios' ? '▼' : '▶'}</span>
            </button>
            {openSection === 'relatorios' && (
              <ul className={styles.subList}>
                <li className={styles.subItem}>
                  <button onClick={() => onNavigate('showRelatorioEstoqueCritico', 'baixo')} className={styles.subButton}>
                    Estoque Crítico
                  </button>
                </li>
                {/* Futuramente, você pode adicionar mais relatórios aqui */}
              </ul>
            )}
          </li>

          {/* Botão para o Dashboard (pode ser sempre visível) */}
          <li className={styles.navItem}>
            <button onClick={() => onNavigate('showDashboard')} className={styles.navButton}>
              Dashboard
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;