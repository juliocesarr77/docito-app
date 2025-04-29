import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { PedidosProvider } from './context/PedidosContext';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <PedidosProvider>
    <App />
  </PedidosProvider>
);
