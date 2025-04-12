import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const PedidoCard = ({ pedido, onStatusChange }) => {
  const coresStatus = {
    pendente: "bg-yellow-200 text-yellow-800",
    fazendo: "bg-blue-200 text-blue-800",
    pronto: "bg-green-200 text-green-800",
    entregue: "bg-gray-200 text-gray-800",
  };

  const handleChange = (e) => {
    onStatusChange(pedido.id, e.target.value);
  };

  return (
    <Card className="w-full md:max-w-md mb-4 shadow-md rounded-2xl">
      <CardContent className="p-4 space-y-2">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">{pedido.nomeCliente}</h2>
          <span className={`px-3 py-1 rounded-full text-sm ${coresStatus[pedido.status]}`}>
            {pedido.status}
          </span>
        </div>
        <p className="text-sm text-gray-600">Produto: {pedido.produto}</p>
        <p className="text-sm text-gray-600">Data: {pedido.data}</p>
        <p className="text-sm text-gray-600">Valor: R$ {pedido.valor}</p>
        <select
          value={pedido.status}
          onChange={handleChange}
          className="mt-2 p-2 border rounded-md text-sm"
        >
          <option value="pendente">Pendente</option>
          <option value="fazendo">Fazendo</option>
          <option value="pronto">Pronto</option>
          <option value="entregue">Entregue</option>
        </select>
      </CardContent>
    </Card>
  );
};

export default PedidoCard;