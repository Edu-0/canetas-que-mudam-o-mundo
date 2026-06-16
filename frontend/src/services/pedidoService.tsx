import api from "./api";

export type StatusPedidoMaterial =
  | "AGUARDANDO_APROVACAO"
  | "AGUARDANDO_RETIRADA"
  | "MATERIAL_COLETADO"
  | "CANCELADO";

export type MaterialDisponivel = {
  tipo_material: string;
  quantidade_disponivel: number;
};

export type ItemPedidoMaterial = {
  tipo_material: string;
  quantidade: number;
};

export type PedidoMaterial = {
  id: number;
  responsavel_id: number;
  familiar_id: number;
  ong_id: number;
  status: StatusPedidoMaterial;
  codigo_coleta?: string;
  prazo_retirada_limite?: string;
  notificacao_aprovacao_enviada_em?: string;
  created_at: string;
  updated_at: string;
  itens: Array<{
    id: number;
    pedido_material_id: number;
    tipo_material: string;
    quantidade: number;
    status: StatusPedidoMaterial;
    aprovado_em?: string;
    coletado_em?: string;
    notificado_disponivel_em?: string;
    created_at: string;
    updated_at: string;
  }>;
};

export async function obterMateriaisDisponiveis(
  ong_id: number
): Promise<MaterialDisponivel[]> {
  const response = await api.get<MaterialDisponivel[]>(
    `/pedidos/materiais-disponiveis?ong_id=${ong_id}`
  );
  return response.data;
}

export async function listarMeusPedidos(): Promise<PedidoMaterial[]> {
  const response = await api.get<PedidoMaterial[]>("/pedidos/");
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
