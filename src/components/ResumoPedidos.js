import React from "react";
import { Card } from "./ui/card";
import { PackageCheck, Clock, Truck, Loader2 } from "lucide-react";

const icones = {
  pendente: <Clock className="w-5 h-5 mr-2 text-yellow-600" />,
  fazendo: <Loader2 className="w-5 h-5 mr-2 text-blue-600 animate-spin" />,
  pronto: <PackageCheck className="w-5 h-5 mr-2 text-green-600" />,
  entregue: <Truck className="w-5 h-5 mr-2 text-gray-600" />,
};

const cores = {
  pendente: "bg-yellow-100",
  fazendo: "bg-blue-100",
  pronto: "bg-green-100",
  entregue: "bg-gray-100",
};

const ResumoPedidos = ({ pedidos }) => {
  const totais = pedidos.reduce(
    (acc, pedido) => {
      acc[pedido.status] += 1;
      return acc;
    },
    { pendente: 0, fazendo: 0, pronto: 0, entregue: 0 }
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {Object.entries(totais).map(([status, total]) => (
        <Card
          key={status}
          className={`p-4 flex items-center justify-center rounded-2xl shadow-sm ${cores[status]}`}
        >
          {icones[status]}
          <div className="text-sm font-medium">{total} {status}</div>
        </Card>
      ))}
    </div>
  );
};

export default ResumoPedidos;
