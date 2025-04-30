import React from 'react';
import { Outlet } from 'react-router-dom';
// Importe aqui seus componentes de layout para o administrador (sidebar, header do admin, etc.)
import AdminSidebar from '../components/AdminSidebar'; // Exemplo
import AdminHeader from '../components/AdminHeader'; // Exemplo
import './AdminLayout.css'; // Crie este arquivo CSS se precisar

function AdminLayout() {
  return (
    <div className="admin-layout-container">
      <AdminSidebar />
      <div className="admin-layout-content">
        <AdminHeader />
        <Outlet /> {/* Onde as rotas filhas de administração serão renderizadas */}
      </div>
    </div>
  );
}

export default AdminLayout;