import api from "./api";

// pedidos (igual estrutura de doações)
export async function obterPedidos(params: {ordem: "asc" | "desc"; status?: string;}) {
  return api.get("/pedidos/", {params: {ordem: params.ordem, status: params.status,},
  });
}

// atualizar status do pedido
export async function atualizarStatusPedido(itemId: number, dados: { status: string }) {
  return api.patch(`/pedidos/itens/${itemId}/status`, dados);
}