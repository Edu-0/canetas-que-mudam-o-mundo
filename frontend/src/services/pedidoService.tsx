import api from "./api";

export type MaterialDisponivel = {
  tipo_material: string;
  quantidade_disponivel: number;
};

export type ItemPedidoMaterial = {
  tipo_material: string;
  quantidade: number;
};

export async function obterMateriaisDisponiveis(
  ong_id: number
): Promise<MaterialDisponivel[]> {
  const response = await api.get<MaterialDisponivel[]>(
    `/pedidos/materiais-disponiveis?ong_id=${ong_id}`
  );
  return response.data;
}

export async function criarPedidoMaterial(
  pedido: {
    ong_id: number;
    familiar_id: number;
    itens: ItemPedidoMaterial[];
  }
) {
  const response = await api.post("/pedidos/", pedido);
  return response.data;
}
