import React from 'react';

function AdminHeader() {
  return (
    <div className="admin-header" style={{ backgroundColor: '#e0e0e0', padding: '10px', borderBottom: '1px solid #ccc' }}>
      <h2>Painel de Administração</h2>
      {/* Adicione informações do usuário admin ou outras coisas aqui */}
    </div>
  );
}

export default AdminHeader;