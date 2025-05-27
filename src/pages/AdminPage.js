// src/pages/AdminPage.js
import React, { useState, useEffect } from 'react';

const AdminPage = () => {
  const [linkGerado, setLinkGerado] = useState('');
  const [erroGeracao, setErroGeracao] = useState('');
  const [adminToken, setAdminToken] = useState(''); // Estado para armazenar o token

  useEffect(() => {
    // Tente obter o token do armazenamento local ao carregar a página
    const storedToken = localStorage.getItem('adminToken');
    if (storedToken) {
      setAdminToken(storedToken);
    } else {
      // Se não houver token, talvez redirecione para a página de login
      console.log('Nenhum token de administrador encontrado.');
      // history.push('/admin/login'); // Se você tiver um sistema de rotas
    }
  }, []);

  const handleGerarLink = async () => {
    if (!adminToken) {
      setErroGeracao('Você não está autenticado como administrador.');
      return;
    }

    try {
      const response = await fetch('/api/admin/gerar-link-depoimento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`, // Inclua o token no header
        },
      });

      const data = await response.json();

      if (response.ok) {
        setLinkGerado(data.link);
        setErroGeracao('');
      } else {
        setLinkGerado('');
        setErroGeracao(data.erro || 'Erro ao gerar o link.');
      }
    } catch (error) {
      console.error('Erro ao gerar o link:', error);
      setLinkGerado('');
      setErroGeracao('Ocorreu um erro ao comunicar com o servidor.');
    }
  };

  return (
    <div>
      <h1>Painel de Administração</h1>
      <button onClick={handleGerarLink} disabled={!adminToken}>
        Gerar Link de Depoimento
      </button>
      {!adminToken && (
        <p style={{ color: 'orange' }}>Você precisa estar logado como administrador para usar esta função.</p>
      )}

      {linkGerado && (
        <div>
          <h2>Link Gerado:</h2>
          <p>
            <input type="text" value={linkGerado} readOnly style={{ width: '500px' }} />
            <button onClick={() => navigator.clipboard.writeText(linkGerado)}>Copiar</button>
          </p>
        </div>
      )}

      {erroGeracao && (
        <p style={{ color: 'red' }}>Erro: {erroGeracao}</p>
      )}
    </div>
  );
};

export default AdminPage;