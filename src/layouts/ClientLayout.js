import React from 'react';
import { Outlet } from 'react-router-dom';
// import Header from '../components/Header'; // Comente a importação
// import Footer from '../components/Footer'; // Comente a importação

function ClientLayout() {
  return (
    <div>
      <Outlet /> {/* Onde as rotas filhas serão renderizadas */}
    </div>
  );
}

export default ClientLayout;