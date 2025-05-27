import React, { useState, useEffect, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import './GerenciarDepoimentos.css';
import { FaSortUp, FaSortDown } from 'react-icons/fa'; // Importe ícones de ordenação

const GerenciarDepoimentos = () => {
  const [depoimentos, setDepoimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [statusFilter, setStatusFilter] = useState('todos');

  const buscarDepoimentos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setError('Não autenticado.');
        setLoading(false);
        return;
      }
      const idToken = await user.getIdToken();
      const response = await fetch('/api/admin/depoimentos', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Erro ao buscar depoimentos: ${response.status}`);
      }
      const data = await response.json();
      setDepoimentos(data);
      setLoading(false);
      setCurrentPage(1);
      setSortColumn(null);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }, []);

  const atualizarStatusDepoimento = useCallback(async (id, novoStatus) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setError('Não autenticado.');
        return;
      }
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/admin/depoimentos/${id}/atualizar-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ status: novoStatus }),
      });
      if (!response.ok) {
        throw new Error(`Erro ao atualizar o status: ${response.status}`);
      }
      buscarDepoimentos();
      setFeedbackMessage(`Depoimento ${id} foi ${novoStatus} com sucesso!`);
      setTimeout(() => setFeedbackMessage(''), 3000);
    } catch (e) {
      setError(e.message);
      setFeedbackMessage(`Erro ao atualizar o depoimento ${id}: ${e.message}`);
      setTimeout(() => setFeedbackMessage(''), 5000);
    }
  }, [buscarDepoimentos]);

  const getFilteredAndSortedDepoimentos = useCallback(() => {
    const filtered = statusFilter === 'todos'
      ? depoimentos
      : depoimentos.filter(depoimento => depoimento.status === statusFilter);

    if (!sortColumn) {
      return filtered;
    }

    return [...filtered].sort((a, b) => {
      const valueA = a[sortColumn];
      const valueB = b[sortColumn];
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        const comparison = valueA.localeCompare(valueB);
        return sortDirection === 'asc' ? comparison : -comparison;
      } else if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      } else if (valueA instanceof Date && valueB instanceof Date) {
        return sortDirection === 'asc' ? valueA.getTime() - valueB.getTime() : valueB.getTime() - valueA.getTime();
      } else {
        return 0;
      }
    });
  }, [depoimentos, statusFilter, sortColumn, sortDirection]);

  useEffect(() => {
    buscarDepoimentos();
  }, [buscarDepoimentos]);

  const filteredAndSortedDepoimentos = getFilteredAndSortedDepoimentos();
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDepoimentos = filteredAndSortedDepoimentos.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSort = (columnName) => {
    if (sortColumn === columnName) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnName);
      setSortDirection('asc');
    }
  };

  return (
    <div className="gerenciar-depoimentos">
      <h2>Gerenciar Depoimentos</h2>
      {feedbackMessage && <div className="feedback-message">{feedbackMessage}</div>}
      <div className="filters">
        <button className={statusFilter === 'todos' ? 'active' : ''} onClick={() => setStatusFilter('todos')}>Todos</button>
        <button className={statusFilter === 'pendente' ? 'active' : ''} onClick={() => setStatusFilter('pendente')}>Pendentes</button>
        <button className={statusFilter === 'aprovado' ? 'active' : ''} onClick={() => setStatusFilter('aprovado')}>Aprovados</button>
        <button className={statusFilter === 'rejeitado' ? 'active' : ''} onClick={() => setStatusFilter('rejeitado')}>Rejeitados</button>
      </div>
      {loading ? (
        <p>Carregando depoimentos...</p>
      ) : error ? (
        <p>Erro: {error}</p>
      ) : depoimentos.length === 0 ? (
        <p>Nenhum depoimento encontrado.</p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('nome_completo')} style={{ cursor: 'pointer' }}>
                  Nome {sortColumn === 'nome_completo' && (sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />)}
                </th>
                <th onClick={() => handleSort('depoimento')} style={{ cursor: 'pointer' }}>
                  Depoimento {sortColumn === 'depoimento' && (sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />)}
                </th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                  Status {sortColumn === 'status' && (sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />)}
                </th>
                <th onClick={() => handleSort('data_criacao')} style={{ cursor: 'pointer' }}>
                  Data de Envio {sortColumn === 'data_criacao' && (sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />)}
                </th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {currentDepoimentos.map((depoimento) => (
                <tr key={depoimento.id}>
                  <td>{depoimento.nome_completo}</td>
                  <td>{depoimento.depoimento}</td>
                  <td>{depoimento.status}</td>
                  <td>{depoimento.data_criacao && new Date(depoimento.data_criacao.seconds * 1000).toLocaleDateString()}</td>
                  <td>
                    {depoimento.status === 'pendente' && (
                      <>
                        <button onClick={() => atualizarStatusDepoimento(depoimento.id, 'aprovado')}>Aprovar</button>
                        <button onClick={() => atualizarStatusDepoimento(depoimento.id, 'rejeitado')}>Rejeitar</button>
                      </>
                    )}
                    {depoimento.status === 'aprovado' && (
                      <button onClick={() => atualizarStatusDepoimento(depoimento.id, 'pendente')}>Tornar Pendente</button>
                    )}
                    {depoimento.status === 'rejeitado' && (
                      <button onClick={() => atualizarStatusDepoimento(depoimento.id, 'pendente')}>Tornar Pendente</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            {Array.from({ length: Math.ceil(filteredAndSortedDepoimentos.length / itemsPerPage) }, (_, i) => i + 1).map(number => (
              <button
                key={number}
                onClick={() => paginate(number)}
                className={currentPage === number ? 'active' : ''}
              >
                {number}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default GerenciarDepoimentos;