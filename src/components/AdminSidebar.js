import React from 'react';

function AdminSidebar() {
  return (
    <div className="admin-sidebar" style={{ backgroundColor: '#f0f0f0', padding: '20px', borderRight: '1px solid #ccc' }}>
      <h3>Admin Menu</h3>
      <ul>
        <li>Dashboard</li>
        <li>Pedidos</li>
        <li>Produtos</li>
        <li>Configurações</li>
      </ul>
      {/* Adicione seus links de navegação do admin aqui */}
    </div>
  );
}

export default AdminSidebar;