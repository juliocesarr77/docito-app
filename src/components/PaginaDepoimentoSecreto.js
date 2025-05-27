import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const PaginaDepoimentoSecreto = () => {
  const { token } = useParams();
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [avaliacao, setAvaliacao] = useState(0); // Ou null, dependendo da sua implementação
  const [depoimento, setDepoimento] = useState('');
  const [publicarNome, setPublicarNome] = useState(true);
  const [tokenValido, setTokenValido] = useState(null);
  const [mensagemErroToken, setMensagemErroToken] = useState('');
  const [nomePublicoPreview, setNomePublicoPreview] = useState('');

  useEffect(() => {
    const verificarToken = async () => {
      try {
        const response = await fetch(`/api/depoimentos/verificar-token/${token}`);
        const data = await response.json();
        if (response.ok && data.valido) {
          setTokenValido(true);
        } else {
          setTokenValido(false);
          setMensagemErroToken(data.erro || 'Token inválido.');
        }
      } catch (error) {
        console.error('Erro ao verificar o token:', error);
        setTokenValido(false);
        setMensagemErroToken('Ocorreu um erro ao verificar o token.');
      }
    };

    verificarToken();
  }, [token]);

  const handlePublicarNomeChange = (event) => {
    setPublicarNome(!event.target.checked);
    const partesDoNome = nomeCompleto.split(' ');
    const preview = partesDoNome.map((parte, index) => {
      if (index === 0 || index === partesDoNome.length - 1) {
        return parte.charAt(0) + '*'.repeat(parte.length - 1);
      } else if (partesDoNome.length > 2) {
        return '*'.repeat(parte.length);
      } else {
        return parte.charAt(0) + '*'.repeat(parte.length - 1);
      }
    }).join(' ');
    setNomePublicoPreview(preview);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!tokenValido) {
      alert('O link para o depoimento é inválido.');
      return;
    }

    try {
      const response = await fetch('/api/depoimentos/enviar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome_completo: nomeCompleto,
          avaliacao: parseInt(avaliacao),
          depoimento: depoimento,
          publicar_nome: publicarNome,
          token: token,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.mensagem);
        // Redirecionar o usuário ou mostrar uma mensagem de agradecimento
      } else {
        alert(data.erro || 'Erro ao enviar o depoimento.');
      }
    } catch (error) {
      console.error('Erro ao enviar o depoimento:', error);
      alert('Ocorreu um erro ao enviar o depoimento. Tente novamente.');
    }
  };

  if (tokenValido === null) {
    return <p>Verificando o link...</p>;
  }

  if (!tokenValido) {
    return <p>{mensagemErroToken}</p>;
  }

  return (
    <div>
      <h1>Deixe seu Depoimento Secreto!</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="nomeCompleto">Seu Nome Completo:</label>
          <input
            type="text"
            id="nomeCompleto"
            value={nomeCompleto}
            onChange={(e) => setNomeCompleto(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="avaliacao">Avaliação (1 a 5):</label>
          <input
            type="number"
            id="avaliacao"
            min="1"
            max="5"
            value={avaliacao}
            onChange={(e) => setAvaliacao(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="depoimento">Seu Depoimento:</label>
          <textarea
            id="depoimento"
            value={depoimento}
            onChange={(e) => setDepoimento(e.target.value)}
            rows="5"
            required
          />
        </div>
        <div>
          <label>
            Não quero ser identificado publicamente:
            <input
              type="checkbox"
              checked={!publicarNome}
              onChange={handlePublicarNomeChange}
            />
          </label>
          {!publicarNome && nomeCompleto && <p>Seu nome aparecerá como: {nomePublicoPreview}</p>}
        </div>
        <button type="submit">Enviar Depoimento</button>
      </form>
    </div>
  );
};

export default PaginaDepoimentoSecreto;